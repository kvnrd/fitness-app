/**
 * Option 3 + SPEC rev 2: 16–17s see weight, history, trends and a goal weight
 * the same way adults do when both health opt-ins are on. If either is off,
 * nothing about weight shows — no chart, no numbers, no on-device goal.
 */
export type WeightSurfaceKind = 'open' | 'gated_teen_off' | 'gated_parent_off' | 'gated_adult_off';

export type WeightSurfaceState = {
  kind: WeightSurfaceKind;
  showValues: boolean;
  showGoal: boolean;
  showProfileBody: boolean;
  showHomeCard: boolean;
};

export function weightSurfaceState(opts: {
  isMinor: boolean;
  healthSelf: boolean;
  healthParent: boolean;
}): WeightSurfaceState {
  if (!opts.isMinor) {
    const open = opts.healthSelf;
    return {
      kind: open ? 'open' : 'gated_adult_off',
      showValues: open,
      showGoal: open,
      showProfileBody: open,
      showHomeCard: true,
    };
  }
  if (opts.healthSelf && opts.healthParent) {
    return { kind: 'open', showValues: true, showGoal: true, showProfileBody: true, showHomeCard: true };
  }
  // If the teen's own switch is off (including both off), use 02b. Parent-off only is 02c / 20b.
  const kind = !opts.healthSelf ? 'gated_teen_off' : 'gated_parent_off';
  return { kind, showValues: false, showGoal: false, showProfileBody: false, showHomeCard: true };
}
