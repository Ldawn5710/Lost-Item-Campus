'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  categories: { key: string; name: string }[];
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 1. Load language from localStorage if available
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en' || savedLanguage === 'vi')) {
      setLanguageState(savedLanguage);
    } else if (typeof navigator !== 'undefined') {
      // 2. Detect browser default language
      const browserLang = navigator.language.substring(0, 2);
      if (browserLang === 'vi') {
        setLanguageState('vi');
      } else if (browserLang === 'en') {
        setLanguageState('en');
      } else {
        setLanguageState('ko'); // Default to Korean
      }
    }
    setIsMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    // Fallback order: current language -> Korean -> key itself
    let translated = translations[language]?.[key] || translations['ko']?.[key] || key;

    if (variables) {
      Object.entries(variables).forEach(([k, val]) => {
        translated = translated.replace(`{${k}}`, String(val));
      });
    }

    return translated;
  };

  // Localized categories helper
  const categoryKeys = ['electronics', 'wallet', 'bag', 'clothing', 'cosmetics', 'others'];
  const categories = categoryKeys.map((key) => ({
    key,
    name: t(`category.${key}`),
  }));

  // Render a clean fallback or same children if server/hydration mismatch
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, categories }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
