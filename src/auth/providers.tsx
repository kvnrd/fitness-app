import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { AuthResult, googleClientIds, isAppleSignInAvailable, isGoogleConfigured, signInWithApple, signInWithGoogleIdToken } from './signIn';

WebBrowser.maybeCompleteAuthSession();

export type OAuthMethod = 'apple' | 'google';

type Prompt = () => Promise<AuthResult>;
let googlePrompt: Prompt | null = null;

/**
 * Mounted once in the root layout, only when Google client IDs are configured (the auth-session hook
 * throws without them). It parks the prompt function so any screen can start Google sign-in later, e.g.
 * the date-of-birth screen, which must run BEFORE any OAuth sheet opens.
 */
export function GoogleAuthBridge() {
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({ webClientId: googleClientIds.web, iosClientId: googleClientIds.ios });
  useEffect(() => {
    googlePrompt = request
      ? async () => {
          const res = await promptAsync();
          if (res.type === 'cancel' || res.type === 'dismiss') return { ok: false, message: '' };
          const idToken = res.type === 'success' ? res.params?.id_token : undefined;
          if (!idToken) return { ok: false, message: 'Could not sign in. Please try again.' };
          return signInWithGoogleIdToken(idToken, request.nonce);
        }
      : null;
    return () => {
      googlePrompt = null;
    };
  }, [request, promptAsync]);
  return null;
}

/** Starts the Apple / Google sheet. Success creates the session; the root gate then moves on. Generic errors. */
export async function startOAuth(method: OAuthMethod): Promise<AuthResult> {
  if (method === 'apple') return signInWithApple();
  if (!googlePrompt) return { ok: false, message: 'Could not sign in. Please try again.' };
  return googlePrompt();
}

/** Which provider buttons to show. Apple: iOS only (and available). Google: only with client IDs. */
export function useProviderAvailability(): { apple: boolean; google: boolean } {
  const [apple, setApple] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let alive = true;
    void isAppleSignInAvailable().then((v) => alive && setApple(v));
    return () => {
      alive = false;
    };
  }, []);
  return { apple, google: isGoogleConfigured };
}
