/**
 * Password strength. Deliberately dependency-free: a full estimator like
 * zxcvbn is a large bundle for what this needs, which is to stop the
 * genuinely weak choices — short, one character class, or built from the
 * person's own name or email.
 *
 * The score is advisory in the UI and authoritative on the server: every
 * place that sets a password calls `validatePassword` before hashing.
 */

export const MIN_PASSWORD_LENGTH = 10;

/** Scores at or above this are accepted. */
export const MIN_PASSWORD_SCORE = 2;

/** Substrings common enough that including one wipes out the rest of the score. */
const COMMON_PATTERNS = [
  "password",
  "passwd",
  "qwerty",
  "asdf",
  "letmein",
  "welcome",
  "iloveyou",
  "admin",
  "abc123",
  "111111",
  "123456",
  "12345678",
  "monkey",
  "dragon",
  "olive",
  "institute",
];

export type PasswordAssessment = {
  /** 0 (unusable) to 4 (strong). */
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
  /** What to fix, most important first. Empty once the password is accepted. */
  issues: string[];
};

const LABELS: PasswordAssessment["label"][] = [
  "Too weak",
  "Weak",
  "Fair",
  "Good",
  "Strong",
];

/** Splits a name or email into the pieces a password shouldn't simply repeat. */
function personalTokens(context: { name?: string; email?: string }): string[] {
  const parts: string[] = [];
  if (context.name) parts.push(...context.name.split(/\s+/));
  if (context.email) {
    const [local, domain] = context.email.split("@");
    if (local) parts.push(...local.split(/[._\-+]/));
    if (domain) parts.push(domain.split(".")[0]);
  }
  return parts
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length >= 4);
}

export function assessPasswordStrength(
  password: string,
  context: { name?: string; email?: string } = {},
): PasswordAssessment {
  const issues: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const classes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (classes < 2) {
    issues.push("Mix in capitals, numbers, or symbols.");
  }

  const lowered = password.toLowerCase();

  const hasCommon = COMMON_PATTERNS.some((pattern) => lowered.includes(pattern));
  if (hasCommon) {
    issues.push("Avoid common words and sequences.");
  }

  const usesPersonal = personalTokens(context).some((token) =>
    lowered.includes(token),
  );
  if (usesPersonal) {
    issues.push("Don't reuse your name or email address.");
  }

  // Long passphrases are strong even with one character class, so length
  // carries most of the weight and variety tops it up.
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 14) score += 1;
  if (password.length >= 20) score += 1;
  if (classes >= 3) score += 1;
  if (classes >= 2 && password.length >= 12) score += 1;

  if (hasCommon || usesPersonal) score = Math.min(score, 1);
  if (password.length < MIN_PASSWORD_LENGTH || classes < 2) {
    score = Math.min(score, 1);
  }

  const clamped = Math.max(0, Math.min(4, score)) as PasswordAssessment["score"];

  return {
    score: clamped,
    label: LABELS[clamped],
    issues: clamped >= MIN_PASSWORD_SCORE ? [] : issues,
  };
}

/** Server-side gate. Returns an error message, or null when the password is fine. */
export function validatePassword(
  password: string,
  context: { name?: string; email?: string } = {},
): string | null {
  const assessment = assessPasswordStrength(password, context);
  if (assessment.score >= MIN_PASSWORD_SCORE) return null;
  return (
    assessment.issues[0] ??
    `Choose a stronger password (at least ${MIN_PASSWORD_LENGTH} characters).`
  );
}
