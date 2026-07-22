import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrimaryRole, SubRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertCloudinarySecureUrl,
  createCloudinaryUploadSignature,
} from '../../common/media/cloudinary-signature';
import {
  AssignSignupDto,
  CreateClubDto,
  InviteMemberDto,
  PendingSignupsQueryDto,
  UpdateClubLogoDto,
  UpdateMemberRoleDto,
} from './dto';
import { InvitationsService } from '../invitations/invitations.service';

@Injectable()
export class ClubsService {
  constructor(
    private prisma: PrismaService,
    private invitations: InvitationsService,
    private config: ConfigService,
  ) {}

  private slugify(input: string) {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async requireClubAdmin(userId: string, clubId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true },
    });
    if (!membership) throw new NotFoundException('Club not found (or no access)');
    if (membership.primary !== PrimaryRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update club profile media');
    }
  }

  private getPlatformAdminEmails() {
    const raw = this.config.get<string>('PLATFORM_ADMIN_EMAILS') || '';
    return new Set(
      raw
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  private normalizeRoleKey(value: string) {
    return String(value || '').toUpperCase().trim();
  }

  private async getDisabledRoleKeySet(clubId: string) {
    try {
      const rows = await (this.prisma as any).clubRoleSetting.findMany({
        where: { clubId, isEnabled: false },
        select: { roleKey: true },
      });
      return new Set(
        rows.map((row: any) => this.normalizeRoleKey(String(row.roleKey || ''))),
      );
    } catch {
      return new Set<string>();
    }
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

    const disabled = await this.getDisabledRoleKeySet(clubId);
    const primaryKey = this.normalizeRoleKey(primary);
    if (disabled.has(primaryKey)) {
      throw new BadRequestException(
        `Primary role '${primaryKey}' is disabled for this club by superadmin`,
      );
    }

    for (const subRole of subRoles) {
      const subRoleKey = this.normalizeRoleKey(subRole);
      if (disabled.has(subRoleKey)) {
        throw new BadRequestException(
          `Sub-role '${subRoleKey}' is disabled for this club by superadmin`,
        );
      }
    }
  }

  private async resolveCreator(userId: string) {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, isPlatformAdmin: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const allowlist = this.getPlatformAdminEmails();
    const isPlatformAdmin =
      !!user.isPlatformAdmin ||
      allowlist.has(String(user.email || '').toLowerCase().trim());

    return { user, isPlatformAdmin };
  }

  async createClub(userId: string, dto: CreateClubDto) {
    const { user: creator, isPlatformAdmin } = await this.resolveCreator(userId);

    const slug = dto.slug?.trim() || this.slugify(dto.name);

    if (!slug) throw new BadRequestException('Invalid club name/slug');

    const ownerUserId = String(dto.ownerUserId || '').trim();
    const ownerEmail = String(dto.ownerEmail || '').toLowerCase().trim();
    const ownerSpecified = !!ownerUserId || !!ownerEmail;
    let owner: { id: string; email: string; fullName: string | null } | null = null;

    if (isPlatformAdmin) {
      // Superadmin can provision clubs for another existing user.
      if (ownerSpecified) {
        owner = ownerUserId
          ? await this.prisma.user.findUnique({
              where: { id: ownerUserId },
              select: { id: true, email: true, fullName: true },
            })
          : await this.prisma.user.findUnique({
              where: { email: ownerEmail },
              select: { id: true, email: true, fullName: true },
            });
      } else {
        // Superadmin self-create fallback.
        owner = {
          id: creator.id,
          email: creator.email,
          fullName: creator.fullName,
        };
      }
    } else {
      // Founder flow: only self-create allowed, and only when user has no club yet.
      if (ownerSpecified) {
        throw new ForbiddenException(
          'Only platform admin can create a club for another user',
        );
      }

      const existingMembership = await this.prisma.membership.findFirst({
        where: { userId: creator.id },
        select: { id: true, clubId: true },
      });
      if (existingMembership) {
        throw new ForbiddenException(
          'You already belong to a club. Club creation is only for new founders.',
        );
      }

      owner = {
        id: creator.id,
        email: creator.email,
        fullName: creator.fullName,
      };
    }

    if (!owner) {
      throw new NotFoundException(
        'Club owner user not found. Ask owner to sign up first.',
      );
    }

    let finalSlug = slug;
    const exists = await this.prisma.club.findUnique({
      where: { slug: finalSlug },
    });
    if (exists) {
      finalSlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const club = await this.prisma.club.create({
      data: {
        name: dto.name.trim(),
        slug: finalSlug,
      },
    });

    await this.prisma.membership.upsert({
      where: { userId_clubId: { userId: owner.id, clubId: club.id } },
      update: {
        primary: PrimaryRole.ADMIN,
      },
      create: {
        userId: owner.id,
        clubId: club.id,
        primary: PrimaryRole.ADMIN,
        subRoles: [],
      },
    });

    return club;
  }

  async getMyClubs(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { club: true },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      primary: m.primary,
      subRoles: m.subRoles,
      club: m.club,
    }));
  }

  async getClubById(userId: string, clubId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      include: { club: true },
    });

    if (!membership)
      throw new NotFoundException('Club not found (or no access)');

    return {
      membershipId: membership.id,
      primary: membership.primary,
      subRoles: membership.subRoles,
      club: membership.club,
    };
  }

  async getClubTheme(userId: string, clubId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { clubId: true },
    });
    if (!membership) throw new NotFoundException('Club not found (or no access)');

    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, themePrimary: true, themeDeep: true },
    });
    if (!club) throw new NotFoundException('Club not found');

    return {
      clubId: club.id,
      mode: 'light' as const,
      primary: club.themePrimary || '#FFC840',
      deep: club.themeDeep || '#141820',
    };
  }

  async updateClubTheme(
    userId: string,
    clubId: string,
    dto: { primary?: string; deep?: string },
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true },
    });
    if (!membership) throw new NotFoundException('Club not found (or no access)');
    if (membership.primary !== PrimaryRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update club theme');
    }

    if (!dto.primary && !dto.deep) {
      throw new BadRequestException('primary or deep is required');
    }

    const updated = await this.prisma.club.update({
      where: { id: clubId },
      data: {
        ...(dto.primary ? { themePrimary: dto.primary } : {}),
        ...(dto.deep ? { themeDeep: dto.deep } : {}),
      },
      select: { id: true, themePrimary: true, themeDeep: true },
    });

    return {
      clubId: updated.id,
      mode: 'light' as const,
      primary: updated.themePrimary || '#FFC840',
      deep: updated.themeDeep || '#141820',
    };
  }

  async createClubLogoUploadSignature(userId: string, clubId: string) {
    await this.requireClubAdmin(userId, clubId);

    return createCloudinaryUploadSignature(this.config, {
      folder: `esportm/clubs/${clubId}/logo`,
      resourceType: 'image',
      transformation: 'c_fit,w_600,h_600,q_auto,f_auto',
    });
  }

  async updateClubLogo(userId: string, clubId: string, dto: UpdateClubLogoDto) {
    await this.requireClubAdmin(userId, clubId);
    assertCloudinarySecureUrl(this.config, dto.logoUrl, 'logoUrl');

    const updated = await (this.prisma as any).club.update({
      where: { id: clubId },
      data: { logoUrl: dto.logoUrl },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async listPendingSignups(clubId: string, query?: PendingSignupsQueryDto) {
    const scope = String(query?.scope || 'CLUB').toUpperCase() === 'GLOBAL' ? 'GLOBAL' : 'CLUB';
    const page = Math.max(1, Number(query?.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(query?.pageSize || 25)));
    const skip = (page - 1) * pageSize;
    const q = String(query?.q || '').trim();
    const now = new Date();

    if (scope === 'GLOBAL' && q.length < 2) {
      throw new BadRequestException(
        'Global signup lookup requires a search query with at least 2 characters',
      );
    }

    const activeInvites = await (this.prisma as any).invitation.findMany({
      where: {
        usedAt: null,
        expiresAt: { gt: now },
        ...(scope === 'CLUB' ? { clubId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        clubId: true,
        userId: true,
        email: true,
        primary: true,
        subRoles: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    const inviteByUserId = new Map<string, any>();
    const inviteByEmail = new Map<string, any>();
    for (const invite of activeInvites) {
      // First seen = latest due to createdAt desc ordering.
      if (invite.userId && !inviteByUserId.has(invite.userId)) {
        inviteByUserId.set(invite.userId, invite);
      }
      const key = String(invite.email || '').toLowerCase().trim();
      if (key && !inviteByEmail.has(key)) inviteByEmail.set(key, invite);
    }

    const pendingUserIds = Array.from(inviteByUserId.keys());
    const pendingEmails = Array.from(inviteByEmail.keys());

    if (scope === 'CLUB' && !pendingUserIds.length && !pendingEmails.length) {
      return {
        users: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
          hasNext: false,
          scope,
          q,
        },
      };
    }

    const userWhere: any = {
      memberships: {
        none: {},
      },
    };

    if (scope === 'CLUB') {
      userWhere.OR = [];
      if (pendingUserIds.length) {
        userWhere.OR.push({ id: { in: pendingUserIds } });
      }
      if (pendingEmails.length) {
        userWhere.OR.push({ email: { in: pendingEmails } });
      }
    }

    if (q) {
      userWhere.AND = [
        {
          OR: [
            { id: { contains: q } },
            { email: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const total = await this.prisma.user.count({ where: userWhere });
    const users = await this.prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    return {
      users: users.map((u) => {
        const pending =
          inviteByUserId.get(u.id) || inviteByEmail.get(u.email.toLowerCase()) || null;
        return {
          ...u,
          pendingAssignment: pending
            ? {
                invitationId: pending.id,
                clubId: pending.clubId,
                primary: pending.primary,
                subRoles: pending.subRoles,
                createdAt: pending.createdAt,
                expiresAt: pending.expiresAt,
              }
            : null,
        };
      }),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total ? Math.ceil(total / pageSize) : 0,
        hasNext: page * pageSize < total,
        scope,
        q,
      },
    };
  }

  async listMembers(clubId: string) {
    const rows = await this.prisma.membership.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return rows.map((m) => ({
      membershipId: m.id,
      clubId: m.clubId,
      userId: m.userId,
      primary: m.primary,
      subRoles: m.subRoles,
      createdAt: m.createdAt,
      user: m.user,
    }));
  }

  async updateMemberRole(
    clubId: string,
    userId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });

    if (!membership) throw new NotFoundException('Member not found');

    const nextPrimary = dto.primary ?? membership.primary;
    const nextSubRoles = (dto.subRoles ?? membership.subRoles) as SubRole[];
    await this.assertRolesEnabled(clubId, nextPrimary, nextSubRoles);

    if (
      dto.primary &&
      membership.primary === PrimaryRole.ADMIN &&
      dto.primary !== PrimaryRole.ADMIN
    ) {
      const admins = await this.prisma.membership.count({
        where: { clubId, primary: PrimaryRole.ADMIN },
      });
      if (admins <= 1)
        throw new BadRequestException('Cannot remove last ADMIN');
    }

    const updated = await this.prisma.membership.update({
      where: { userId_clubId: { userId, clubId } },
      data: {
        primary: nextPrimary,
        subRoles: nextSubRoles,
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    return {
      membershipId: updated.id,
      clubId: updated.clubId,
      userId: updated.userId,
      primary: updated.primary,
      subRoles: updated.subRoles,
      createdAt: updated.createdAt,
      user: updated.user,
    };
  }

  async removeMember(clubId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });

    if (!membership) throw new NotFoundException('Member not found');

    if (membership.primary === PrimaryRole.ADMIN) {
      const admins = await this.prisma.membership.count({
        where: { clubId, primary: PrimaryRole.ADMIN },
      });
      if (admins <= 1)
        throw new BadRequestException('Cannot remove last ADMIN');
    }

    await this.prisma.membership.delete({
      where: { userId_clubId: { userId, clubId } },
    });
  }

  async inviteMember(adminUserId: string, clubId: string, dto: InviteMemberDto) {
    const inviter = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId: adminUserId, clubId } },
      select: { id: true },
    });
    if (!inviter) throw new NotFoundException('Club not found');

    const email = dto.email.toLowerCase().trim();
    if (!email) throw new BadRequestException('Invalid email');
    await this.assertRolesEnabled(
      clubId,
      dto.primary,
      (dto.subRoles ?? []) as SubRole[],
    );

    const { token, expiresAt } = await this.invitations.createInvite({
      clubId,
      email,
      primary: dto.primary,
      subRoles: dto.subRoles ?? [],
      ttlMinutes: 60 * 24,
    });

    return {
      ok: true,
      invite: {
        email,
        clubId,
        primary: dto.primary,
        subRoles: dto.subRoles ?? [],
        expiresAt,
        token,
        link: `http://localhost:3000/invitations/accept?token=${token}`,
      },
    };
  }

  async assignSignupByUserId(
    adminUserId: string,
    clubId: string,
    dto: AssignSignupDto,
  ) {
    const inviter = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId: adminUserId, clubId } },
      select: { id: true },
    });
    if (!inviter) throw new NotFoundException('Club not found');

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, email: true, fullName: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // One-user-one-club safety: do not allow cross-club membership assignment.
    const existingMembership = await this.prisma.membership.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        clubId: true,
        club: { select: { name: true } },
      },
    });
    if (existingMembership) {
      if (existingMembership.clubId === clubId) {
        throw new BadRequestException('User is already a member of this club');
      }
      throw new BadRequestException(
        `User already belongs to another club (${existingMembership.club?.name || existingMembership.clubId})`,
      );
    }

    const email = user.email.toLowerCase().trim();
    const primary = dto.primary;
    const subRoles = (dto.subRoles ?? []) as SubRole[];
    await this.assertRolesEnabled(clubId, primary, subRoles);

    const invitation = (this.prisma as any).invitation;
    const existingInvite = await invitation.findFirst({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
        OR: [{ userId: user.id }, { email }],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, clubId: true },
    });

    if (existingInvite) {
      if (existingInvite.clubId !== clubId) {
        throw new BadRequestException(
          'User already has a pending assignment from another club',
        );
      }

      const updated = await invitation.update({
        where: { id: existingInvite.id },
        data: {
          userId: user.id,
          primary,
          subRoles,
        },
        select: {
          id: true,
          clubId: true,
          userId: true,
          email: true,
          primary: true,
          subRoles: true,
          createdAt: true,
          expiresAt: true,
        },
      });

      return {
        userId: user.id,
        fullName: user.fullName,
        invitationId: updated.id,
        clubId: updated.clubId,
        email: updated.email,
        primary: updated.primary,
        subRoles: updated.subRoles,
        createdAt: updated.createdAt,
        expiresAt: updated.expiresAt,
      };
    }

    const { inviteId, expiresAt } = await this.invitations.createInvite({
      clubId,
      email,
      userId: user.id,
      primary,
      subRoles,
      ttlMinutes: 60 * 24 * 7,
    });

    return {
      userId: user.id,
      fullName: user.fullName,
      invitationId: inviteId,
      clubId,
      email,
      primary,
      subRoles,
      expiresAt,
    };
  }
}
