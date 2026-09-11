import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'dark' | 'light';
export type ThemePreference = 'dark' | 'light' | 'system';
type Language = 'en' | 'es';

const copy = {
  en: {
    'demo.live': 'Try the example',
    'nav.directory': 'Directory',
    'nav.operations': 'Operations',
    'nav.overview': 'Overview',
    'nav.parkings': 'Parkings',
    'nav.profile': 'Profile',
    'nav.signOut': 'Sign out',
    'nav.skipMain': 'Skip to main content',
    'nav.open': 'Open navigation',
    'nav.close': 'Close navigation',
    'nav.public': 'Public navigation',
    'nav.owner': 'Owner navigation',
    'nav.ownerMobile': 'Owner navigation, mobile',
    'appearance.language': 'Select language',
    'appearance.languageTheme': 'Language and theme',
    'appearance.theme': 'Theme',
    'route.loading': 'Loading route',
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'theme.system': 'System',
  },
  es: {
    'demo.live': 'Probá el ejemplo',
    'nav.directory': 'Directorio',
    'nav.operations': 'Operaciones',
    'nav.overview': 'Resumen',
    'nav.parkings': 'Cocheras',
    'nav.profile': 'Perfil',
    'nav.signOut': 'Cerrar sesión',
    'nav.skipMain': 'Saltar al contenido principal',
    'nav.open': 'Abrir navegación',
    'nav.close': 'Cerrar navegación',
    'nav.public': 'Navegación pública',
    'nav.owner': 'Navegación de operador',
    'nav.ownerMobile': 'Navegación de operador, móvil',
    'appearance.language': 'Seleccionar idioma',
    'appearance.languageTheme': 'Idioma y tema',
    'appearance.theme': 'Apariencia',
    'route.loading': 'Cargando vista',
    'theme.dark': 'Oscuro',
    'theme.light': 'Claro',
    'theme.system': 'Sistema',
  },
} as const;

type CopyKey = keyof (typeof copy)['es'];

interface AppearanceContextValue {
  language: Language;
  locale: 'en-US' | 'es-AR';
  setLanguage: (language: Language) => void;
  preference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  t: (key: CopyKey) => string;
  theme: Theme;
}

const fallbackAppearance: AppearanceContextValue = {
  language: 'en',
  locale: 'en-US',
  setLanguage: () => undefined,
  preference: 'system',
  setThemePreference: () => undefined,
  t: (key) => copy.en[key],
  theme: 'light',
};

const AppearanceContext = createContext<AppearanceContextValue>(fallbackAppearance);

function getStoredValue<T extends string>(key: string, values: readonly T[]) {
  const value = window.localStorage.getItem(key);
  return values.includes(value as T) ? (value as T) : undefined;
}

function getSystemTheme(): Theme {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(
    () => getStoredValue('parkcore-theme', ['system', 'light', 'dark'] as const) ?? 'system',
  );
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const theme = preference === 'system' ? systemTheme : preference;
  const [language, setLanguageState] = useState<Language>(
    () => getStoredValue('parkcore-lang', ['es', 'en'] as const) ?? 'es',
  );

  useEffect(() => {
    if (preference !== 'system' || typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [preference]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [preference, theme]);

  useEffect(() => {
    document.documentElement.lang = language === 'es' ? 'es-AR' : 'en-US';
    window.localStorage.setItem('parkcore-lang', language);
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);
  const setThemePreference = useCallback((nextPreference: ThemePreference) => {
    setPreference(nextPreference);
    window.localStorage.setItem('parkcore-theme', nextPreference);
  }, []);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      language,
      locale: language === 'es' ? 'es-AR' : 'en-US',
      preference,
      setLanguage,
      setThemePreference,
      t: (key) => copy[language][key],
      theme,
    }),
    [language, preference, setLanguage, setThemePreference, theme],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

// Context hooks intentionally share this module with their provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAppearance() {
  return useContext(AppearanceContext);
}
