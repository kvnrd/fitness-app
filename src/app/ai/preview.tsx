import { router } from 'expo-router';
import { useState } from 'react';
import { markAiPlanAccepted } from '../../ai/api';
import { getPlanDraft } from '../../ai/planDraft';
import { goalLabels, injuryLabel } from '../../ai/quiz';
import { AiPreviewScreen } from '../../ai/screens/AiPreview';
import { SAMPLE_PLAN, SAMPLE_REST, SAMPLE_SWAP_NOTE } from '../../ai/screens/samplePlan';
import { useSession } from '../../auth/SessionProvider';
import { useAppStore } from '../../state/AppStore';

export default function PreviewRoute() {
  const { onboarding } = useSession();
  const { reload } = useAppStore();
  const draft = getPlanDraft();
  const teen = !!onboarding?.is_minor;
  const plan = draft.status === 'ready' ? draft.plan : SAMPLE_PLAN;
  const quiz = draft.status === 'ready' ? draft.quiz : null;
  const title = quiz ? goalLabels(quiz.goals, teen).join(' ') : 'Hybrid Strength';
  const injury = quiz ? injuryLabel(quiz.injury) : 'Knee';
  const [busy, setBusy] = useState(false);

  async function onStart() {
    setBusy(true);
    const ok = await markAiPlanAccepted(draft.status === 'ready' ? title : undefined);
    setBusy(false);
    if (!ok && draft.status === 'ready') return;
    reload(); // the server just saved the plan; load it into Home and Train
    router.replace('/(tabs)');
  }

  return (
    <AiPreviewScreen
      title={title}
      plan={plan}
      injuryLabel={injury}
      // Sample notes only for the sample plan; a real plan's rest days and swaps come from the plan itself.
      swapNote={draft.status === 'ready' ? undefined : injury ? SAMPLE_SWAP_NOTE : undefined}
      restNote={draft.status === 'ready' ? undefined : SAMPLE_REST}
      onBack={() => router.replace('/ai/quiz')}
      onStart={() => void onStart()}
      busy={busy}
    />
  );
}
