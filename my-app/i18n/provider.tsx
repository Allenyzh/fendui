"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { localeCookie, type Locale } from "./config";
import { messagesByLocale } from "./messages";

const LanguageContext = createContext<((locale: Locale) => void) | null>(null);

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocale] = useState(initialLocale);
  const messages = messagesByLocale[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = messages.App.title;
  }, [locale, messages.App.title]);

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${localeCookie}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    } catch {
      // Restricted storage still allows changing language for the current visit.
    }
  }

  return (
    <LanguageContext.Provider value={changeLocale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useChangeLocale() {
  const changeLocale = useContext(LanguageContext);
  if (!changeLocale) throw new Error("LanguageProvider is required");
  return changeLocale;
}
