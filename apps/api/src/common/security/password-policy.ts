import { BadRequestException } from '@nestjs/common';

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';

export function passwordPolicyFailures(password: string) {
  const value = String(password || '');
  const failures: string[] = [];

  if (value.length < 8) failures.push('at least 8 characters');
  if (!/[A-Z]/.test(value)) failures.push('an uppercase letter');
  if (!/[a-z]/.test(value)) failures.push('a lowercase letter');
  if (!/[0-9]/.test(value)) failures.push('a number');
  if (!/[^\sA-Za-z0-9]/.test(value)) failures.push('a special character');

  return failures;
}

export function assertPasswordPolicy(password: string) {
  const failures = passwordPolicyFailures(password);
  if (failures.length) {
    throw new BadRequestException({
      message: PASSWORD_POLICY_MESSAGE,
      requirements: failures,
    });
  }
}
