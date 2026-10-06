"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { localeCookie, resolveBrowserLocale, type Locale } from "./config";
import { messagesByLocale } from "./messages";

const LanguageContext = createContext<((locale: Locale) => void) | null>(null);

function subscribeToBrowserLanguage(onChange: () => void) {
  window.addEventListener("languagechange", onChange);
  return () => window.removeEventListener("languagechange", onChange);
}

function getBrowserLocale(): Locale {
  let cookieString = "";
  try {
    cookieString = document.cookie;
  } catch {
    // Restricted cookie access still allows browser language negotiation.
  }
  const languages = navigator.languages.length ? navigator.languages : [navigator.language];
  return resolveBrowserLocale(cookieString, languages);
}

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  // React uses the server snapshot during hydration, then reads browser preferences.
  // This keeps the initial render identical to the exported default-language HTML.
  const browserLocale = useSyncExternalStore(subscribeToBrowserLanguage, getBrowserLocale, () => initialLocale);
  const [selectedLocale, setSelectedLocale] = useState<Locale | null>(null);
  const locale = selectedLocale ?? browserLocale;
  const messages = messagesByLocale[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = messages.App.title;
  }, [locale, messages.App.title]);

  function changeLocale(nextLocale: Locale) {
    setSelectedLocale(nextLocale);
    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${localeCookie}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    } catch {
      // Restricted storage still allows changing language for the current visit.
    }
  }

  return (
    <LanguageContext.Provider value={changeLocale}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
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
