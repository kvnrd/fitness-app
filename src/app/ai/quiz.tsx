import { router } from 'expo-router';
import { useState } from 'react';
import { requestAiPlan } from '../../ai/aiPlan';
import { useSession } from '../../auth/SessionProvider';
import { setPlanDraft } from '../../ai/planDraft';
import { emptyQuiz, toPlanRequest, type QuizState } from '../../ai/quiz';
import { AiQuizScreen } from '../../ai/screens/AiQuiz';
import { GENERIC_FAILURE } from '../../onboarding/copy';

export default function QuizRoute() {
  const { onboarding } = useSession();
  const teen = !!onboarding?.is_minor;
  const [state, setState] = useState<QuizState>(emptyQuiz);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onGenerate() {
    const req = toPlanRequest(state);
    if (!req) return;
    setBusy(true);
    setMessage(null);
    setPlanDraft({ status: 'generating', quiz: state });
    router.push('/ai/generating');
    const r = await requestAiPlan(req);
    if (r.ok) {
      setPlanDraft({ status: 'ready', plan: r.plan, quiz: state, injury: state.injury });
      router.replace('/ai/preview');
    } else if (r.reason === 'unavailable') {
      // Safety filter, model refusal, or transport: the function never names the reason.
      setPlanDraft({ status: 'blocked', quiz: state });
      router.replace('/ai/blocked');
    } else if (r.reason === 'health_screen_required') {
      setPlanDraft({ status: 'idle' });
      router.replace('/ai/health');
    } else if (r.reason === 'clearance_required') {
      setPlanDraft({ status: 'idle' });
      router.replace('/ai/clearance');
    } else if (r.reason === 'parent_required') {
      setPlanDraft({ status: 'idle' });
      setBusy(false);
      router.back();
    } else if (r.reason === 'consent_required') {
      setPlanDraft({ status: 'idle' });
      router.replace('/ai/health-switch');
    } else if (r.reason === 'goal_not_available') {
      setPlanDraft({ status: 'idle' });
      setBusy(false);
      setMessage('That goal isn’t available. Pick another and try again.');
      router.back();
    } else {
      setPlanDraft({ status: 'idle' });
      setBusy(false);
      setMessage(GENERIC_FAILURE);
      router.back();
    }
  }

  return (
    <AiQuizScreen
      state={state}
      onChange={setState}
      teen={teen}
      onBack={() => router.back()}
      onGenerate={() => void onGenerate()}
      busy={busy}
      message={message}
    />
  );
}
