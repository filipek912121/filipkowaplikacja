"use client";

import { createContext, useContext, useMemo } from "react";
import { makeT, type Locale, type TFn } from "./core";

const Ctx = createContext<Locale>("pl");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}

export function useT(): TFn {
  const locale = useContext(Ctx);
  return useMemo(() => makeT(locale), [locale]);
}
