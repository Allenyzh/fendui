export const locales = ["zh-CN", "en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh-CN";
export const localeCookie = "team-split-locale";
export const languageNames: Record<Locale, string> = {
  "zh-CN": "中文",
  en: "English",
  fr: "Français",
};

export function isLocale(value: unknown): value is Locale {
  return locales.some((locale) => locale === value);
}

export function resolveLocale(preference?: string, acceptLanguage = ""): Locale {
  if (isLocale(preference)) return preference;

  const languages = acceptLanguage
    .split(",")
    .map((entry) => {
      const [tag, ...parameters] = entry.trim().split(";");
      const quality = parameters.find((parameter) => parameter.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), quality: quality ? Number(quality.trim().slice(2)) : 1 };
    })
    .filter(({ quality }) => Number.isFinite(quality) && quality > 0 && quality <= 1)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of languages) {
    const language = tag.split("-")[0];
    if (language === "zh") return "zh-CN";
    if (language === "en" || language === "fr") return language;
  }
  return defaultLocale;
}

export function resolveBrowserLocale(cookieString: string, languages: readonly string[]): Locale {
  const savedValue = cookieString
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${localeCookie}=`))
    ?.slice(localeCookie.length + 1);

  let preference: string | undefined;
  try {
    preference = savedValue === undefined ? undefined : decodeURIComponent(savedValue);
  } catch {
    // Invalid cookie encoding must not block browser language negotiation.
  }

  return resolveLocale(preference, languages.join(","));
}
