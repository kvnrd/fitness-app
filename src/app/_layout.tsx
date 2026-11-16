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
import { SessionProvider, useSession } from '../auth/SessionProvider';
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
        <ThemeProvider>
          <AppStoreProvider>
            <ThemedApp fontsReady={loaded || !!error} />
          </AppStoreProvider>
        </ThemeProvider>
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
  const { isConfigured, isSignedIn, isLoading, profile, isOnboarded } = useSession();
  const ready = fontsReady && hydrated && !isLoading;
  // Gate only when Supabase is configured; the unconfigured prototype is never locked.
  const needsSignIn = isConfigured && !isSignedIn;
  const needsProfile = isConfigured && isSignedIn && !profile; // age gate
  const needsParent = isConfigured && isSignedIn && !!profile && profile.is_minor && !isOnboarded;
  const inApp = !needsSignIn && !needsProfile && !needsParent;
  // Parent-link: blocked minors, plus any adult (to accept requests). Onboarded minors never need it.
  const showParentLink = isConfigured && isSignedIn && !!profile && (needsParent || !profile.is_minor);
  // Consent is reachable by any onboarded signed-in user; it is never a lock.
  const showConsent = isConfigured && isSignedIn && inApp;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

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
        <Stack.Protected guard={needsSignIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={needsProfile}>
          <Stack.Screen name="onboarding" />
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
      </Stack>
      {showConsent ? <ConsentFirstRun /> : null}
    </View>
  );
}
