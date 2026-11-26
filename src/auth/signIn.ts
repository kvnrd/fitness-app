import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Sign-in methods. Errors are deliberately GENERIC: never reveal whether an email has an account
 * (no "user not found" / "already registered" distinctions).
 *
 * No passwords anywhere: sign-up and sign-in both use a 6-digit emailed code. (OTP length / expiry live in
 * the Supabase project's email auth settings: 6 digits, 10 minutes.)
 */
export type AuthResult = { ok: true } | { ok: false; message: string };

const GENERIC_FAIL = 'Could not sign in. Please try again.';
const GENERIC_CODE_FAIL = 'That code did not work. Check it or request a new one.';
const NOT_AVAILABLE = 'Sign-in is not available right now.';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}$/;
export const isPlausibleEmail = (v: string) => EMAIL_RE.test(v.trim());

/**
 * Sends a 6-digit code. Same response whether or not the email is known.
 * `createUser` is true only after the neutral age screen passed on this device (Counsel C6: no email
 * or auth account before the date of birth). "I already have an account" sends false, so an unknown
 * email creates nothing.
 */
export async function requestEmailCode(email: string, createUser: boolean): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_AVAILABLE };
  if (!isPlausibleEmail(email)) return { ok: false, message: 'Enter a valid email address.' };
  try {
    await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: createUser } });
  } catch {
    // swallow: do not distinguish outcomes
  }
  // Always report "sent" so the UI cannot be used to probe for accounts.
  return { ok: true };
}

export async function verifyEmailCode(email: string, code: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_AVAILABLE };
  const token = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(token)) return { ok: false, message: 'Enter the 6-digit code.' };
  try {
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' });
    return error ? { ok: false, message: GENERIC_CODE_FAIL } : { ok: true };
  } catch {
    return { ok: false, message: GENERIC_CODE_FAIL };
  }
}

/**
 * Email sign-up (Create screen): a 6-digit code, no password (Kevin, 2026-11-26: codes only). Same call as
 * sign-in but allowed to create the user, so a known address simply gets a sign-in code. Always reports
 * "sent", so the screen cannot be used to probe which emails have accounts. Only the local shape check
 * produces a specific message.
 */
export async function signUpWithEmail(email: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_AVAILABLE };
  if (!isPlausibleEmail(email)) return { ok: false, message: 'Enter a valid email address.' };
  try {
    await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
  } catch {
    // swallow: do not distinguish outcomes
  }
  return { ok: true };
}

/** Signup confirmation code (6 digits). Success creates the session. */
export async function verifySignupCode(email: string, code: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_AVAILABLE };
  const token = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(token)) return { ok: false, message: 'Enter the 6-digit code.' };
  const normalized = email.trim().toLowerCase();
  try {
    const { error } = await supabase.auth.verifyOtp({ email: normalized, token, type: 'email' });
    return error ? { ok: false, message: GENERIC_CODE_FAIL } : { ok: true };
  } catch {
    return { ok: false, message: GENERIC_CODE_FAIL };
  }
}

/** Resend the signup code. Always reports ok so it cannot be used to probe for accounts. */
export async function resendSignupCode(email: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_AVAILABLE };
  try {
    await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
  } catch {
    // swallow
  }
  return { ok: true };
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Apple -> Supabase signInWithIdToken. Apple gets the SHA-256 of a raw nonce; Supabase gets the raw nonce. */
export async function signInWithApple(): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_AVAILABLE };
  try {
    const rawNonce = Crypto.randomUUID();
    const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashed,
    });
    if (!cred.identityToken) return { ok: false, message: GENERIC_FAIL };
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: cred.identityToken,
      nonce: rawNonce,
    });
    return error ? { ok: false, message: GENERIC_FAIL } : { ok: true };
  } catch (e) {
    if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return { ok: false, message: '' };
    return { ok: false, message: GENERIC_FAIL };
  }
}

/** Exchange a Google ID token (obtained via expo-auth-session) for a Supabase session. */
export async function signInWithGoogleIdToken(idToken: string, nonce?: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_AVAILABLE };
  try {
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce });
    return error ? { ok: false, message: GENERIC_FAIL } : { ok: true };
  } catch {
    return { ok: false, message: GENERIC_FAIL };
  }
}

// Public placeholders (read from env; statically referenced so Expo inlines them).
const GOOGLE_WEB = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const GOOGLE_IOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const PLACEHOLDER = /^(your[-_ ]|<|changeme|xxx)|example\.|placeholder/i;
const real = (v: string | undefined): v is string => !!v && !PLACEHOLDER.test(v);

export const googleClientIds = { web: real(GOOGLE_WEB) ? GOOGLE_WEB : undefined, ios: real(GOOGLE_IOS) ? GOOGLE_IOS : undefined };

/**
 * Google is offered on iOS only for now (needs both client IDs). Android would need an Android
 * client ID + SHA-1 registration, which is not part of this setup; web has no persistent session.
 */
export const isGoogleConfigured = Platform.OS === 'ios' && !!googleClientIds.web && !!googleClientIds.ios;
