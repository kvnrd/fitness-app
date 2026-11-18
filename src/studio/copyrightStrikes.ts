/** 3 upheld copyright notices in 12 months closes the account (17 U.S.C. §512(i)(1)(A)). */

export const STRIKE_LIMIT = 3;
export const STRIKE_WINDOW_MONTHS = 12;

export type CopyrightNotice = { upheld: boolean; noticedOn: string };

function monthsAgo(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() - months);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function upheldInWindow(notices: readonly CopyrightNotice[], asOf: string): number {
  const start = monthsAgo(asOf, STRIKE_WINDOW_MONTHS);
  return notices.filter((n) => n.upheld && n.noticedOn >= start && n.noticedOn <= asOf).length;
}

export function shouldCloseAccount(notices: readonly CopyrightNotice[], asOf: string): boolean {
  return upheldInWindow(notices, asOf) >= STRIKE_LIMIT;
}
