import type { KeyValueAdapter } from './deviceSetupStore.ts';

/**
 * Device-only Privacy & safety record for the no-backend preview (and any session
 * without a signed-in user). Not a substitute for submit_privacy_safety when
 * Supabase is configured. Stores only the switch values and the versions/hashes
 * of the texts that were shown — never tokens or health measurements.
 *
 * Counsel rules still apply: health and AI stay separate, AI is stored off when
 * health is off, and nothing is written until the risk checkbox has been accepted.
 */
export const LOCAL_PRIVACY_KEY = 'privacySafety.local.v1';

export type LocalPrivacyMeta = {
  healthVersion: string;
  healthHash: string;
  aiVersion: string;
  aiHash: string;
  riskVersion: string;
  riskHash: string;
  healthPolicyHash: string;
};

export type LocalPrivacyRecord = LocalPrivacyMeta & {
  health: boolean;
  ai: boolean;
  savedAt: string;
};

export type ContinueDecision = { type: 'busy' } | { type: 'blocked'; message: string } | { type: 'preview' } | { type: 'remote' };

/**
 * What Continue should do. Previously the route returned silently when there
 * was no signed-in user, so the button appeared to do nothing in preview mode.
 */
export function decidePrivacyContinue(opts: {
  submission: { health: boolean; ai: boolean } | null;
  busy: boolean;
  hasUser: boolean;
  supabaseConfigured: boolean;
  hint: string;
}): ContinueDecision {
  if (opts.busy) return { type: 'busy' };
  if (!opts.submission) return { type: 'blocked', message: opts.hint };
  if (!opts.supabaseConfigured || !opts.hasUser) return { type: 'preview' };
  return { type: 'remote' };
}

export function recordFromSubmission(
  sub: { health: boolean; ai: boolean },
  meta: LocalPrivacyMeta,
  now: () => string = () => new Date().toISOString(),
): LocalPrivacyRecord {
  const health = sub.health === true;
  return { ...meta, health, ai: health && sub.ai === true, savedAt: now() };
}

export async function saveLocalPrivacySafety(storage: KeyValueAdapter, record: LocalPrivacyRecord): Promise<void> {
  await storage.setItem(LOCAL_PRIVACY_KEY, JSON.stringify(record));
}

export async function loadLocalPrivacySafety(storage: KeyValueAdapter): Promise<LocalPrivacyRecord | null> {
  const raw = await storage.getItem(LOCAL_PRIVACY_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    if (!v || typeof v !== 'object') return null;
    const str = (k: keyof LocalPrivacyMeta) => (typeof v[k] === 'string' && (v[k] as string).length > 0 ? (v[k] as string) : null);
    const healthVersion = str('healthVersion');
    const healthHash = str('healthHash');
    const aiVersion = str('aiVersion');
    const aiHash = str('aiHash');
    const riskVersion = str('riskVersion');
    const riskHash = str('riskHash');
    const healthPolicyHash = str('healthPolicyHash');
    const savedAt = typeof v.savedAt === 'string' && v.savedAt.length > 0 ? v.savedAt : null;
    if (!healthVersion || !healthHash || !aiVersion || !aiHash || !riskVersion || !riskHash || !healthPolicyHash || !savedAt) {
      return null;
    }
    const health = v.health === true;
    return {
      health,
      ai: health && v.ai === true,
      healthVersion,
      healthHash,
      aiVersion,
      aiHash,
      riskVersion,
      riskHash,
      healthPolicyHash,
      savedAt,
    };
  } catch {
    return null;
  }
}
