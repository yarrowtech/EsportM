import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { PrimaryRole, SubRole } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateClubDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase and kebab-case (e.g., my-club-1)',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  ownerUserId?: string;

  @IsOptional()
  @IsEmail()
  ownerEmail?: string;
}

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsEnum(PrimaryRole)
  primary!: PrimaryRole;

  @IsOptional()
  @IsArray()
  @IsEnum(SubRole, { each: true })
  subRoles?: SubRole[];
}

export class UpdateMemberRoleDto {
  @IsOptional()
  @IsEnum(PrimaryRole)
  primary?: PrimaryRole;

  @IsOptional()
  @IsArray()
  @IsEnum(SubRole, { each: true })
  subRoles?: SubRole[];
}

export class AssignSignupDto {
  @IsString()
  @MinLength(1)
  userId!: string;

  @IsEnum(PrimaryRole)
  primary!: PrimaryRole;

  @IsOptional()
  @IsArray()
  @IsEnum(SubRole, { each: true })
  subRoles?: SubRole[];
}

export class UpdateClubThemeDto {
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'primary must be a 6-digit hex color (e.g., #FFC840)',
  })
  primary?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'deep must be a 6-digit hex color (e.g., #141820)',
  })
  deep?: string;
}

export class UpdateClubLogoDto {
  @IsString()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2000)
  logoUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  logoPublicId?: string;
}

export class PendingSignupsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  @IsIn(['CLUB', 'GLOBAL'])
  scope?: 'CLUB' | 'GLOBAL';
}
