import englishCatalog from '../locales/en-US.json';
import spanishCatalog from '../locales/es-AR.json';

export const DEFAULT_LOCALE = 'es-AR' as const;
export const SUPPORTED_LOCALES = ['es-AR', 'en-US'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

type Catalog = typeof spanishCatalog;

export const catalogs = {
  'es-AR': spanishCatalog,
  'en-US': englishCatalog,
} satisfies Record<Locale, Catalog>;

type LeafKeys<Value, Prefix extends string = ''> = {
  [Key in keyof Value & string]: Value[Key] extends string
    ? `${Prefix}${Key}`
    : Value[Key] extends object
      ? LeafKeys<Value[Key], `${Prefix}${Key}.`>
      : never;
}[keyof Value & string];

export type MessageKey = LeafKeys<Catalog>;
export type InterpolationValues = Readonly<Record<string, string | number>>;
export type Translator = (key: MessageKey, values?: InterpolationValues) => string;
export type PluralKeys = Readonly<{ one: MessageKey; other: MessageKey }>;
export type PluralTranslator = (
  count: number,
  keys: PluralKeys,
  values?: InterpolationValues,
) => string;

export function resolveLocale(value: unknown): Locale {
  return value === 'en-US' || value === 'en' ? 'en-US' : DEFAULT_LOCALE;
}

function readCatalogMessage(catalog: unknown, key: string): string | undefined {
  let value: unknown = catalog;
  for (const segment of key.split('.')) {
    if (!value || typeof value !== 'object') return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return typeof value === 'string' ? value : undefined;
}

function interpolate(message: string, values?: InterpolationValues) {
  return message.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (placeholder, name: string) => {
    const value = values?.[name];
    return value === undefined ? placeholder : String(value);
  });
}

export function translate(locale: Locale, key: MessageKey, values?: InterpolationValues): string {
  const message =
    readCatalogMessage(catalogs[locale], key) ?? readCatalogMessage(catalogs[DEFAULT_LOCALE], key);
  return message ? interpolate(message, values) : '';
}

export function createTranslator(value: unknown): Translator {
  const locale = resolveLocale(value);
  return (key, values) => translate(locale, key, values);
}

export function createPluralTranslator(value: unknown): PluralTranslator {
  const locale = resolveLocale(value);
  return (count, keys, values) =>
    translate(locale, count === 1 ? keys.one : keys.other, { count, ...values });
}
