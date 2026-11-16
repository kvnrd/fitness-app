/**
 * Gym equipment (Setup step 7). Item ids are an exact server allowlist (training_setups.gym.items).
 * Source: onboarding-notes.md "Your gym (equipment) step".
 */
export const EQUIPMENT_ITEM_IDS = [
  'barbell', 'dumbbells', 'kettlebells', 'ez_bar', 'plates',
  'squat_rack', 'power_rack', 'bench', 'smith_machine',
  'cable_stack', 'lat_pulldown', 'leg_press', 'leg_extension_curl', 'chest_press', 'seated_row', 'shoulder_press', 'hack_squat', 'pec_deck',
  'treadmill', 'bike', 'rower', 'skierg', 'elliptical', 'stair_climber', 'assault_bike',
  'pull_up_bar', 'bands', 'dip_station', 'sled', 'plyo_box', 'trx',
] as const;
export type EquipmentId = (typeof EQUIPMENT_ITEM_IDS)[number];

export type EquipmentGroup = { id: string; label: string; items: readonly { id: EquipmentId; label: string }[] };

export const EQUIPMENT_GROUPS: readonly EquipmentGroup[] = [
  {
    id: 'free_weights',
    label: 'Free weights',
    items: [
      { id: 'barbell', label: 'Barbell' },
      { id: 'dumbbells', label: 'Dumbbells' },
      { id: 'kettlebells', label: 'Kettlebells' },
      { id: 'ez_bar', label: 'EZ bar' },
      { id: 'plates', label: 'Plates' },
    ],
  },
  {
    id: 'racks_benches',
    label: 'Racks & benches',
    items: [
      { id: 'squat_rack', label: 'Squat rack' },
      { id: 'power_rack', label: 'Power rack' },
      { id: 'bench', label: 'Flat / incline bench' },
      { id: 'smith_machine', label: 'Smith machine' },
    ],
  },
  {
    id: 'machines',
    label: 'Machines',
    items: [
      { id: 'cable_stack', label: 'Cable stack' },
      { id: 'lat_pulldown', label: 'Lat pulldown' },
      { id: 'leg_press', label: 'Leg press' },
      { id: 'leg_extension_curl', label: 'Leg extension / curl' },
      { id: 'chest_press', label: 'Chest press' },
      { id: 'seated_row', label: 'Seated row' },
      { id: 'shoulder_press', label: 'Shoulder press' },
      { id: 'hack_squat', label: 'Hack squat' },
      { id: 'pec_deck', label: 'Pec deck' },
    ],
  },
  {
    id: 'cardio',
    label: 'Cardio',
    items: [
      { id: 'treadmill', label: 'Treadmill' },
      { id: 'bike', label: 'Bike' },
      { id: 'rower', label: 'Rower' },
      { id: 'skierg', label: 'SkiErg' },
      { id: 'elliptical', label: 'Elliptical' },
      { id: 'stair_climber', label: 'Stair climber' },
      { id: 'assault_bike', label: 'Assault bike' },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    items: [
      { id: 'pull_up_bar', label: 'Pull-up bar' },
      { id: 'bands', label: 'Bands' },
      { id: 'dip_station', label: 'Dip station' },
      { id: 'sled', label: 'Sled' },
      { id: 'plyo_box', label: 'Plyo box' },
      { id: 'trx', label: 'TRX' },
    ],
  },
];

export const MAX_WEIGHT_ITEMS = ['barbell', 'dumbbells', 'kettlebells'] as const;
export type MaxWeightItem = (typeof MAX_WEIGHT_ITEMS)[number];
export type GymMaxes = Partial<Record<MaxWeightItem, number>>;

/** Server range for each max, in the user's unit converted to lb. Stepper bounds per unit. */
export const MAX_RANGE_LB: Record<MaxWeightItem, { min: number; max: number; step: number; full: number }> = {
  barbell: { min: 45, max: 1000, step: 5, full: 405 },
  dumbbells: { min: 5, max: 300, step: 5, full: 100 },
  kettlebells: { min: 5, max: 200, step: 5, full: 70 },
};

export const PRESET_IDS = ['full', 'home', 'hotel', 'bodyweight', 'custom'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export const PRESETS: readonly { id: PresetId; label: string }[] = [
  { id: 'full', label: 'Full gym' },
  { id: 'home', label: 'Home gym' },
  { id: 'hotel', label: 'Hotel / apartment' },
  { id: 'bodyweight', label: 'Bodyweight only' },
  { id: 'custom', label: 'Custom' },
];

const allIds: readonly EquipmentId[] = EQUIPMENT_ITEM_IDS;

const PRESET_ITEMS: Record<Exclude<PresetId, 'custom'>, readonly EquipmentId[]> = {
  full: allIds,
  home: ['barbell', 'dumbbells', 'kettlebells', 'plates', 'squat_rack', 'bench', 'pull_up_bar', 'bands'],
  hotel: ['dumbbells', 'treadmill', 'bike', 'bands'],
  bodyweight: [],
};

/** Preset default max weights in lb (Home: dumbbells to 50 lb, kettlebells to 35 lb per the Paper gym-edit render). */
const PRESET_MAXES: Record<Exclude<PresetId, 'custom'>, GymMaxes> = {
  full: { barbell: 405, dumbbells: 100, kettlebells: 70 },
  home: { barbell: 225, dumbbells: 50, kettlebells: 35 },
  hotel: { dumbbells: 30 },
  bodyweight: {},
};

export const DEFAULT_GYM_NAME = 'Main gym';
export const GYM_NAME_MAX = 40;

export type GymDraft = { name: string; preset: PresetId; items: EquipmentId[]; maxes: GymMaxes };

const inListOrder = (ids: Iterable<EquipmentId>): EquipmentId[] => {
  const s = new Set(ids);
  return EQUIPMENT_ITEM_IDS.filter((id) => s.has(id));
};

export function presetGym(preset: PresetId, name = DEFAULT_GYM_NAME): GymDraft {
  if (preset === 'custom') return { name, preset, items: [], maxes: {} };
  return { name, preset, items: inListOrder(PRESET_ITEMS[preset]), maxes: { ...PRESET_MAXES[preset] } };
}

/** Skip on the equipment step: Full gym (all 31 items). */
export const defaultGym = (): GymDraft => presetGym('full');

/** Editing any item switches the preset to Custom. */
export function toggleItem(g: GymDraft, id: EquipmentId): GymDraft {
  const has = g.items.includes(id);
  const items = inListOrder(has ? g.items.filter((x) => x !== id) : [...g.items, id]);
  const maxes = { ...g.maxes };
  if (has && (MAX_WEIGHT_ITEMS as readonly string[]).includes(id)) delete maxes[id as MaxWeightItem];
  if (!has && (MAX_WEIGHT_ITEMS as readonly string[]).includes(id) && maxes[id as MaxWeightItem] == null) {
    maxes[id as MaxWeightItem] = MAX_RANGE_LB[id as MaxWeightItem].full;
  }
  return { ...g, preset: 'custom', items, maxes };
}

/** "Select all" / clear for a group. */
export function setGroup(g: GymDraft, groupId: string, on: boolean): GymDraft {
  const group = EQUIPMENT_GROUPS.find((x) => x.id === groupId);
  if (!group) return g;
  const ids = group.items.map((i) => i.id);
  let next = g;
  for (const id of ids) if (g.items.includes(id) !== on) next = toggleItem(next, id);
  return next;
}

export function setMax(g: GymDraft, item: MaxWeightItem, lb: number): GymDraft {
  const r = MAX_RANGE_LB[item];
  const v = Math.min(r.max, Math.max(r.min, Math.round(lb)));
  return { ...g, preset: 'custom', maxes: { ...g.maxes, [item]: v } };
}

export const groupCount = (g: GymDraft, groupId: string): { have: number; total: number } => {
  const group = EQUIPMENT_GROUPS.find((x) => x.id === groupId);
  const total = group?.items.length ?? 0;
  return { have: group ? group.items.filter((i) => g.items.includes(i.id)).length : 0, total };
};

export function cleanGymName(name: string): string {
  const n = name.trim().slice(0, GYM_NAME_MAX);
  return n || DEFAULT_GYM_NAME;
}
