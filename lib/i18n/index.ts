// lib/i18n/index.ts — i18n utility
import en from './en';
import vi from './vi';

export type Lang = 'en' | 'vi';

const translations = { en, vi } as const;

export function t<
  NS extends keyof typeof en,
  K extends keyof (typeof en)[NS]
>(ns: NS, key: K, lang: Lang): string {
  const dict = translations[lang] as typeof en;
  const ns_dict = dict[ns] as Record<string, string>;
  const fallback = (en[ns] as Record<string, string>)[key as string];
  return ns_dict?.[key as string] ?? fallback ?? String(key);
}

export { en, vi };
export default translations;
