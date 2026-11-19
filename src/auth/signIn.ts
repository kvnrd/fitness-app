import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { devThrowawayClient, supabase } from './supabase';

/**
 * Sign-in methods. Errors are deliberately GENERIC: never reveal whether an email has an account
 * (no "user not found" / "already registered" distinctions).
 *
 * No password UI: email sign-in is a 6-digit one-time code, so the 12+ character password policy
 * is unused. (Set the OTP length / expiry in the Supabase project's email auth settings.)
 */
export type AuthResult = { ok: true } | { ok: false; message: string };

const GENERIC_FAIL = 'Could not sign in. Please try again.';
const GENERIC_CODE_FAIL = 'That code did not work. Check it or request a new one.';
const GENERIC_SIGNUP_FAIL = 'We couldn’t create the account. Check your details and try again.';
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
 * DEV ONLY (Kevin, 2026-11-18): password sign-in so the core loop can be tested before custom SMTP
 * lets Supabase email the 6-digit code. Refuses outside __DEV__ builds and in production env, and the
 * screen only shows it in __DEV__. Remove once SMTP is set up.
 */
/**
 * The hosted web preview (EXPO_PUBLIC_WEB_PREVIEW=1, Kevin 2026-11-19) is a release build, so __DEV__ is
 * false there. It gets the same dev sign-in, on web only, so native store builds can never turn it on.
 */
export const WEB_PREVIEW_BUILD = Platform.OS === 'web' && process.env.EXPO_PUBLIC_WEB_PREVIEW === '1';

export const DEV_PASSWORD_SIGN_IN =
  ((typeof __DEV__ !== 'undefined' && __DEV__) || WEB_PREVIEW_BUILD) && process.env.EXPO_PUBLIC_ENV !== 'production';

export async function devSignInWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!DEV_PASSWORD_SIGN_IN || !supabase) return { ok: false, message: NOT_AVAILABLE };
  if (!isPlausibleEmail(email) || !password) return { ok: false, message: GENERIC_FAIL };
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    return error ? { ok: false, message: GENERIC_FAIL } : { ok: true };
  } catch {
    return { ok: false, message: GENERIC_FAIL };
  }
}

/**
 * DEV ONLY mock of the sign-up code email (Kevin, 2026-11-19). Needs auto-confirm on the dev Supabase
 * project. In a dev build, signUp runs on a throwaway client so its session never reaches the app, the
 * password stays in memory, and the Verify screen accepts DEV_MOCK_SIGNUP_CODE, which signs in with that
 * password on the real client. Remove with DEV_PASSWORD_SIGN_IN once SMTP is set up.
 */
export const DEV_MOCK_SIGNUP_CODE = '000000';
let devPendingSignup: { email: string; password: string } | null = null;

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

/**
 * Email sign-up (Create screen). Generic on every outcome: with email confirmation on, Supabase answers the
 * same way for a new and an existing address, and we never add a hint of our own ("If an account exists,
 * we've sent a code"). Only local shape checks produce a specific message.
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_AVAILABLE };
  if (!isPlausibleEmail(email)) return { ok: false, message: 'Enter a valid email address.' };
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return { ok: false, message: GENERIC_SIGNUP_FAIL };
  try {
    const client = (DEV_PASSWORD_SIGN_IN && devThrowawayClient()) || supabase;
    const { error } = await client.auth.signUp({ email: email.trim().toLowerCase(), password });
    if (error) return { ok: false, message: GENERIC_SIGNUP_FAIL };
    if (DEV_PASSWORD_SIGN_IN) devPendingSignup = { email: email.trim().toLowerCase(), password };
    return { ok: true };
  } catch {
    return { ok: false, message: GENERIC_SIGNUP_FAIL };
  }
}

/** Signup confirmation code (6 digits). Success creates the session. */
export async function verifySignupCode(email: string, code: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_AVAILABLE };
  const token = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(token)) return { ok: false, message: 'Enter the 6-digit code.' };
  const normalized = email.trim().toLowerCase();
  if (DEV_PASSWORD_SIGN_IN && token === DEV_MOCK_SIGNUP_CODE && devPendingSignup?.email === normalized) {
    const r = await devSignInWithPassword(normalized, devPendingSignup.password);
    if (r.ok) devPendingSignup = null;
    return r.ok ? r : { ok: false, message: GENERIC_CODE_FAIL };
  }
  try {
    const { error } = await supabase.auth.verifyOtp({ email: normalized, token, type: 'signup' });
    return error ? { ok: false, message: GENERIC_CODE_FAIL } : { ok: true };
  } catch {
    return { ok: false, message: GENERIC_CODE_FAIL };
  }
}

/** Resend the signup code. Always reports ok so it cannot be used to probe for accounts. */
export async function resendSignupCode(email: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: NOT_AVAILABLE };
  if (DEV_PASSWORD_SIGN_IN) return { ok: true }; // mock: nothing to send
  try {
    await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
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
