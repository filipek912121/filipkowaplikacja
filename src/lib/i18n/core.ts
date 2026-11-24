import { pl } from "./pl";

export type Locale = "pl" | "en";
export const LOCALES: Locale[] = ["pl", "en"];
export const DEFAULT_LOCALE: Locale = "pl";
export const LOCALE_COOKIE = "proofit_locale";

export type Params = Record<string, string | number>;
export type TFn = ((key: string, params?: Params) => string) & {
  /** Plural: picks the right form for n. English source forms: one / other. */
  p: (n: number, one: string, other: string, params?: Params) => string;
  locale: Locale;
};

export function isLocale(v: unknown): v is Locale {
  return v === "pl" || v === "en";
}

function interpolate(s: string, params?: Params) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** Polish plural category: 0 = one, 1 = few (2–4, not 12–14), 2 = many. */
function plIndex(n: number) {
  const a = Math.abs(n);
  if (a === 1) return 0;
  const d = a % 10;
  const dd = a % 100;
  return d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14) ? 1 : 2;
}

/**
 * English source strings are the keys. Polish lives in ./pl.ts; any missing
 * key falls back to English, so untranslated user content is shown as written.
 */
export function makeT(locale: Locale): TFn {
  const dict: Record<string, string> = locale === "pl" ? pl : {};
  const t = ((key: string, params?: Params) => interpolate(dict[key] ?? key, params)) as TFn;
  t.p = (n, one, other, params) => {
    const all = { n, ...params };
    if (locale === "en") return interpolate(n === 1 ? one : other, all);
    const forms = dict[`${one}|${other}`];
    if (!forms) return interpolate(n === 1 ? one : other, all);
    const parts = forms.split("|");
    return interpolate(parts[Math.min(plIndex(n), parts.length - 1)], all);
  };
  t.locale = locale;
  return t;
}

export function intlLocale(locale: Locale) {
  return locale === "pl" ? "pl-PL" : "en-GB";
}

export function formatDate(iso: string, locale: Locale, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Date(iso).toLocaleDateString(intlLocale(locale), opts);
}

export function formatNumber(n: number, locale: Locale) {
  return n.toLocaleString(intlLocale(locale));
}
