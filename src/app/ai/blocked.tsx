import { router } from 'expo-router';
import { setPlanDraft } from '../../ai/planDraft';
import { AiBlockedScreen } from '../../ai/screens/AiBlocked';

export default function BlockedRoute() {
  return (
    <AiBlockedScreen
      onGenerateAgain={() => {
        setPlanDraft({ status: 'idle' });
        router.replace('/ai/quiz');
      }}
      onChangeGoal={() => {
        setPlanDraft({ status: 'idle' });
        router.replace('/ai/quiz');
      }}
    />
  );
}
