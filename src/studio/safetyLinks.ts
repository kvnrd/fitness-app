/**
 * Destinations for the safety actions on screen 55 (Report suspected abuse).
 * Kept free of React Native imports so unit tests can check them.
 * Counsel Phase 6 Q4: hotline, online report and 911 come first; there is no in-app DFPS form.
 */
export const DFPS_HOTLINE_URL = 'tel:18002525400';
export const DFPS_ONLINE_URL = 'https://www.txabusehotline.org';
export const EMERGENCY_URL = 'tel:911';

export const SAFETY_ACTIONS = [
  { label: 'Call 1-800-252-5400', url: DFPS_HOTLINE_URL },
  { label: 'Report online at txabusehotline.org', url: DFPS_ONLINE_URL },
  { label: 'Call 911', url: EMERGENCY_URL },
] as const;
