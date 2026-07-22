import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { PASSWORD_POLICY_MESSAGE } from '../../common/security/password-policy';

export class AcceptInvitationDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsString()
  @MinLength(8, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[A-Z]/, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[a-z]/, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[0-9]/, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[^\sA-Za-z0-9]/, { message: PASSWORD_POLICY_MESSAGE })
  password!: string;
}

export class ResendInvitationDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  clubId?: string; // optional if you use tokenHash based resend; else pass clubId
}

export class RevokeInvitationDto {
  @IsEmail()
  email!: string;

  @IsString()
  clubId!: string;
}

export class AcceptAssignedInvitationDto {
  @IsString()
  @MinLength(1)
  invitationId!: string;
}
