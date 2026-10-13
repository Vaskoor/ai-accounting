// lib/nepali-date.ts — Bikram Sambat (BS) helpers for a Nepali accounting app.
//
// The Nepali fiscal year runs Asoj 1 -> Asoj end (mid-Sept to mid-Sept).
// BS year = AD year + ~57, adjusted for the Asoj-1 boundary (~Sept 17).
// Month names are the 12 Bikram months.

export const BS_MONTHS = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra",
  "Asoj", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
];

// Asoj 1 BS falls around Sept 17 AD. We use the 17th as the boundary.
const ASOJ1_DAY = 17;

/** Map an AD Date to its BS year (integer). Correct around the Asoj boundary. */
export function toBSYear(d: Date | string): number {
  const dt = typeof d === "string" ? new Date(d) : d;
  const adYear = dt.getFullYear();
  let bs = adYear + 57;
  // before Asoj 1 (Sept 17) we're still in the previous BS year
  const asoj1 = new Date(adYear, 8, ASOJ1_DAY); // month 8 = Sept
  if (dt < asoj1) bs -= 1;
  return bs;
}

/** Nepali fiscal year label, e.g. "2082-83" for the year Asoj 2082 -> Asoj 2083. */
export function fiscalYearLabel(d: Date | string = new Date()): string {
  const bs = toBSYear(d);
  const next = (bs + 1) % 100;
  return `${bs}-${next.toString().padStart(2, "0")}`;
}

/** Approximate BS date string "YYYY-MM-DD" from an AD date. Good enough for
 *  display; uses a fixed 30/31-day month model (real BS months vary by year). */
export function adToBSString(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const bs = toBSYear(dt);
  // Asoj 1 (month 6, day 1) ~= Sept 17 of the AD year that starts the BS year.
  const asoj1Ad = new Date(dt.getFullYear(), 8, ASOJ1_DAY);
  // if we're before this year's Asoj 1, the BS year started in the previous AD year
  let startAd = asoj1Ad;
  if (dt < asoj1Ad) startAd = new Date(dt.getFullYear() - 1, 8, ASOJ1_DAY);
  const days = Math.floor((dt.getTime() - startAd.getTime()) / 86400000);
  // approximate month lengths from Asoj onward (Asoj..Chaitra, Baishakh..Bhadra)
  const lens = [30, 29, 30, 29, 30, 30, 31, 32, 31, 32, 31, 30]; // Asoj..Bhadra+ wrap
  let m = 0, dayLeft = days;
  while (m < 12 && dayLeft >= lens[m]) { dayLeft -= lens[m]; m++; }
  const month = m + 1; // 1-indexed from Asoj
  const day = dayLeft + 1;
  const realMonth = ((month + 5) % 12) + 1; // shift Asoj=6 -> proper BS month index
  return `${bs}-${realMonth.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

/** Short Nepali month label for a BS month number 1-12 (Baishakh=1..Chaitra=12). */
export function bsMonthName(m: number): string {
  return BS_MONTHS[(m - 1 + 12) % 12] || "";
}
