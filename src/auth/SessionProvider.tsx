import type { Session as AuthSession, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { checkStoreAgeSharingRevoked, onStoreAgeSignalRevoked } from '../age/storeAgeSignal';
import { reportStoreSignalRevoked } from '../age/reportStoreRevocation';
import { DEFAULT_ROLE, isRole, isVerifiedCoach, resolveDevRole, Role } from './session';
import { analyticsInstallId, deviceFlags, deviceSetupStore } from '../onboarding/deviceStorage';
import { myOnboardingState, type OnboardingState } from '../onboarding/api';
import { isSupabaseConfigured, supabase } from './supabase';

export type Profile = { id: string; display_name: string | null; is_minor: boolean; created_at?: string | null };

type Session = {
  role: Role;
  isVerifiedCoach: boolean;
  /** Supabase configured (real auth) vs. the unconfigured prototype. */
  isConfigured: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  user: User | null;
  /** public.profiles row, or null (not signed in / no profile yet: send them to /onboarding). */
  profile: Profile | null;
  /**
   * Unconfigured prototype: always true. Configured: false without a profile; adults true; minors
   * true only with an ACTIVE contracting-party parent_links row. Fails closed (false) on any error.
   * UI gating only: RLS / app.is_minor_onboarded enforce this on the server.
   */
  isOnboarded: boolean;
  /**
   * my_onboarding_state() for the signed-in user, or null (no session, no profile, or the call failed).
   * With a profile and a null state the root gate fails closed (retry screen, never the app).
   * Unconfigured prototype: a "done" state. UI gating only: RLS / functions enforce.
   */
  onboarding: OnboardingState | null;
  /** One-shot message for the sign-in screen (e.g. after an ineligible age result). */
  notice: string | null;
  setNotice: (message: string | null) => void;
  signOut: () => Promise<void>;
  /** Re-read role (and profile) from the server. */
  refreshRole: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

const PROTOTYPE_STATE: OnboardingState = {
  is_minor: false,
  linked: false,
  invite_status: null,
  setup_done: true,
  privacy_done: true,
  can_train: true,
  parent_risk_done: null,
  health_reask_due: false,
  health_reask_self_due: false,
  health_reask_parent_due: false,
  health_screen_status: 'ok',
  can_ai_plan: true,
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured() && supabase !== null;
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [role, setRole] = useState<Role>(configured ? DEFAULT_ROLE : resolveDevRole());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(configured);
  const [onbState, setOnbState] = useState<OnboardingState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Which user's server state has loaded at least once. A new user starts in the loading state (no
  // flash of the onboarding screen) but a later refresh does not blank the UI.
  const [loadedUser, setLoadedUser] = useState<string | null>(null);
  const userId = authSession?.user.id ?? null;
  const latestUser = useRef<string | null>(null);
  const prevUser = useRef<string | null>(null);
  latestUser.current = userId;

  // Source of truth: SELECT from public.user_roles (RLS: own row only). Not the JWT claim.
  const loadServerState = useCallback(async (uid: string) => {
    if (!supabase) return;
    try {
      const [r, p] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', uid).maybeSingle(),
        supabase.from('profiles').select('id, display_name, is_minor, created_at').eq('id', uid).maybeSingle(),
      ]);
      if (latestUser.current !== uid) return; // signed out / switched while loading
      // On error or missing row fail closed to athlete (never keep a stale elevated role).
      setRole(!r.error && isRole(r.data?.role) ? r.data.role : DEFAULT_ROLE);
      const prof = !p.error && p.data ? (p.data as Profile) : null;
      setProfile(prof);
      // Fail closed: no profile or a failed call leaves the state null.
      const st = prof ? await myOnboardingState() : null;
      if (latestUser.current === uid) setOnbState(st);
    } catch {
      if (latestUser.current === uid) {
        setRole(DEFAULT_ROLE);
        setProfile(null);
        setOnbState(null);
      }
    } finally {
      if (latestUser.current === uid) setLoadedUser(uid);
    }
  }, []);

  useEffect(() => {
    if (!configured || !supabase) return;
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (alive) setAuthSession(data.session);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setAuthLoading(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (alive) setAuthSession(next);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  // The account is gone (deleted, or the session ended some other way): drop its device-only setup data too.
  useEffect(() => {
    const gone = prevUser.current;
    prevUser.current = userId;
    if (gone && gone !== userId) {
      void deviceSetupStore.clearForUser(gone).catch(() => {});
      void deviceFlags.clearUser(gone).catch(() => {});
      void analyticsInstallId.reset().catch(() => {});
    }
  }, [userId]);

  useEffect(() => {
    if (!configured) return;
    setRole(DEFAULT_ROLE); // never carry a previous user's role; the table read below decides
    setProfile(null);
    setOnbState(null);
    setLoadedUser(null);
    if (!userId) return;
    void loadServerState(userId);
  }, [configured, userId, loadServerState]);

  // Store age-signal revocation: a signal once received is actual knowledge, so the server flag
  // never raises an age. The native check can show the store sharing prompt; see docs/store-age-signal.md.
  useEffect(() => {
    if (!configured || !userId) return;
    const unsub = onStoreAgeSignalRevoked(() => {
      void reportStoreSignalRevoked().catch(() => {});
    });
    void checkStoreAgeSharingRevoked().catch(() => {});
    return unsub;
  }, [configured, userId]);


  const signOut = useCallback(async () => {
    // Device-only setup drafts and weight goal never outlive the session.
    const uid = latestUser.current;
    if (uid) {
      await deviceSetupStore.clearForUser(uid).catch(() => {});
      await deviceFlags.clearUser(uid).catch(() => {});
      await analyticsInstallId.reset().catch(() => {});
    }
    if (supabase) await supabase.auth.signOut().catch(() => {});
    setRole(configured ? DEFAULT_ROLE : resolveDevRole());
    setProfile(null);
    setOnbState(null);
  }, [configured]);

  const refreshRole = useCallback(async () => {
    if (latestUser.current) await loadServerState(latestUser.current);
  }, []);

  const value = useMemo<Session>(
    () => ({
      role,
      isVerifiedCoach: isVerifiedCoach(role),
      isConfigured: configured,
      isLoading: authLoading || (!!userId && loadedUser !== userId),
      isSignedIn: !!authSession,
      user: authSession?.user ?? null,
      profile,
      isOnboarded: configured ? !!onbState && (!onbState.is_minor || onbState.linked) : true,
      onboarding: configured ? onbState : PROTOTYPE_STATE,
      notice,
      setNotice,
      signOut,
      refreshRole,
    }),
    [role, configured, authLoading, userId, loadedUser, authSession, profile, onbState, notice, signOut, refreshRole],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
