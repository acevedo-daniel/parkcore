import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type Theme = 'dark' | 'light';
export type ThemePreference = 'dark' | 'light' | 'system';
export type Locale = 'en-US' | 'es-AR';
export type Language = 'en' | 'es';

const THEME_STORAGE_KEY = 'parkcore-theme';
const LOCALE_STORAGE_KEY = 'parkcore-lang';
const THEME_COLOR_BY_THEME: Record<Theme, string> = {
  dark: '#111310',
  light: '#f7f7f4',
};

const noop = () => undefined;

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
    'appearance.languageEnglish': 'English',
    'appearance.languageSpanish': 'Spanish',
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
    'appearance.languageEnglish': 'Inglés',
    'appearance.languageSpanish': 'Español',
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
  locale: Locale;
  setLanguage: (language: Language | Locale) => void;
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

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}

function parseThemePreference(value: string | null | undefined): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

function parseLocale(value: string | null | undefined): Locale {
  if (value === 'en-US' || value === 'en') return 'en-US';
  return 'es-AR';
}

function languageForLocale(locale: Locale): Language {
  return locale === 'es-AR' ? 'es' : 'en';
}

function getSystemTheme(): Theme {
  try {
    return typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

function subscribeToSystemTheme(onChange: () => void) {
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', onChange);
    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  } catch {
    return noop;
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    parseThemePreference(readStoredValue(THEME_STORAGE_KEY)),
  );
  const subscribe = useCallback(
    (onChange: () => void) => (preference === 'system' ? subscribeToSystemTheme(onChange) : noop),
    [preference],
  );
  const getSnapshot = useCallback(
    (): Theme => (preference === 'system' ? getSystemTheme() : 'light'),
    [preference],
  );
  const systemTheme = useSyncExternalStore<Theme>(subscribe, getSnapshot, () => 'light');
  const theme = preference === 'system' ? systemTheme : preference;
  const [locale, setLocale] = useState<Locale>(() =>
    parseLocale(readStoredValue(LOCALE_STORAGE_KEY)),
  );
  const language = languageForLocale(locale);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR_BY_THEME[theme]);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
    writeStoredValue(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const setLanguage = useCallback((nextLanguage: Language | Locale) => {
    setLocale(parseLocale(nextLanguage));
  }, []);
  const setThemePreference = useCallback((nextPreference: ThemePreference) => {
    setPreference(nextPreference);
    writeStoredValue(THEME_STORAGE_KEY, nextPreference);
  }, []);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      language,
      locale,
      preference,
      setLanguage,
      setThemePreference,
      t: (key) => copy[language][key],
      theme,
    }),
    [language, locale, preference, setLanguage, setThemePreference, theme],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

// Context hooks intentionally share this module with their provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAppearance() {
  return useContext(AppearanceContext);
}
