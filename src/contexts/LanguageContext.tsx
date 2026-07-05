import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, type TranslationKey } from '../config/translations';

type LanguageType = 'ar' | 'en';

type LanguageContextType = {
  language: LanguageType;
  t: (key: TranslationKey) => string;
  setLanguage: (lang: LanguageType) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageType>('ar');

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem('user-app-language');
        if (saved === 'en' || saved === 'ar') {
          setLanguageState(saved);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSavedLanguage();
  }, []);

  const setLanguage = async (lang: LanguageType) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('user-app-language', lang);
    } catch (err) {
      console.error(err);
    }
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.ar;
    return dict[key] || translations.ar[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
