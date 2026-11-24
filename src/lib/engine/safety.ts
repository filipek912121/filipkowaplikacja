/**
 * Lightweight content-safety screen for user-generated challenges.
 * PROOFIT never hosts challenges that encourage dangerous exercise,
 * sleep deprivation, starvation, dehydration, substance use or self-harm.
 * This is a first line of defence — public challenges can still be reported/moderated.
 */
const BLOCKED: { pattern: RegExp; reason: string }[] = [
  { pattern: /\b(no|zero|without)\s+(food|eating|meals?)\b|\bstarv|\bwater[- ]?fast|\bdry[- ]?fast|\b(\d{2,}|[3-9])[- ]?(day|hour)s?\s+fast/i, reason: "starvation or extreme fasting" },
  { pattern: /\b(no|zero|without)\s+(water|drinking|fluids?)\b|\bdehydrat/i, reason: "dehydration" },
  { pattern: /\b(no|zero|without)\s+sleep|\bsleep\s*depriv|\ball[- ]?nighters?\b|\bstay\s+awake\s+(for\s+)?\d{2,}/i, reason: "sleep deprivation" },
  { pattern: /\b(alcohol|vodka|beer|shots?\s+of|drunk|drugs?|weed|cocaine|pills?|vape|nicotine|smok(e|ing))\b/i, reason: "substance use" },
  { pattern: /\b(self[- ]?harm|cut(ting)?\s+(yourself|myself)|suicid|hurt\s+(yourself|myself)|kill\s+(yourself|myself))\b/i, reason: "self-harm" },
  { pattern: /\b(\d{3,})\s*(push[- ]?ups|squats|burpees|km|miles)\b|\buntil\s+(you\s+)?(pass\s+out|faint|puke|vomit|collapse)|\bice\s+bath\s+for\s+\d{2,}\s*(min|hour)|\bhold\s+(your\s+)?breath/i, reason: "dangerous exercise" },
  { pattern: /\b(laxative|diet\s+pills?|purg(e|ing))\b/i, reason: "unsafe dieting" },
];

export function screenChallengeText(...texts: string[]): { ok: true } | { ok: false; reason: string } {
  const joined = texts.join(" \n ");
  for (const rule of BLOCKED) {
    if (rule.pattern.test(joined)) return { ok: false, reason: rule.reason };
  }
  return { ok: true };
}
