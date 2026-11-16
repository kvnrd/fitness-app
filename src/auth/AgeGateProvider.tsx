import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PendingAge, readIneligibleFlag, writeIneligibleFlag } from './ageGate';

type AgeGate = {
  /** Device flag read from storage at least once. */
  hydrated: boolean;
  /** This device got a "not eligible" answer before: show only the rejection notice. */
  blocked: boolean;
  /** A DOB (and optional store signal) passed the neutral screen and waits for complete_signup. Memory only. */
  hasPending: boolean;
  getPending: () => PendingAge | null;
  setPending: (p: PendingAge | null) => void;
  /** "Already have an account": go to sign-in without the age screen (no new account is created by email). */
  existingAccount: boolean;
  setExistingAccount: (v: boolean) => void;
  markIneligible: () => Promise<void>;
};

const Ctx = createContext<AgeGate | null>(null);

export function AgeGateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const pending = useRef<PendingAge | null>(null);
  const [hasPending, setHasPending] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);

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
  const markIneligible = useCallback(async () => {
    pending.current = null;
    setHasPending(false);
    setExistingAccount(false);
    await writeIneligibleFlag();
    setBlocked(true);
  }, []);

  const value = useMemo<AgeGate>(
    () => ({ hydrated, blocked, hasPending, getPending, setPending, existingAccount, setExistingAccount, markIneligible }),
    [hydrated, blocked, hasPending, getPending, setPending, existingAccount, markIneligible],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAgeGate(): AgeGate {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAgeGate must be used inside AgeGateProvider');
  return ctx;
}
