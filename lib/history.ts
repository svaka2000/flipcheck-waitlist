'use client';

/**
 * Local scan history + retention signal. localStorage (device-local, no account needed):
 * - history strip on /scan = the product reason to come back
 * - distinct scan DAYS = the council's "real user" metric (return-scanner = >=2 days),
 *   sent as a header on each scan so the server can count retained users.
 */
export interface HistoryEntry {
  id: string;
  itemName: string;
  verdict: 'BUY' | 'MAYBE' | 'SKIP';
  valueLow: number;
  valueHigh: number;
  thumb?: string; // small data-URI
  at: number;
}

const KEY = 'fc_history';
const DAYS_KEY = 'fc_scan_days';
const MAX = 40;

const read = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function getHistory(): HistoryEntry[] {
  return read<HistoryEntry[]>(KEY, []);
}

export function addHistory(entry: HistoryEntry): void {
  try {
    const list = [entry, ...getHistory()].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full/blocked — history is best-effort
  }
  markScanDay();
}

/** Record today (YYYY-MM-DD, local) in the distinct-days set. */
function markScanDay(): void {
  try {
    const today = new Date().toLocaleDateString('sv'); // sv locale = ISO date
    const days = read<string[]>(DAYS_KEY, []);
    if (!days.includes(today)) {
      days.push(today);
      localStorage.setItem(DAYS_KEY, JSON.stringify(days.slice(-90)));
    }
  } catch {}
}

/** Distinct days this device has scanned. >=2 means a RETURN scanner (a real user). */
export function scanDayCount(): number {
  return read<string[]>(DAYS_KEY, []).length;
}
