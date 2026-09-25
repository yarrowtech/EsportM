export function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.split("T")[0];
}

export function normalizePositions(input?: string | null) {
  if (!input) return [];
  return input
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

export function calculateAge(dob?: string | null) {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const monthDiff = today.getMonth() - born.getMonth();
  const dayDiff = today.getDate() - born.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function calculateBmi(heightCm?: number | null, weightKg?: number | null) {
  if (!heightCm || !weightKg) return null;
  const meters = heightCm / 100;
  if (meters <= 0) return null;
  const bmi = weightKg / (meters * meters);
  return Number.isFinite(bmi) ? Number(bmi.toFixed(1)) : null;
}

export type FitnessTone = "good" | "warn" | "alert" | "neutral";

export type FitnessDescriptor = {
  label: string;
  tone: FitnessTone;
  bmi: number | null;
};

export function describeFitnessLevel(
  profile?: { heightCm?: number | null; weightKg?: number | null } | null,
): FitnessDescriptor {
  const bmi = calculateBmi(profile?.heightCm ?? null, profile?.weightKg ?? null);
  if (!bmi) {
    return { label: "Unknown", tone: "neutral", bmi: null };
  }

  if (bmi < 18.5) {
    return { label: "Needs conditioning", tone: "warn", bmi };
  }

  if (bmi <= 25) {
    return { label: "Ready to go", tone: "good", bmi };
  }

  if (bmi <= 28) {
    return { label: "Monitor weight", tone: "warn", bmi };
  }

  return { label: "Regain shape", tone: "alert", bmi };
}
