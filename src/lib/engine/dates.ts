/** Date helpers that work on "day keys" (YYYY-MM-DD) in the app time zone. */

export function appTimeZone(): string {
  return process.env.APP_TIMEZONE || "Europe/Warsaw";
}

export function dayKey(date: Date = new Date(), timeZone: string = appTimeZone()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Whole days from a to b (b - a). */
export function diffDays(a: string, b: string): number {
  const ms = new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

export function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso);
  d.setTime(d.getTime() + n * 86_400_000);
  return d.toISOString();
}

/** Start of the current ISO week (Monday) as a day key. */
export function startOfWeek(today: string): string {
  const d = new Date(`${today}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  return addDays(today, -dow);
}

export function startOfMonth(today: string): string {
  return `${today.slice(0, 8)}01`;
}

export function daysLeft(endsAtIso: string, now = new Date()): number {
  return Math.max(0, Math.ceil((new Date(endsAtIso).getTime() - now.getTime()) / 86_400_000));
}
