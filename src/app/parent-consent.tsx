import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { confirmParentLink } from '../onboarding/parentConsentRun';
import { listActiveMinors } from '../auth/consents';
import { useSession } from '../auth/SessionProvider';
import { isUuid } from '../auth/parentLinks';
import { PARENT_SIGNIN_BODY, PARENT_SIGNIN_TITLE, CONSENT_LINK_FAILED } from '../onboarding/copy';
import { initPc } from '../onboarding/parentConsent';
import { getPendingInviteToken, markAwaitingSignIn, setPendingInviteToken } from '../onboarding/parentInviteMemory';
import { ParentConsentScreen } from '../onboarding/screens/ParentConsent';
import { OnbScreen } from '../onboarding/ui/OnbScreen';
import { OnbSub, OnbTitle } from '../onboarding/ui/OnbText';
import { PrimaryCta } from '../onboarding/ui/PrimaryCta';
import { SecondaryButton } from '../onboarding/ui/SecondaryButton';
import { isInviteToken } from '../utils/deepLinks';

/**
 * Parent consent. Opened with `?token=<invite token>` (deep link) or `?link=<pending link id>` (from Link requests).
 * Needs a signed-in ADULT: signed out, the token waits in memory only while they sign in / create an account, then the
 * gate sends them back here. Every failure is the same generic message.
 */
export default function ParentConsentRoute() {
  const { token: tokenParam, link: linkParam } = useLocalSearchParams<{ token?: string; link?: string }>();
  const { user, profile, isSignedIn } = useSession();
  const [pc, setPc] = useState(initPc);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<null | { note: string | null }>(null);

  const fromParam = typeof tokenParam === 'string' && isInviteToken(tokenParam) ? tokenParam : null;
  const link = typeof linkParam === 'string' && isUuid(linkParam) ? linkParam : null;
  useEffect(() => {
    if (fromParam) setPendingInviteToken(fromParam); // memory only
  }, [fromParam]);
  const token = fromParam ?? getPendingInviteToken();
  useEffect(() => {
    if (!isSignedIn && token) markAwaitingSignIn();
  }, [isSignedIn, token]);

  const names = { parentName: profile?.display_name ?? null };

  if (!isSignedIn || !profile || !user) {
    return (
      <OnbScreen
        centerContent
        footer={
          <>
            <PrimaryCta label="Sign in" onPress={() => router.push('/sign-in')} />
            <SecondaryButton label="Create account" onPress={() => router.push('/method')} />
          </>
        }
      >
        <OnbTitle>{PARENT_SIGNIN_TITLE}</OnbTitle>
        <OnbSub>{PARENT_SIGNIN_BODY}</OnbSub>
      </OnbScreen>
    );
  }
  if (profile.is_minor || (!token && !link)) {
    return (
      <OnbScreen centerContent footer={<SecondaryButton label="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}>
        <OnbTitle>Link unavailable</OnbTitle>
        <OnbSub>{CONSENT_LINK_FAILED}</OnbSub>
      </OnbScreen>
    );
  }
  if (done) {
    return (
      <OnbScreen
        centerContent
        footer={<PrimaryCta label="Done" onPress={() => router.replace('/')} />}
      >
        <OnbTitle>Linked</OnbTitle>
        <OnbSub>{done.note ?? 'The account is linked. You can change any choice in Parent Settings.'}</OnbSub>
      </OnbScreen>
    );
  }

  return (
    <ParentConsentScreen
      names={names}
      state={pc}
      onChange={setPc}
      busy={busy}
      message={message}
      onBack={() => {
        setPendingInviteToken(null);
        if (router.canGoBack()) router.back();
        else router.replace('/');
      }}
      onConfirm={async () => {
        if (busy) return;
        setBusy(true);
        setMessage(null);
        const r = await confirmParentLink({ parentId: user.id, names, state: pc, token, linkId: link, listActiveMinors });
        setBusy(false);
        if (r.kind === 'failed') {
          setMessage(CONSENT_LINK_FAILED);
          return;
        }
        setPendingInviteToken(null);
        setDone({ note: r.kind === 'linked_partial' ? 'The account is linked. Some of your choices could not be saved; you can set them in Your choices.' : null });
      }}
    />
  );
}
