import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { myAiPlanState, type AiPlanServerState } from './api';
import { aiNoticeVariant, aiStepRoute, nextAiStep } from './flow';

export function useAiPlan() {
  const [state, setState] = useState<AiPlanServerState | null>(null);
  const refresh = useCallback(async () => {
    const next = await myAiPlanState();
    setState(next);
    return next;
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const start = useCallback(() => {
    if (!state) {
      router.push('/ai/health-switch');
      return;
    }
    router.push(aiStepRoute(nextAiStep(state)));
  }, [state]);
  return { state, refresh, start, notice: state ? aiNoticeVariant(state) : null };
}
