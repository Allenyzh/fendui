"use client";

import { useLocale, useTranslations } from "next-intl";
import { focusRing } from "@/features/team-split/styles";
import { isLocale, languageNames, locales } from "./config";
import { useChangeLocale } from "./provider";

export function LanguageSelect() {
  const locale = useLocale();
  const t = useTranslations("App");
  const changeLocale = useChangeLocale();

  return (
    <div className="relative flex-none">
      <select
        id="language-select"
        aria-label={t("language")}
        value={locale}
        onChange={(event) => {
          const value = event.currentTarget.value;
          if (isLocale(value)) changeLocale(value);
        }}
        className={`min-h-10 cursor-pointer appearance-none rounded-md border border-line bg-surface py-2 pr-9 pl-3 font-sans text-[13px] leading-normal text-ink hover:border-ink-3 ${focusRing}`}
      >
        {locales.map((value) => (
          <option key={value} value={value} lang={value}>{languageNames[value]}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="m4 6 4 4 4-4" />
      </svg>
    </div>
  );
}
