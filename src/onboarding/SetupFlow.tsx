import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSession } from '../auth/SessionProvider';
import { CARBON_BG, useTheme } from '../theme/ThemeProvider';
import { applyForCoach, redeemTrainerCode, saveTrainingSetup } from './api';
import { COACH_REQUEST_FAILED, GENERIC_FAILURE, TRAINER_CODE_INVALID, TRAINER_CODE_OK, TRAINER_CODE_RATE_LIMITED } from './copy';
import { deviceFlags, deviceSetupStore } from './deviceStorage';
import { DEFAULT_PACE, isAdultGoalId, isMinorGoalId, type AdultGoalId, type MinorGoalId, type PaceId } from './goals';
import { cleanAccent, ACCENT_IDS, ACCENT_ID_TO_KEY, type AccentId } from './prefs';
import { EquipmentScreen } from './screens/SetupEquipment';
import { GoalAdultScreen, GoalMinorScreen } from './screens/SetupGoal';
import { PrefsScreen } from './screens/SetupPrefs';
import { RoleScreen } from './screens/SetupRole';
import { FollowupsScreen, StyleScreen } from './screens/SetupStyle';
import { defaultDraft, type SetupDraft } from './setupPayload';
import { applySkip, firstStep, isSetupStepId, nextStep, prevStep, stepAllowed, stepPayload, type SetupMode, type SetupStepId } from './setupSteps';
import { runDraftUpload } from './uploadDraft';
import { setGroup, setMax, presetGym, toggleItem, type PresetId } from './equipment';
import { setMain, toggleStyle } from './styles';
import { clampWeight, parseWeight, stepMaxLb, stepWeight } from './weightGoal';

/**
 * Setup steps 4-8 for the signed-in user. One component owns the draft; the screens are presentational.
 *  adult:         4 → 8, each step saved with saveTrainingSetup (partial payloads). Weights stay ON DEVICE (deviceSetupStore).
 *  pending 16-17: 6 → 8 saved ONLY to deviceSetupStore (never the server), then back to Waiting for a parent.
 *  linked 16-17:  5 (minor-safe list) → upload the device draft, or run 6-8 if there is none.
 * Skip applies the safe defaults (applySkip). [ATTORNEY] Counsel phase3-review #4.
 */
export function SetupFlow({ param }: { param?: string }) {
  const { user, profile, onboarding, refreshRole } = useSession();
  const { setAccent } = useTheme();
  const uid = user?.id ?? null;
  const minor = !!onboarding?.is_minor;
  const mode: SetupMode = !minor ? 'adult' : onboarding?.linked ? 'minor-linked' : 'minor-pending';
  const draftUploaded = mode === 'minor-linked' && !!onboarding?.setup_done;
  const opts = { draftUploaded };

  const [draft, setDraft] = useState<SetupDraft>(defaultDraft());
  const [loaded, setLoaded] = useState(false);
  const [chosenStep, setStep] = useState<SetupStepId | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [startedFrom, setStartedFrom] = useState<PresetId | null>(null);
  // role
  const [role, setRole] = useState<'athlete' | 'coach'>('athlete');
  const [coachInvite, setCoachInvite] = useState('');
  const [codeOpen, setCodeOpen] = useState(false);
  const [trainerCode, setTrainerCode] = useState('');
  const [codeMessage, setCodeMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [attestGeneral, setAttestGeneral] = useState(false);
  const [attestMinors, setAttestMinors] = useState(false);
  // weight goal (adults, on device)
  const [currentText, setCurrentText] = useState('');
  const [target, setTarget] = useState<number | null>(null);
  const [storedWeight, setStoredWeight] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => void (alive.current = false), []);

  // Load the device draft and the stored weight goal once.
  useEffect(() => {
    if (!uid) return;
    void (async () => {
      const d = await deviceSetupStore.loadDraft(uid).catch(() => null);
      const w = minor ? null : await deviceSetupStore.loadWeightGoal(uid).catch(() => null);
      if (!alive.current) return;
      if (d) setDraft(d.draft);
      if (w) {
        setCurrentText(w.current == null ? '' : String(w.current));
        setTarget(w.target);
        setDraft((x) => ({ ...x, pace: w.pace ?? x.pace }));
        setStoredWeight(true);
      }
      setLoaded(true);
    })();
  }, [uid, minor]);

  // The first step is derived once state is known (a validated URL segment may pick it); later moves set chosenStep.
  const wanted = isSetupStepId(param) && stepAllowed(mode, param) ? param : null;
  const step: SetupStepId | null = chosenStep ?? (onboarding && loaded ? (wanted ?? firstStep(mode, opts)) : null);

  const units = draft.prefs.units;
  const accountCreatedAt = profile?.created_at ? Date.parse(profile.created_at) : null;

  const persist = useCallback(
    async (s: SetupStepId, d: SetupDraft): Promise<boolean> => {
      if (!uid) return false;
      if (mode === 'minor-pending') {
        try {
          await deviceSetupStore.saveDraft(uid, d, { pendingMinor: true, accountCreatedAt: Number.isFinite(accountCreatedAt as number) ? accountCreatedAt : null });
          return true;
        } catch {
          return false;
        }
      }
      const payload = stepPayload(d, s, minor);
      return payload ? saveTrainingSetup(payload) : true;
    },
    [uid, mode, minor, accountCreatedAt],
  );

  /** Save the step (unless skipping nothing to save), then move on or finish. */
  const advance = useCallback(
    async (s: SetupStepId, d: SetupDraft, jumpTo?: SetupStepId) => {
      if (busy) return;
      setBusy(true);
      setMessage(null);
      const ok = await persist(s, d);
      if (!alive.current) return;
      if (!ok) {
        setBusy(false);
        setMessage(GENERIC_FAILURE);
        return;
      }
      if (s === 'goal' && minor && uid) {
        await deviceFlags.setGoalDone(uid).catch(() => {});
        // A linked teen's device draft goes up now (steps 6-8 are then done on the server).
        if (mode === 'minor-linked' && !draftUploaded && (await runDraftUpload(uid))) {
          await refreshRole();
          setBusy(false);
          return;
        }
      }
      const next = jumpTo ?? nextStep(mode, s, opts);
      if (next) {
        setStep(next);
        setBusy(false);
        return;
      }
      // Finished.
      if (s === 'prefs') {
        const id = cleanAccent(d.prefs.accent);
        if ((ACCENT_IDS as string[]).includes(id)) setAccent(ACCENT_ID_TO_KEY[id as AccentId]);
      }
      if (mode === 'minor-pending') {
        setBusy(false);
        if (router.canGoBack()) router.back();
        else router.replace('/waiting-parent');
        return;
      }
      await refreshRole(); // setup_done flips → the gate moves to Privacy & safety
      if (alive.current) setBusy(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, persist, mode, minor, uid, draftUploaded, refreshRole, setAccent],
  );

  const goBack = useCallback(() => {
    if (!step) return;
    const prev = prevStep(mode, step, opts);
    setMessage(null);
    if (prev) setStep(prev);
    else if (mode === 'minor-pending') {
      if (router.canGoBack()) router.back();
      else router.replace('/waiting-parent');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, mode, draftUploaded]);
  const backFor = (s: SetupStepId) => (prevStep(mode, s, opts) || mode === 'minor-pending' ? goBack : undefined);

  const patch = (p: Partial<SetupDraft>) => setDraft((d) => ({ ...d, ...p }));

  if (!step || !onboarding) return <View style={{ flex: 1, backgroundColor: CARBON_BG }} />;

  // ───────── weights (adults, on device) ─────────
  const saveWeightLocally = async (goal: AdultGoalId | null, skip: boolean) => {
    if (!uid || minor) return;
    const current = skip ? null : parseWeight(currentText, units);
    const t = skip || !(goal === 'lose' || goal === 'gain') ? null : target;
    if (current == null && t == null) {
      await deviceSetupStore.clearWeightGoal(uid).catch(() => {});
      setStoredWeight(false);
      return;
    }
    await deviceSetupStore.saveWeightGoal(uid, { current, target: t, unit: units, pace: goal === 'lose' || goal === 'gain' ? (draft.pace ?? DEFAULT_PACE) : null });
    setStoredWeight(true);
  };

  switch (step) {
    case 'role':
      return (
        <RoleScreen
          role={role}
          onRole={setRole}
          coachInvite={coachInvite}
          onCoachInvite={setCoachInvite}
          codeOpen={codeOpen}
          onToggleCode={() => setCodeOpen(true)}
          trainerCode={trainerCode}
          onTrainerCode={(v) => {
            setTrainerCode(v);
            setCodeMessage(null);
          }}
          onApplyCode={async () => {
            if (busy || !trainerCode.trim()) return;
            setBusy(true);
            setCodeMessage(null);
            const r = await redeemTrainerCode(trainerCode, await deviceFlags.installId().catch(() => null));
            if (!alive.current) return;
            setBusy(false);
            // One generic failure for every failure (never says whether a coach exists); only rate limiting is distinct.
            if (r === 'ok') {
              setCodeMessage({ kind: 'ok', text: TRAINER_CODE_OK });
              setTrainerCode('');
            } else setCodeMessage({ kind: 'error', text: r === 'rate_limited' ? TRAINER_CODE_RATE_LIMITED : TRAINER_CODE_INVALID });
          }}
          codeMessage={codeMessage}
          busy={busy}
          message={message}
          onContinue={() => void advance('role', draft)}
          onRequestCoach={async () => {
            if (busy) return;
            setBusy(true);
            setMessage(null);
            if (!attestGeneral) { setBusy(false); return; }
            const ok = await applyForCoach({ minors: attestMinors });
            if (!alive.current) return;
            if (!ok) {
              setBusy(false);
              setMessage(COACH_REQUEST_FAILED);
              return;
            }
            setBusy(false);
            setRole('athlete'); // they continue setup as an athlete until approved
            setStep(nextStep(mode, 'role', opts));
          }}
          attestGeneral={attestGeneral}
          onAttestGeneral={setAttestGeneral}
          attestMinors={attestMinors}
          onAttestMinors={setAttestMinors}
          onSkip={() => void advance('role', draft)}
          onBack={backFor('role')}
        />
      );

    case 'goal': {
      if (minor) {
        const picked = isMinorGoalId(draft.goal) ? draft.goal : null;
        return (
          <GoalMinorScreen
            picked={picked}
            onPick={(g: MinorGoalId) => patch({ goal: g })}
            busy={busy}
            message={message}
            onContinue={() => void advance('goal', draft)}
            onSkip={() => {
              const d = applySkip(draft, 'goal', true);
              setDraft(d);
              void advance('goal', d);
            }}
            onBack={backFor('goal')}
          />
        );
      }
      const goal = isAdultGoalId(draft.goal) ? draft.goal : null;
      const pace: PaceId = draft.pace ?? DEFAULT_PACE;
      const cur = parseWeight(currentText, units);
      return (
        <GoalAdultScreen
          goal={goal}
          onGoal={(g) => {
            patch({ goal: g, pace: g === 'maintain' ? null : (draft.pace ?? DEFAULT_PACE) });
            if ((g === 'lose' || g === 'gain') && target == null && cur != null) setTarget(clampWeight(cur + (g === 'lose' ? -5 : 5), units));
          }}
          units={units}
          currentText={currentText}
          onCurrentText={setCurrentText}
          target={target}
          onTargetStep={(dir) => setTarget(stepWeight(target, dir, units, cur ?? (units === 'lb' ? 170 : 77)))}
          pace={pace}
          onPace={(p) => patch({ pace: p })}
          storedOnDevice={storedWeight}
          onDeleteWeight={async () => {
            if (!uid) return;
            await deviceSetupStore.clearWeightGoal(uid).catch(() => {});
            setStoredWeight(false);
            setCurrentText('');
            setTarget(null);
          }}
          busy={busy}
          message={message}
          onContinue={async () => {
            await saveWeightLocally(goal, false);
            void advance('goal', draft);
          }}
          onSkip={async () => {
            await saveWeightLocally(null, true);
            const d = applySkip(draft, 'goal', false);
            setDraft(d);
            setCurrentText('');
            setTarget(null);
            void advance('goal', d);
          }}
          onBack={backFor('goal')}
        />
      );
    }

    case 'style':
      return (
        <StyleScreen
          selection={draft.selection}
          onToggle={(id) => patch({ selection: toggleStyle(draft.selection, id) })}
          onSetMain={(id) => patch({ selection: setMain(draft.selection, id) })}
          busy={busy}
          message={message}
          onContinue={() => {
            setMessage(null);
            setStep('followups');
          }}
          onSkip={() => {
            const d = applySkip(draft, 'style', minor);
            setDraft(d);
            void advance('style', d, 'equipment'); // Skip on the picker skips the follow-ups too
          }}
          onBack={backFor('style')}
        />
      );

    case 'followups':
      return (
        <FollowupsScreen
          selection={draft.selection}
          followups={draft.followups}
          units={units}
          onChange={(followups) => patch({ followups })}
          busy={busy}
          message={message}
          onContinue={() => void advance('followups', draft)}
          onSkip={() => {
            const d = applySkip(draft, 'followups', minor);
            setDraft(d);
            void advance('followups', d);
          }}
          onBack={backFor('followups')}
        />
      );

    case 'equipment':
      return (
        <EquipmentScreen
          gym={draft.gym}
          units={units}
          startedFrom={startedFrom}
          onName={(name) => patch({ gym: { ...draft.gym, name } })}
          onPreset={(p) => {
            setStartedFrom(null);
            patch({ gym: presetGym(p, draft.gym.name) });
          }}
          onToggleItem={(id) => {
            if (draft.gym.preset !== 'custom') setStartedFrom(draft.gym.preset);
            patch({ gym: toggleItem(draft.gym, id) });
          }}
          onToggleGroup={(gid, on) => {
            if (draft.gym.preset !== 'custom') setStartedFrom(draft.gym.preset);
            patch({ gym: setGroup(draft.gym, gid, on) });
          }}
          onMax={(item, dir) => {
            if (draft.gym.preset !== 'custom') setStartedFrom(draft.gym.preset);
            patch({ gym: setMax(draft.gym, item, stepMaxLb(draft.gym.maxes[item] ?? 0, dir, units)) });
          }}
          busy={busy}
          message={message}
          onContinue={() => void advance('equipment', draft)}
          onSkip={() => {
            const d = applySkip(draft, 'equipment', minor);
            setDraft(d);
            void advance('equipment', d);
          }}
          onBack={backFor('equipment')}
        />
      );

    case 'prefs':
      return (
        <PrefsScreen
          prefs={draft.prefs}
          onChange={(prefs) => patch({ prefs })}
          busy={busy}
          message={message}
          ctaLabel={mode === 'minor-pending' ? 'Save and go back' : 'Start training'}
          onFinish={() => void advance('prefs', draft)}
          onSkip={() => {
            const d = applySkip(draft, 'prefs', minor);
            setDraft(d);
            void advance('prefs', d);
          }}
          onBack={backFor('prefs')}
        />
      );
  }
}
