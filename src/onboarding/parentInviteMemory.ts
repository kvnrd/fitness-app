/**
 * The parent invite token from a deep link, kept in MEMORY ONLY (never AsyncStorage, never logged) while a signed-out
 * parent signs in or creates an account. The root gate sends them back to /parent-consent once they are a signed-in adult.
 */
let token: string | null = null;
export const setPendingInviteToken = (t: string | null) => void (token = t);
export const getPendingInviteToken = (): string | null => token;

/** Set while a signed-out parent is signing in; consumed once by the gate so it can return to the consent screen. */
let awaiting = false;
export const markAwaitingSignIn = () => void (awaiting = true);
export const consumeAwaitingSignIn = (): boolean => {
  const was = awaiting && token !== null;
  awaiting = false;
  return was;
};
