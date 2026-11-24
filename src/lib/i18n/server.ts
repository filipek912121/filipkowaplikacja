import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, makeT, type Locale } from "./core";

export const getLocale = cache(async (): Promise<Locale> => {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const accept = (await headers()).get("accept-language") ?? "";
  if (/\bpl\b/i.test(accept)) return "pl";
  if (/\ben\b/i.test(accept)) return "en";
  return DEFAULT_LOCALE;
});

export const getT = cache(async () => makeT(await getLocale()));
