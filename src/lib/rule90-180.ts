export interface Stay {
  id: string;
  country: string;
  entryDate: string;
  exitDate: string;
}

export interface WindowResult {
  daysUsed: number;
  daysRemaining: number;
}

const MS_PER_DAY = 86400000;

function parseDate(isoDate: string): Date {
  const d = new Date(isoDate + "T12:00:00");
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${isoDate}`);
  return d;
}

function toDayOrdinal(d: Date): number {
  return Math.floor(d.getTime() / MS_PER_DAY);
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Today's date in local timezone (YYYY-MM-DD). Use this for "as of" calculations. */
export function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Number of days overlap between [stayEntry, stayExit] and [windowStart, windowEnd] (inclusive).
 */
function overlapDays(
  stayEntry: Date,
  stayExit: Date,
  windowStart: Date,
  windowEnd: Date
): number {
  const overlapStart = stayEntry > windowStart ? stayEntry : windowStart;
  const overlapEnd = stayExit < windowEnd ? stayExit : windowEnd;
  if (overlapEnd < overlapStart) return 0;
  return toDayOrdinal(overlapEnd) - toDayOrdinal(overlapStart) + 1;
}

/**
 * Total days spent in the 180-day window ending on windowEnd (inclusive).
 * Window = [windowEnd - 179 days, windowEnd].
 */
export function daysInWindow(stays: Stay[], windowEnd: string): number {
  const end = parseDate(windowEnd);
  const start = new Date(end);
  start.setDate(start.getDate() - 179);

  let total = 0;
  for (const s of stays) {
    const entry = parseDate(s.entryDate);
    const exit = parseDate(s.exitDate);
    total += overlapDays(entry, exit, start, end);
  }
  return total;
}

/**
 * Days used in the 180-day window ending on asOfDate (default today), for the given country.
 */
export function daysUsedToday(
  stays: Stay[],
  country: string,
  asOfDate?: string
): number {
  const date = asOfDate ?? todayLocal();
  const byCountry = stays.filter(
    (s) => s.country.toLowerCase().trim() === country.toLowerCase().trim()
  );
  return daysInWindow(byCountry, date);
}

/**
 * Days remaining in the 180-day window (90 - used), clamped to 0.
 */
export function daysRemaining(
  stays: Stay[],
  country: string,
  asOfDate?: string
): number {
  const used = daysUsedToday(stays, country, asOfDate);
  return Math.max(0, 90 - used);
}

/**
 * First date T >= afterDate (ISO date string) such that days in the 180-day window ending on T is < 90.
 * Returns null if already under 90 on afterDate.
 */
export function nextPossibleEntry(
  stays: Stay[],
  country: string,
  afterDate: string
): string | null {
  const byCountry = stays.filter(
    (s) => s.country.toLowerCase().trim() === country.toLowerCase().trim()
  );
  const after = parseDate(afterDate);
  const usedOnAfter = daysInWindow(byCountry, afterDate);
  if (usedOnAfter < 90) return afterDate;

  // Iterate day by day until we find a date when usage drops below 90
  const maxIterations = 365;
  let d = new Date(after);
  for (let i = 0; i < maxIterations; i++) {
    d.setDate(d.getDate() + 1);
    const dateStr = formatDate(d);
    const used = daysInWindow(byCountry, dateStr);
    if (used < 90) return dateStr;
  }
  return null;
}

/**
 * Check if adding this stay would cause overstay for the given country.
 * Returns true if for any day in [entry, exit] the 180-day window ending that day would exceed 90 days.
 */
export function wouldOverstay(
  existingStays: Stay[],
  country: string,
  entryDate: string,
  exitDate: string
): boolean {
  const byCountry = existingStays.filter(
    (s) => s.country.toLowerCase().trim() === country.toLowerCase().trim()
  );
  const entry = parseDate(entryDate);
  const exit = parseDate(exitDate);
  const candidate: Stay = {
    id: "",
    country,
    entryDate,
    exitDate,
  };
  const withNew = [...byCountry, candidate];

  let d = new Date(entry);
  const endOrd = toDayOrdinal(exit);
  while (toDayOrdinal(d) <= endOrd) {
    const dateStr = formatDate(d);
    if (daysInWindow(withNew, dateStr) > 90) return true;
    d.setDate(d.getDate() + 1);
  }
  return false;
}

/**
 * Whether the current set of stays for the country ever exceeds 90 days in any 180-day window.
 */
export function hasOverstay(stays: Stay[], country: string): boolean {
  const byCountry = stays.filter(
    (s) => s.country.toLowerCase().trim() === country.toLowerCase().trim()
  );
  if (byCountry.length === 0) return false;
  const entries = byCountry.map((s) => parseDate(s.entryDate));
  const exits = byCountry.map((s) => parseDate(s.exitDate));
  const minDate = new Date(Math.min(...entries.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...exits.map((d) => d.getTime())));
  let d = new Date(minDate);
  const maxOrd = toDayOrdinal(maxDate);
  while (toDayOrdinal(d) <= maxOrd) {
    const dateStr = formatDate(d);
    if (daysInWindow(byCountry, dateStr) > 90) return true;
    d.setDate(d.getDate() + 1);
  }
  return false;
}
