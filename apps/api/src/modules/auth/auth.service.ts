import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private normalizeEmail(value: string) {
    return String(value || '').toLowerCase().trim();
  }

  private getPlatformAdminEmails() {
    const raw = this.config.get<string>('PLATFORM_ADMIN_EMAILS') || '';
    return new Set(
      raw
        .split(',')
        .map((v) => this.normalizeEmail(v))
        .filter(Boolean),
    );
  }

  private isAllowlistedPlatformAdminEmail(email: string) {
    const set = this.getPlatformAdminEmails();
    return set.has(this.normalizeEmail(email));
  }

  private async isDbPlatformAdmin(userId: string) {
    try {
      const row = await (this.prisma as any).user.findUnique({
        where: { id: userId },
        select: { isPlatformAdmin: true },
      });
      return !!row?.isPlatformAdmin;
    } catch {
      return false;
    }
  }

  private async resolvePlatformAdminStatus(userId: string, email: string) {
    if (await this.isDbPlatformAdmin(userId)) return true;
    return this.isAllowlistedPlatformAdminEmail(email);
  }

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Register now creates only a platform account.
    // Club membership is assigned later by admin via management workflow.
    const userCreateData: any = {
      email,
      passwordHash,
      fullName: dto.fullName,
      isPlatformAdmin: this.isAllowlistedPlatformAdminEmail(email),
      playerProfile: {
        create: {},
      },
    };

    let user: any;
    try {
      user = await this.prisma.user.create({
        data: userCreateData,
        include: {
          memberships: {
            orderBy: { createdAt: 'desc' },
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  billingPlan: true,
                  subscriptionStatus: true,
                },
              },
            },
          },
          playerProfile: true,
        },
      });
    } catch (error: any) {
      if (!String(error?.message || '').includes('isPlatformAdmin')) {
        throw error;
      }

      const fallbackData = { ...userCreateData };
      delete fallbackData.isPlatformAdmin;
      user = await this.prisma.user.create({
        data: fallbackData,
        include: {
          memberships: {
            orderBy: { createdAt: 'desc' },
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  billingPlan: true,
                  subscriptionStatus: true,
                },
              },
            },
          },
          playerProfile: true,
        },
      });
    }

    const accessToken = await this.signAccessToken(user.id, user.email);
    return { user: this.safeUser(user), accessToken };
  }

  async me(userId: string, clubId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
          include: {
            club: {
              select: {
                id: true,
                name: true,
                slug: true,
                billingPlan: true,
                subscriptionStatus: true,
              },
            },
          },
        },
        playerProfile: true,
      },
    });

    if (!user) throw new ForbiddenException('User not found');

    let activeMembership = null as any;

    if (clubId) {
      activeMembership = user.memberships.find((m) => m.clubId === clubId);
      if (!activeMembership)
        throw new ForbiddenException('No access to this club');
    } else {
      activeMembership = user.memberships[0] || null;
    }

    const safe = this.safeUser(user);
    const isPlatformAdmin = await this.resolvePlatformAdminStatus(
      user.id,
      user.email,
    );

    return {
      user: safe,
      memberships: user.memberships.map((m) => ({
        clubId: m.clubId,
        primary: m.primary,
        subRoles: m.subRoles,
        club: m.club,
      })),
      activeClubId: activeMembership?.clubId ?? null,
      activeMembership: activeMembership
        ? {
            clubId: activeMembership.clubId,
            primary: activeMembership.primary,
            subRoles: activeMembership.subRoles,
            club: activeMembership.club,
          }
        : null,
      isPlatformAdmin,
    };
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          orderBy: { createdAt: 'desc' },
          include: {
            club: {
              select: {
                id: true,
                name: true,
                slug: true,
                billingPlan: true,
                subscriptionStatus: true,
              },
            },
          },
        },
        playerProfile: true,
      },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.signAccessToken(user.id, user.email);
    return { user: this.safeUser(user), accessToken };
  }

  private signAccessToken(userId: string, email: string) {
    return this.jwt.signAsync({ sub: userId, email });
  }

  private safeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
