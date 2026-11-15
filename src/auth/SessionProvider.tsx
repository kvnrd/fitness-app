import type { Session as AuthSession, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ROLE, isRole, isVerifiedCoach, resolveDevRole, Role } from './session';
import { isSupabaseConfigured, supabase } from './supabase';

export type Profile = { id: string; display_name: string | null; is_minor: boolean };

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
  /** One-shot message for the sign-in screen (e.g. after an ineligible age result). */
  notice: string | null;
  setNotice: (message: string | null) => void;
  signOut: () => Promise<void>;
  /** Re-read role (and profile) from the server. */
  refreshRole: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

/** Adults are onboarded; minors only with an active contracting-party parent link. Fails closed. */
async function computeOnboarded(uid: string, profile: Profile | null): Promise<boolean> {
  if (!supabase || !profile) return false;
  if (!profile.is_minor) return true;
  try {
    const { data, error } = await supabase
      .from('parent_links')
      .select('id')
      .eq('minor_user_id', uid)
      .eq('status', 'active')
      .eq('is_contracting_party', true)
      .limit(1);
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured() && supabase !== null;
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [role, setRole] = useState<Role>(configured ? DEFAULT_ROLE : resolveDevRole());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(configured);
  const [onboarded, setOnboarded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Which user's server state has loaded at least once. A new user starts in the loading state (no
  // flash of the onboarding screen) but a later refresh does not blank the UI.
  const [loadedUser, setLoadedUser] = useState<string | null>(null);
  const userId = authSession?.user.id ?? null;
  const latestUser = useRef<string | null>(null);
  latestUser.current = userId;

  // Source of truth: SELECT from public.user_roles (RLS: own row only). Not the JWT claim.
  const loadServerState = useCallback(async (uid: string) => {
    if (!supabase) return;
    try {
      const [r, p] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', uid).maybeSingle(),
        supabase.from('profiles').select('id, display_name, is_minor').eq('id', uid).maybeSingle(),
      ]);
      if (latestUser.current !== uid) return; // signed out / switched while loading
      // On error or missing row fail closed to athlete (never keep a stale elevated role).
      setRole(!r.error && isRole(r.data?.role) ? r.data.role : DEFAULT_ROLE);
      const prof = !p.error && p.data ? (p.data as Profile) : null;
      setProfile(prof);
      const ok = await computeOnboarded(uid, prof);
      if (latestUser.current === uid) setOnboarded(ok);
    } catch {
      if (latestUser.current === uid) {
        setRole(DEFAULT_ROLE);
        setProfile(null);
        setOnboarded(false);
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

  useEffect(() => {
    if (!configured) return;
    setRole(DEFAULT_ROLE); // never carry a previous user's role; the table read below decides
    setProfile(null);
    setOnboarded(false);
    setLoadedUser(null);
    if (!userId) return;
    void loadServerState(userId);
  }, [configured, userId, loadServerState]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut().catch(() => {});
    setRole(configured ? DEFAULT_ROLE : resolveDevRole());
    setProfile(null);
    setOnboarded(false);
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
      isOnboarded: configured ? onboarded : true,
      notice,
      setNotice,
      signOut,
      refreshRole,
    }),
    [role, configured, authLoading, userId, loadedUser, authSession, profile, onboarded, notice, signOut, refreshRole],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
