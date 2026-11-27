import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed/600SemiBold';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed/800ExtraBold';
import { InterTight_400Regular } from '@expo-google-fonts/inter-tight/400Regular';
import { InterTight_500Medium } from '@expo-google-fonts/inter-tight/500Medium';
import { InterTight_600SemiBold } from '@expo-google-fonts/inter-tight/600SemiBold';
import { InterTight_700Bold } from '@expo-google-fonts/inter-tight/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, type Href, ThemeProvider as NavThemeProvider, router, Stack, usePathname, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadConsents } from '../auth/consents';
import { AgeGateProvider, useAgeGate } from '../auth/AgeGateProvider';
import { GoogleAuthBridge } from '../auth/providers';
import { SessionProvider, useSession } from '../auth/SessionProvider';
import { isGoogleConfigured } from '../auth/signIn';
import { OnboardingSync } from '../onboarding/OnboardingSync';
import { consumeAwaitingSignIn } from '../onboarding/parentInviteMemory';
import { homeRoute, shouldGoHome } from '../onboarding/homeRoute';
import { nextOnboardingRoute } from '../onboarding/routing';
import { useGateFacts } from '../onboarding/useGateFacts';
import { AppStoreProvider } from '../state/AppStore';
import { myLatestTerms, needsTermsReaccept } from '../legal/termsApi';
import { termsReacceptGate } from '../legal/termsGate';
import { CARBON_BG, ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { formCheckLabEnabled } from '../formCheck/lab';

SplashScreen.preventAutoHideAsync().catch(() => {});

const SCREEN_PREVIEW = process.env.EXPO_PUBLIC_SCREEN_PREVIEW === '1';
const FORM_CHECK_LAB = formCheckLabEnabled();

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
  const [termsOk, setTermsOk] = useState<boolean | null>(isConfigured ? null : true);
  useEffect(() => {
    if (!isConfigured || !inApp) {
      setTermsOk(true);
      return;
    }
    let alive = true;
    void myLatestTerms().then((l) => {
      if (alive) setTermsOk(!needsTermsReaccept(l));
    });
    return () => {
      alive = false;
    };
  }, [isConfigured, inApp, user?.id, onboarding]); // onboarding changes on every refreshRole, e.g. right after Accept

  const readyWithTerms = ready && termsOk !== null;
  const isMinor = !!onboarding?.is_minor;
  // Adults are gated from general app use until they re-accept, but Settings › Privacy,
  // export, and deletion stay reachable (ToS §20; TDPSA §541.054; MHMDA). 16–17 are not locked:
  // the parent re-accepts, and the teen can keep using the app.
  const termsGate = termsReacceptGate({ inApp, termsCurrent: termsOk, isMinor });
  const needsTerms = termsGate.showReaccept && !isMinor;
  const termsWaiting = termsGate.showReaccept && isMinor;
  const inAppOk = termsGate.allowGeneralApp;

  useEffect(() => {
    if (readyWithTerms) SplashScreen.hideAsync().catch(() => {});
  }, [readyWithTerms]);

  // When a guard blocks the current route, expo-router falls back to the shortest allowed static route, which is
  // rarely this state's own screen (signed out: /age; setup: never setup/[step]). Send the app to the state's home.
  // Hold the last settled gate while the session reloads (e.g. right after sign-in). Unmounting the Stack for that
  // moment showed a blank screen, then a fallback screen, before the right page: the "twitch".
  const live = { notEligible, signedOut, needsProfile, pendingMinor, needsSetup, needsPrivacy, needsTerms, termsWaiting, inAppOk, inApp, showConsent, showParentLink, showParentConsent };
  const held = useRef<typeof live | null>(null);
  if (readyWithTerms) held.current = live;
  const g = readyWithTerms ? live : held.current;

  const pathname = usePathname();
  const launchPath = useRef<string | null>(null);
  if (launchPath.current === null) launchPath.current = pathname;
  const gateFlags = { notEligible, signedOut, needsProfile, pendingMinor, needsSetup, needsPrivacy, needsTerms, termsWaiting, inAppOk };
  // A blocked screen goes straight to this state's home (no stop on the router's generic fallback, which flashed).
  const homeHref = (g ? homeRoute(g) ?? undefined : undefined) as Href | undefined;
  useEffect(() => {
    if (!readyWithTerms || !nav?.key) return;
    const home = shouldGoHome(gateFlags, { path: pathname, canGoBack: router.canGoBack(), launchPath: launchPath.current });
    if (home) router.replace(home as Href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyWithTerms, nav?.key, pathname, notEligible, signedOut, needsProfile, pendingMinor, needsSetup, needsPrivacy, needsTerms, termsWaiting, inAppOk]);

  // Navigation's own background (DefaultTheme is light grey) shows during transitions: match the app's.
  const navTheme = useMemo(() => {
    const base = resolvedScheme === 'dark' ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: colors.bg, card: colors.bg } };
  }, [resolvedScheme, colors.bg]);

  // A parent who opened an invite link signed out comes back to the consent screen once they are a signed-in adult.
  useEffect(() => {
    if (showParentConsent && nav?.key && consumeAwaitingSignIn()) router.push('/parent-consent');
  }, [showParentConsent, nav?.key]);

  if (!g) return <View style={{ flex: 1, backgroundColor: CARBON_BG }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <NavThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Protected guard={g.notEligible} redirectTo={homeHref}>
          <Stack.Screen name="not-eligible" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={g.signedOut} redirectTo={homeHref}>
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="method" />
          <Stack.Screen name="age" />
          <Stack.Screen name="parent-help" options={{ gestureEnabled: false }} />
          <Stack.Screen name="invite-parent" />
          <Stack.Screen name="invite-sent" />
          <Stack.Screen name="create" />
          <Stack.Screen name="verify" />
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={g.needsProfile} redirectTo={homeHref}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={g.pendingMinor} redirectTo={homeHref}>
          <Stack.Screen name="waiting-parent" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={g.pendingMinor || g.needsSetup} redirectTo={homeHref}>
          <Stack.Screen name="setup/[step]" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={g.needsPrivacy || g.inApp} redirectTo={homeHref}>
          <Stack.Screen name="privacy-safety" options={{ animation: 'fade', gestureEnabled: !g.needsPrivacy }} />
        </Stack.Protected>
        <Stack.Protected guard={g.needsTerms || g.termsWaiting} redirectTo={homeHref}>
          <Stack.Screen name="legal/reaccept" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={g.inApp} redirectTo={homeHref}>
          <Stack.Screen name="settings/privacy" />
          <Stack.Screen name="settings/health-reask" />
          <Stack.Screen name="settings/photo-privacy" />
          <Stack.Screen name="settings/photo-share" />
          <Stack.Screen name="settings/data-export" />
          <Stack.Screen name="photos/opt-in" />
          <Stack.Screen name="photos/add" />
          <Stack.Screen name="photos/import-consent" />
        </Stack.Protected>
        <Stack.Protected guard={g.inAppOk} redirectTo={homeHref}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="workout/[day]" />
          <Stack.Screen name="workout/recap" />
          <Stack.Screen name="ai" />
          <Stack.Screen name="settings/notifications" />
        </Stack.Protected>
        <Stack.Protected guard={g.showConsent} redirectTo={homeHref}>
          <Stack.Screen name="consent" />
        </Stack.Protected>
        <Stack.Protected guard={g.showParentLink} redirectTo={homeHref}>
          <Stack.Screen name="parent-link" />
        </Stack.Protected>
        {/* Signed out it explains "sign in first" and keeps the token in memory only. */}
        <Stack.Protected guard={g.showParentConsent || g.signedOut} redirectTo={homeHref}>
          <Stack.Screen name="parent-consent" />
        </Stack.Protected>
        {/* Unguarded routes come last so the first available screen is always the state's own. */}
        {/* Public policy text: outside every guard so it opens signed out, signed in, and from the not-eligible state. [ATTORNEY] drafts */}
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="legal/health-privacy" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="legal/coach-terms" />
        {/* Dev-only screen preview, registered only when EXPO_PUBLIC_SCREEN_PREVIEW === '1'. Otherwise it must stay
            guarded: expo-router sends a blocked route to the first unguarded static screen, and dev-preview
            (which redirects to "/") then bounced with "/" forever. */}
        <Stack.Protected guard={SCREEN_PREVIEW}>
          <Stack.Screen name="dev-preview" />
        </Stack.Protected>
        {/* Dev-only form check lab (src/formCheck/lab.ts), same guard pattern as dev-preview. */}
        <Stack.Protected guard={FORM_CHECK_LAB}>
          <Stack.Screen name="dev-form-check" />
        </Stack.Protected>
      </Stack>
      </NavThemeProvider>
      {gated ? <OnboardingSync /> : null}
      {showConsent ? <ConsentFirstRun /> : null}
      {isGoogleConfigured ? <GoogleAuthBridge /> : null}
    </View>
  );
}
