import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed/600SemiBold';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed/800ExtraBold';
import { InterTight_400Regular } from '@expo-google-fonts/inter-tight/400Regular';
import { InterTight_500Medium } from '@expo-google-fonts/inter-tight/500Medium';
import { InterTight_600SemiBold } from '@expo-google-fonts/inter-tight/600SemiBold';
import { InterTight_700Bold } from '@expo-google-fonts/inter-tight/700Bold';
import { useFonts } from 'expo-font';
import { router, Stack, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadConsents } from '../auth/consents';
import { AgeGateProvider, useAgeGate } from '../auth/AgeGateProvider';
import { GoogleAuthBridge } from '../auth/providers';
import { SessionProvider, useSession } from '../auth/SessionProvider';
import { isGoogleConfigured } from '../auth/signIn';
import { OnboardingSync } from '../onboarding/OnboardingSync';
import { consumeAwaitingSignIn } from '../onboarding/parentInviteMemory';
import { nextOnboardingRoute } from '../onboarding/routing';
import { useGateFacts } from '../onboarding/useGateFacts';
import { AppStoreProvider } from '../state/AppStore';
import { CARBON_BG, ThemeProvider, useTheme } from '../theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
  });

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <AgeGateProvider>
          <ThemeProvider>
            <AppStoreProvider>
              <ThemedApp fontsReady={loaded || !!error} />
            </AppStoreProvider>
          </ThemeProvider>
        </AgeGateProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

/**
 * Opens /consent once per app session for a signed-in user who has no consent rows yet (first run
 * after signup). Never repeats, never blocks: Continue returns to the app. Fails quiet on any error.
 */
function ConsentFirstRun() {
  const { user } = useSession();
  const nav = useRootNavigationState();
  const doneFor = useRef<string | null>(null);
  const uid = user?.id ?? null;
  const navReady = !!nav?.key;

  useEffect(() => {
    if (!uid || !navReady || doneFor.current === uid) return;
    doneFor.current = uid;
    void loadConsents(uid).then((r) => {
      if (r.ok && r.rowCount === 0) router.push('/consent');
    });
  }, [uid, navReady]);
  return null;
}

function ThemedApp({ fontsReady }: { fontsReady: boolean }) {
  const { colors, resolvedScheme, hydrated } = useTheme();
  const { isConfigured, isSignedIn, isLoading, profile, onboarding, user } = useSession();
  const nav = useRootNavigationState();
  const age = useAgeGate();
  // Gate only when Supabase is configured; the unconfigured prototype is never locked.
  // Order: not-eligible flag → signed out → signed in without a complete account → pending minor →
  // setup (+ the linked teen's Goal) → privacy & safety → app. The decision is the pure nextOnboardingRoute();
  // my_onboarding_state failing leaves `onboarding` null (fail closed).
  // Not-eligible device flag: only the generic notice, unless an existing account is already signed in.
  const notEligible = isConfigured && age.blocked && !(isSignedIn && !!profile);
  const signedOut = isConfigured && !notEligible && !isSignedIn;
  // No profile yet, or a profile whose state could not be read: the "finishing signup" / retry screen.
  const needsProfile = isConfigured && !notEligible && isSignedIn && (!profile || !onboarding);
  const gated = isConfigured && isSignedIn && !!profile && !!onboarding;
  const linkedMinor = gated && onboarding.is_minor && onboarding.linked;
  const facts = useGateFacts(user?.id ?? null, linkedMinor);
  const route = gated ? nextOnboardingRoute(onboarding, facts) : null;
  // A linked teen's device draft is uploading (OnboardingSync); wait for it so the right step shows.
  const waitingOnDevice = linkedMinor && (!facts.loaded || route === 'upload-draft');
  const ready = fontsReady && hydrated && !isLoading && (!isConfigured || age.hydrated) && !waitingOnDevice;
  const pendingMinor = route === 'waiting';
  const needsSetup = route === 'setup' || route === 'goal';
  const needsPrivacy = route === 'privacy';
  const inApp = !isConfigured || route === 'app';
  // Parent-link: pending minors (to see their requests) plus any adult (to accept requests).
  const showParentLink = isConfigured && isSignedIn && !!profile && (pendingMinor || !profile.is_minor);
  // Parent-consent (invite token deep link) is for signed-in adults only.
  const showParentConsent = isConfigured && isSignedIn && !!profile && !profile.is_minor;
  // Consent is reachable by any onboarded signed-in user; it is never a lock.
  const showConsent = isConfigured && isSignedIn && inApp;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // A parent who opened an invite link signed out comes back to the consent screen once they are a signed-in adult.
  useEffect(() => {
    if (showParentConsent && nav?.key && consumeAwaitingSignIn()) router.push('/parent-consent');
  }, [showParentConsent, nav?.key]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: CARBON_BG }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Protected guard={notEligible}>
          <Stack.Screen name="not-eligible" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={signedOut}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="method" />
          <Stack.Screen name="age" />
          <Stack.Screen name="parent-help" options={{ gestureEnabled: false }} />
          <Stack.Screen name="invite-parent" />
          <Stack.Screen name="invite-sent" />
          <Stack.Screen name="create" />
          <Stack.Screen name="verify" />
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={needsProfile}>
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={pendingMinor}>
          <Stack.Screen name="waiting-parent" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={pendingMinor || needsSetup}>
          <Stack.Screen name="setup/[step]" />
        </Stack.Protected>
        <Stack.Protected guard={needsPrivacy}>
          <Stack.Screen name="privacy-safety" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={inApp}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout/[day]" />
        </Stack.Protected>
        <Stack.Protected guard={showConsent}>
          <Stack.Screen name="consent" />
        </Stack.Protected>
        <Stack.Protected guard={showParentLink}>
          <Stack.Screen name="parent-link" />
        </Stack.Protected>
        {/* Signed out it explains "sign in first" and keeps the token in memory only. */}
        <Stack.Protected guard={showParentConsent || signedOut}>
          <Stack.Screen name="parent-consent" />
        </Stack.Protected>
        {/* Unguarded routes come last so the first available screen is always the state's own. */}
        {/* Public policy text: outside every guard so it opens signed out, signed in, and from the not-eligible state. [ATTORNEY] drafts */}
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="legal/health-privacy" />
        <Stack.Screen name="legal/terms" />
        {/* Dev-only screen preview: always registered outside guards, but the route redirects home unless __DEV__ && EXPO_PUBLIC_SCREEN_PREVIEW === '1'. */}
        <Stack.Screen name="dev-preview" />
      </Stack>
      {gated ? <OnboardingSync /> : null}
      {showConsent ? <ConsentFirstRun /> : null}
      {isGoogleConfigured ? <GoogleAuthBridge /> : null}
    </View>
  );
}
