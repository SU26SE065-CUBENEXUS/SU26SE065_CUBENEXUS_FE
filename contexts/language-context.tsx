'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Lang } from '@/lib/i18n';
import { t as tFn } from '@/lib/i18n';
import en from '@/lib/i18n/en';

const STORAGE_KEY = 'cubenexus_lang';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Shorthand translate: t('nav', 'home') */
  t: <NS extends keyof typeof en, K extends keyof (typeof en)[NS]>(ns: NS, key: K) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (ns, key) => String(key),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === 'en' || saved === 'vi') {
      setLangState(saved);
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    // Update html lang attribute for accessibility
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }
  }, []);

  const translate = useCallback(
    <NS extends keyof typeof en, K extends keyof (typeof en)[NS]>(ns: NS, key: K): string => {
      return tFn(ns, key, lang);
    },
    [lang]
  );

  // Avoid hydration mismatch: render children only after mount
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ lang: 'en', setLang, t: translate }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
