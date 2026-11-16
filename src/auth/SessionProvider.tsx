import { createContext, ReactNode, useContext, useMemo } from 'react';
import { isVerifiedCoach, resolveRole, Role } from './session';

type Session = { role: Role; isVerifiedCoach: boolean };

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const value = useMemo<Session>(() => {
    const role = resolveRole();
    return { role, isVerifiedCoach: isVerifiedCoach(role) };
  }, []);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
