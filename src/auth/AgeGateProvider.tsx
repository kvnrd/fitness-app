import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PendingAge, readIneligibleFlag, writeIneligibleFlag } from './ageGate';

export type SignupMethod = 'apple' | 'google' | 'email';

type AgeGate = {
  /** Device flag read from storage at least once. */
  hydrated: boolean;
  /** This device got a "not eligible" answer before: show only the rejection notice. */
  blocked: boolean;
  /** A DOB (+ server band, optional store signal) passed the neutral screen and waits for complete_signup. Memory only. */
  hasPending: boolean;
  getPending: () => PendingAge | null;
  setPending: (p: PendingAge | null) => void;
  /** Sign-up method picked on the Method screen. Memory only. OAuth never starts before the DOB screen. */
  method: SignupMethod | null;
  setMethod: (m: SignupMethod | null) => void;
  /** 16-17: the parent's email, held ONLY here until create_parent_invite runs after sign-up. Never persisted or logged. */
  parentEmail: string;
  setParentEmail: (v: string) => void;
  /** Email sign-up identity for the verify screen (never the password). Memory only. */
  signupEmail: string;
  signupName: string;
  setSignupIdentity: (email: string, name: string) => void;
  /** Drop the DOB, parent email and sign-up identity (after complete_signup, on ineligible, on sign-out). */
  clearSignupMemory: () => void;
  markIneligible: () => Promise<void>;
};

const Ctx = createContext<AgeGate | null>(null);

export function AgeGateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const pending = useRef<PendingAge | null>(null);
  const [hasPending, setHasPending] = useState(false);
  const [method, setMethod] = useState<SignupMethod | null>(null);
  const [parentEmail, setParentEmail] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupName, setSignupName] = useState('');

  useEffect(() => {
    let alive = true;
    void readIneligibleFlag().then((b) => {
      if (!alive) return;
      setBlocked(b);
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setPending = useCallback((p: PendingAge | null) => {
    pending.current = p;
    setHasPending(p !== null);
  }, []);
  const getPending = useCallback(() => pending.current, []);
  const setSignupIdentity = useCallback((email: string, name: string) => {
    setSignupEmail(email);
    setSignupName(name);
  }, []);
  const clearSignupMemory = useCallback(() => {
    pending.current = null;
    setHasPending(false);
    setMethod(null);
    setParentEmail('');
    setSignupEmail('');
    setSignupName('');
  }, []);
  const markIneligible = useCallback(async () => {
    clearSignupMemory();
    await writeIneligibleFlag();
    setBlocked(true);
  }, [clearSignupMemory]);

  const value = useMemo<AgeGate>(
    () => ({
      hydrated,
      blocked,
      hasPending,
      getPending,
      setPending,
      method,
      setMethod,
      parentEmail,
      setParentEmail,
      signupEmail,
      signupName,
      setSignupIdentity,
      clearSignupMemory,
      markIneligible,
    }),
    [hydrated, blocked, hasPending, getPending, setPending, method, parentEmail, signupEmail, signupName, setSignupIdentity, clearSignupMemory, markIneligible],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAgeGate(): AgeGate {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAgeGate must be used inside AgeGateProvider');
  return ctx;
}
