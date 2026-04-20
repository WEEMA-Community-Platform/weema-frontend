export type Locale = (typeof locales)[number];

export const locales = ["en", "am"] as const;
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  am: "አማርኛ",
};
