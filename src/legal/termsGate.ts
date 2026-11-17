/** ToS §20: a pending re-acceptance never blocks privacy settings, data export, or deletion. */
export type TermsReacceptGate = {
  showReaccept: boolean;
  allowPrivacySettings: boolean;
  allowDataExport: boolean;
  allowAccountDeletion: boolean;
  allowGeneralApp: boolean;
};

export function termsReacceptGate(opts: { inApp: boolean; termsCurrent: boolean | null; isMinor: boolean }): TermsReacceptGate {
  const pending = opts.inApp && opts.termsCurrent === false;
  // Adults wait until terms status is known and current. Minors keep using the app
  // while a parent re-accepts. Privacy, export, and deletion stay reachable either way (ToS §20).
  return {
    showReaccept: pending,
    allowPrivacySettings: opts.inApp,
    allowDataExport: opts.inApp,
    allowAccountDeletion: opts.inApp,
    allowGeneralApp: opts.inApp && (opts.termsCurrent === true || opts.isMinor),
  };
}
