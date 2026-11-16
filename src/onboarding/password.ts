/**
 * Password GUIDANCE for the Create screen (NIST 800-63B style): length is what counts, there are no
 * composition rules (no required symbols/digits/case). The server/Supabase is the only enforcement.
 * Pure (no react-native) so it can be unit tested.
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordStrength = { level: 0 | 1 | 2 | 3 | 4; label: '' | 'Weak' | 'Okay' | 'Good' | 'Strong'; meetsLength: boolean; withinMax: boolean };

const LABELS = ['', 'Weak', 'Okay', 'Good', 'Strong'] as const;

/** 0 = too short; 1..4 grow with length; very repetitive input (few distinct characters) is capped at 1. */
export function passwordStrength(pw: string): PasswordStrength {
  const len = [...pw].length;
  const meetsLength = len >= PASSWORD_MIN_LENGTH;
  const withinMax = len <= PASSWORD_MAX_LENGTH;
  let level: 0 | 1 | 2 | 3 | 4 = 0;
  if (meetsLength && withinMax) {
    level = len >= 24 ? 4 : len >= 18 ? 3 : len >= 15 ? 2 : 1;
    const distinct = new Set(pw).size;
    if (distinct < 5) level = 1;
    else if (distinct < 8 && level > 2) level = 2;
  }
  return { level, label: LABELS[level], meetsLength, withinMax };
}

/** Same shape check as isPlausibleEmail, kept here so screens and tests stay free of native imports. */
export const isEmailShape = (v: string) => /^[^\s@]{1,64}@[^\s@.][^\s@]{0,253}\.[^\s@.]{2,}$/.test(v.trim());
