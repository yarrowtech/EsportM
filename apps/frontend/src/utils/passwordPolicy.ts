export type PasswordRule = {
  id: "length" | "uppercase" | "lowercase" | "number" | "special";
  label: string;
  shortLabel: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    shortLabel: "8+ chars",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    shortLabel: "Uppercase",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    shortLabel: "Lowercase",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "One number",
    shortLabel: "Number",
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "One special character",
    shortLabel: "Special",
    test: (password) => /[^\sA-Za-z0-9]/.test(password),
  },
];

export function getPasswordRuleStatus(password: string) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    met: rule.test(password),
  }));
}

export function isStrongPassword(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
