import { router } from 'expo-router';
import { useEffect } from 'react';
import { getPlanDraft, setPlanDraft } from '../../ai/planDraft';
import { injuryLabel } from '../../ai/quiz';
import { AiGeneratingScreen } from '../../ai/screens/AiGenerating';

export default function GeneratingRoute() {
  const draft = getPlanDraft();
  const label = draft.status === 'generating' || draft.status === 'ready' || draft.status === 'blocked' ? injuryLabel(draft.quiz.injury) : null;

  useEffect(() => {
    const d = getPlanDraft();
    if (d.status === 'ready') router.replace('/ai/preview');
    else if (d.status === 'blocked') router.replace('/ai/blocked');
    else if (d.status === 'idle') router.replace('/ai/quiz');
  }, []);

  return (
    <AiGeneratingScreen
      injuryLabel={label}
      onCancel={() => {
        setPlanDraft({ status: 'idle' });
        router.replace('/ai/quiz');
      }}
    />
  );
}
