import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrimaryRole, SubRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { assertPasswordPolicy } from '../../common/security/password-policy';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  private hashToken(raw: string) {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private normalizeRoleKey(value: string) {
    return String(value || '').toUpperCase().trim();
  }

  private async assertRolesEnabled(
    clubId: string,
    primary: PrimaryRole,
    subRoles: SubRole[],
  ) {
    const hasCaptainTag = Array.isArray(subRoles)
      ? subRoles.includes(SubRole.CAPTAIN)
      : false;
    if (hasCaptainTag && primary !== PrimaryRole.PLAYER) {
      throw new BadRequestException(
        "Captain tag can only be assigned when primary role is PLAYER",
      );
    }

    try {
      const disabled = await (this.prisma as any).clubRoleSetting.findMany({
        where: { clubId, isEnabled: false },
        select: { roleKey: true },
      });
      const disabledSet = new Set(
        disabled.map((row: any) => this.normalizeRoleKey(String(row.roleKey || ''))),
      );

      const primaryKey = this.normalizeRoleKey(primary);
      if (disabledSet.has(primaryKey)) {
        throw new BadRequestException(
          `Primary role '${primaryKey}' is disabled for this club by superadmin`,
        );
      }
      for (const subRole of subRoles || []) {
        const subRoleKey = this.normalizeRoleKey(subRole);
        if (disabledSet.has(subRoleKey)) {
          throw new BadRequestException(
            `Sub-role '${subRoleKey}' is disabled for this club by superadmin`,
          );
        }
      }
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.includes('disabled for this club by superadmin')) {
        throw error;
      }
    }
  }

  async getByToken(token: string) {
    const t = token?.trim();
    if (!t) throw new BadRequestException('Invalid token');

    const tokenHash = this.hashToken(t);

    const invite = await this.prisma.invitation.findUnique({
      where: { tokenHash },
      include: { club: true },
    });

    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.usedAt) throw new BadRequestException('Invitation already used');
    if (invite.expiresAt.getTime() < Date.now())
      throw new BadRequestException('Invitation expired');

    return {
      ok: true,
      invitation: {
        email: invite.email,
        clubId: invite.clubId,
        clubName: invite.club.name,
        primary: invite.primary,
        subRoles: invite.subRoles,
        expiresAt: invite.expiresAt,
      },
    };
  }

  async accept(dto: { token: string; fullName: string; password: string }) {
    const token = dto.token?.trim();
    if (!token) throw new BadRequestException('Invalid token');
    assertPasswordPolicy(dto.password);

    const tokenHash = this.hashToken(token);

    const invite = await this.prisma.invitation.findUnique({
      where: { tokenHash },
    });

    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.usedAt) throw new BadRequestException('Invitation already used');
    if (invite.expiresAt.getTime() < Date.now())
      throw new BadRequestException('Invitation expired');

    await this.assertRolesEnabled(
      invite.clubId,
      invite.primary,
      invite.subRoles as SubRole[],
    );

    const email = invite.email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        fullName: dto.fullName.trim(),
        passwordHash,
      },
      create: {
        email,
        fullName: dto.fullName.trim(),
        passwordHash,
      },
    });

    const membership = await this.prisma.membership.upsert({
      where: { userId_clubId: { userId: user.id, clubId: invite.clubId } },
      update: {
        primary: invite.primary,
        subRoles: invite.subRoles,
      },
      create: {
        userId: user.id,
        clubId: invite.clubId,
        primary: invite.primary,
        subRoles: invite.subRoles,
      },
    });

    await this.prisma.invitation.updateMany({
      where: {
        clubId: invite.clubId,
        email,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    return {
      ok: true,
      user: { id: user.id, email: user.email, fullName: user.fullName },
      membership,
    };
  }

  // In-app pending assignments for logged-in users.
  async getMyPending(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const hasMembership = await this.prisma.membership.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (hasMembership) {
      return [];
    }

    const invites = await (this.prisma as any).invitation.findMany({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
        OR: [
          { userId },
          { userId: null, email: user.email.toLowerCase().trim() },
        ],
        club: {
          memberships: {
            none: {
              userId,
            },
          },
        },
      },
      include: {
        club: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map((invite) => ({
      invitationId: invite.id,
      clubId: invite.clubId,
      club: invite.club,
      primary: invite.primary,
      subRoles: invite.subRoles,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
    }));
  }

  async acceptAssignment(userId: string, invitationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const invite = await (this.prisma as any).invitation.findUnique({
      where: { id: invitationId },
      include: {
        club: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.usedAt) throw new BadRequestException('Invitation already used');
    if (invite.expiresAt.getTime() < Date.now())
      throw new BadRequestException('Invitation expired');

    const existingOtherMembership = await this.prisma.membership.findFirst({
      where: {
        userId: user.id,
        clubId: { not: invite.clubId },
      },
      select: { id: true },
    });
    if (existingOtherMembership) {
      throw new ForbiddenException(
        'User already belongs to another club and cannot accept this assignment',
      );
    }

    await this.assertRolesEnabled(
      invite.clubId,
      invite.primary,
      invite.subRoles as SubRole[],
    );

    const inviteUserId = String(invite.userId || '').trim();
    if (inviteUserId && inviteUserId !== user.id) {
      throw new ForbiddenException(
        'This assignment does not belong to this user',
      );
    }

    // Backward compatibility for old email-bound assignments.
    if (!inviteUserId) {
      const inviteEmail = invite.email.toLowerCase().trim();
      const userEmail = user.email.toLowerCase().trim();
      if (inviteEmail !== userEmail) {
        throw new ForbiddenException(
          'This invitation does not belong to this user',
        );
      }
    }

    const membership = await this.prisma.membership.upsert({
      where: { userId_clubId: { userId: user.id, clubId: invite.clubId } },
      update: {
        primary: invite.primary,
        subRoles: invite.subRoles,
      },
      create: {
        userId: user.id,
        clubId: invite.clubId,
        primary: invite.primary,
        subRoles: invite.subRoles,
      },
      include: {
        club: { select: { id: true, name: true, slug: true } },
      },
    });

    // Mark all active assignments for this user as used to prevent cross-club conflicts.
    if (inviteUserId) {
      await (this.prisma as any).invitation.updateMany({
        where: {
          OR: [{ userId: inviteUserId }, { email: invite.email.toLowerCase().trim() }],
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
    } else {
      const inviteEmail = invite.email.toLowerCase().trim();
      await this.prisma.invitation.updateMany({
        where: {
          OR: [{ userId: user.id }, { email: inviteEmail }],
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
    }

    return {
      ok: true,
      membership: {
        clubId: membership.clubId,
        primary: membership.primary,
        subRoles: membership.subRoles,
        club: membership.club,
      },
    };
  }

  // Used by ClubsService invite/assignment creation.
  async createInvite(params: {
    clubId: string;
    email: string;
    userId?: string;
    primary: PrimaryRole;
    subRoles: SubRole[];
    ttlMinutes?: number;
  }) {
    await this.assertRolesEnabled(params.clubId, params.primary, params.subRoles);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + (params.ttlMinutes ?? 60 * 24) * 60 * 1000,
    );

    const invite = await (this.prisma as any).invitation.create({
      data: {
        clubId: params.clubId,
        userId: params.userId ? params.userId.trim() : null,
        email: params.email.toLowerCase().trim(),
        tokenHash,
        expiresAt,
        primary: params.primary,
        subRoles: params.subRoles ?? [],
      },
    });

    return { inviteId: invite.id, token: rawToken, expiresAt };
  }

  async revoke(clubId: string, email: string) {
    const e = email.toLowerCase().trim();
    const revoked = await this.prisma.invitation.deleteMany({
      where: {
        clubId,
        email: e,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (revoked.count === 0)
      throw new NotFoundException('No active invitation found');

    return { ok: true, revoked: revoked.count };
  }

  async resend(clubId: string, email: string) {
    const e = email.toLowerCase().trim();
    const latest = await this.prisma.invitation.findFirst({
      where: { clubId, email: e },
      orderBy: { createdAt: 'desc' },
      select: { primary: true, subRoles: true },
    });
    if (!latest) throw new NotFoundException('Invitation not found for this user');

    await this.prisma.invitation.deleteMany({
      where: { clubId, email: e, usedAt: null },
    });

    return this.createInvite({
      clubId,
      email: e,
      primary: latest.primary,
      subRoles: latest.subRoles,
      ttlMinutes: 60 * 24,
    });
  }
}
