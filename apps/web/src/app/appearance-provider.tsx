import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'dark' | 'light';
type Language = 'en' | 'es';

const copy = {
  en: {
    'demo.live': 'DEMO · LIVE',
    'nav.directory': 'Directory',
    'nav.operations': 'Operations',
    'nav.profile': 'Profile',
    'nav.signOut': 'Sign out',
    'theme.dark': 'Switch to dark theme',
    'theme.light': 'Switch to light theme',
  },
  es: {
    'demo.live': 'DEMO · EN VIVO',
    'nav.directory': 'Directorio',
    'nav.operations': 'Operaciones',
    'nav.profile': 'Perfil',
    'nav.signOut': 'Cerrar sesión',
    'theme.dark': 'Cambiar a tema oscuro',
    'theme.light': 'Cambiar a tema claro',
  },
} as const;

type CopyKey = keyof (typeof copy)['es'];

interface AppearanceContextValue {
  language: Language;
  locale: 'en-US' | 'es-AR';
  setLanguage: (language: Language) => void;
  suggestTheme: (theme: Theme) => void;
  t: (key: CopyKey) => string;
  theme: Theme;
  toggleTheme: () => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function getStoredValue<T extends string>(key: string, values: readonly T[]) {
  const value = window.localStorage.getItem(key);
  return values.includes(value as T) ? (value as T) : undefined;
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [hasThemePreference, setHasThemePreference] = useState(
    () => getStoredValue('parkcore-theme', ['light', 'dark'] as const) !== undefined,
  );
  const [theme, setTheme] = useState<Theme>(
    () =>
      getStoredValue('parkcore-theme', ['light', 'dark'] as const) ??
      (typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'),
  );
  const [language, setLanguageState] = useState<Language>(
    () => getStoredValue('parkcore-lang', ['es', 'en'] as const) ?? 'es',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('parkcore-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language === 'es' ? 'es-AR' : 'en-US';
    window.localStorage.setItem('parkcore-lang', language);
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);
  const toggleTheme = useCallback(() => {
    setHasThemePreference(true);
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, []);
  const suggestTheme = useCallback(
    (suggestedTheme: Theme) => {
      if (hasThemePreference) return;
      setTheme(suggestedTheme);
    },
    [hasThemePreference],
  );

  const value = useMemo<AppearanceContextValue>(
    () => ({
      language,
      locale: language === 'es' ? 'es-AR' : 'en-US',
      setLanguage,
      suggestTheme,
      t: (key) => copy[language][key],
      theme,
      toggleTheme,
    }),
    [language, setLanguage, suggestTheme, theme, toggleTheme],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used inside AppearanceProvider');
  return context;
}
