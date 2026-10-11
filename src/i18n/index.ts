import { RU } from './ru.ts';
import { DATA_RU } from './dataRu.ts';

/**
 * Two languages, one code base. Ukrainian is the source language: every string in the code is written in
 * Ukrainian, and `t()` looks the Russian version up in `ru.ts` by that Ukrainian text. The locale is decided
 * once at boot from the URL (`/ru/...` is Russian, everything else Ukrainian); switching language reloads the
 * page on the matching path, so components never need to react to a locale change.
 */
export type Locale = 'uk' | 'ru';

/** The few browser globals this module touches, typed locally so the Workers build (no DOM lib) compiles too. */
interface BrowserGlobals {
  window?: {
    location: { pathname: string; search: string; assign: (url: string) => void };
    localStorage?: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };
  };
  document?: {
    documentElement: { lang: string };
    title: string;
    querySelector: (selector: string) => { setAttribute: (name: string, value: string) => void } | null;
  };
}
const browser = globalThis as unknown as BrowserGlobals;

export const LOCALES: Locale[] = ['uk', 'ru'];
export const DEFAULT_LOCALE: Locale = 'uk';
const LOCALE_PREFIX: Record<Locale, string> = { uk: '', ru: '/ru' };
const STORAGE_KEY = 'homeestet_locale';

// Evaluated eagerly: module-level constants in pages (menu labels, lists) call t() at import time.
let current: Locale = browser.window ? localeFromPath(browser.window.location.pathname) : DEFAULT_LOCALE;

export function getLocale(): Locale {
  return current;
}

/** Test and server-side helper: set the locale explicitly. */
export function setLocale(locale: Locale): void {
  current = locale;
}

/** Locale encoded in a pathname (`/ru/zones` → ru), or the default. */
export function localeFromPath(pathname: string): Locale {
  return pathname === '/ru' || pathname.startsWith('/ru/') ? 'ru' : 'uk';
}

/** Path without the locale prefix (`/ru/zones` → `/zones`). */
export function stripLocale(pathname: string): string {
  if (pathname === '/ru') return '/';
  return pathname.startsWith('/ru/') ? pathname.slice(3) : pathname;
}

/** Path with the prefix of the given locale (`/zones` → `/ru/zones`). */
export function withLocale(pathname: string, locale: Locale = current): string {
  const bare = stripLocale(pathname);
  const prefix = LOCALE_PREFIX[locale];
  if (!prefix) return bare;
  return bare === '/' ? `${prefix}/` : `${prefix}${bare}`;
}

/**
 * Decides the locale at boot: the URL wins; a bare `/` opens in the language the visitor chose last time.
 * Returns a path to navigate to (full reload) when a redirect is needed, otherwise null.
 */
export function initLocale(pathname: string): string | null {
  let stored: string | null = null;
  try {
    stored = browser.window?.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    /* storage unavailable */
  }
  const fromPath = localeFromPath(pathname);
  if (fromPath === 'uk' && pathname === '/' && stored === 'ru') {
    // Modules were already evaluated in Ukrainian: a real navigation is the only clean way to switch.
    return withLocale('/', 'ru');
  }
  current = fromPath;
  const doc = browser.document;
  if (doc) {
    doc.documentElement.lang = current;
    if (current === 'ru') {
      doc.title = t('HOMEESTET — Сервіс для створення естетичного та затишного дому');
      doc
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', t('Інтерактивний сервіс для трансформації зон дому: готові рішення під ваш стиль та бюджет, перетворення маленьких та орендованих квартир, персональний план на 30 днів.'));
    }
  }
  return null;
}

/** Remembers the choice and reloads the current page in the other language. */
export function switchLocale(locale: Locale): void {
  const win = browser.window;
  if (!win) return;
  try {
    win.localStorage?.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage unavailable */
  }
  win.location.assign(withLocale(win.location.pathname, locale) + win.location.search);
}

type Vars = Record<string, string | number>;

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/** Translates a Ukrainian source string into the current locale. Unknown strings fall back to Ukrainian. */
export function t(uk: string, vars?: Vars): string {
  const text = current === 'ru' ? (RU[uk] ?? DATA_RU[uk] ?? uk) : uk;
  return interpolate(text, vars);
}

function walk(value: unknown): unknown {
  if (typeof value === 'string') return DATA_RU[value] ?? RU[value] ?? value;
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) out[key] = walk(inner);
    return out;
  }
  return value;
}

/**
 * Deep-copies a data constant with every known Ukrainian string replaced by its Russian version.
 * Ids, hex colours, paths and untranslated strings pass through untouched. No-op in Ukrainian.
 */
export function localizeData<T>(value: T): T {
  return current === 'ru' ? (walk(value) as T) : value;
}

/** Picks one of two literals by locale; for short fragments where a dictionary entry is overkill. */
export function pick(uk: string, ru: string): string {
  return current === 'ru' ? ru : uk;
}

/** Ukrainian and Russian share the plural rules: 1 крок, 2–4 кроки, 5+ кроків. */
export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/** Translates a localizable field of a data record (`localizeRecord(zone, ZONES_RU[zone.id])`). */
export function localize<T extends object>(item: T, overrides: Partial<T> | undefined): T {
  if (current !== 'ru' || !overrides) return item;
  return { ...item, ...overrides };
}
