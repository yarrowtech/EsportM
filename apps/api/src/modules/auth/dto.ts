import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_POLICY_MESSAGE } from '../../common/security/password-policy';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[A-Z]/, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[a-z]/, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[0-9]/, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[^\sA-Za-z0-9]/, { message: PASSWORD_POLICY_MESSAGE })
  password!: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class UpdateMyAvatarDto {
  @IsString()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2000)
  avatarUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  avatarPublicId?: string;
}
