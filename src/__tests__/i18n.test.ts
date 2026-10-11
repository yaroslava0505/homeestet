import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RU } from '../i18n/ru.ts';
import { DATA_RU } from '../i18n/dataRu.ts';
import { localeFromPath, plural, setLocale, stripLocale, t, withLocale } from '../i18n/index.ts';

const SRC = path.resolve(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !full.endsWith('ru.ts') ? [full] : [];
  });
}

/** Every Ukrainian string passed to t() anywhere in src. */
function collectKeys(): string[] {
  const keys = new Set<string>();
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g)) keys.add(m[1].replace(/\\'/g, "'"));
  }
  return [...keys];
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

describe('Russian dictionary', () => {
  const keys = collectKeys();

  it('covers every t() string used in the code', () => {
    const missing = keys.filter((k) => !(k in RU) && !(k in DATA_RU));
    expect(missing, `missing Russian for:\n${missing.join('\n')}`).toEqual([]);
    expect(keys.length).toBeGreaterThan(300);
  });

  it('keeps the same placeholders as the Ukrainian source', () => {
    const broken = Object.entries(RU).filter(([uk, ru]) => placeholders(uk) !== placeholders(ru));
    expect(broken).toEqual([]);
  });

  it('has no empty translations and no Ukrainian-only letters left in Russian text', () => {
    const suspicious = Object.entries(RU).filter(([, ru]) => !ru.trim() || /[іїєґІЇЄҐ]/.test(ru));
    expect(suspicious).toEqual([]);
  });
});

describe('Russian data dictionary', () => {
  const DATA_FILES = ['data/homeestetData.ts', 'data/products.ts', 'data/articles.ts', 'data/shopCategories.ts', 'utils/quizEngine.ts'];
  // Internal keys that are matched, not shown: the small-space filter ids.
  const INTERNAL = new Set(['20 м²', 'маленька кухня', 'маленька спальня', 'маленьке робоче місце']);

  it('covers every Ukrainian string literal in the data files', () => {
    const missing: string[] = [];
    for (const file of DATA_FILES) {
      const text = readFileSync(path.join(SRC, file), 'utf8');
      for (const m of text.matchAll(/'((?:[^'\\\n]|\\.)*[а-яА-ЯіїєґІЇЄҐ](?:[^'\\\n]|\\.)*)'/g)) {
        const literal = m[1].replace(/\\'/g, "'");
        if (INTERNAL.has(literal) || literal.startsWith('prod-')) continue;
        if (!(literal in DATA_RU) && !(literal in RU)) missing.push(`${file}: ${literal.slice(0, 60)}`);
      }
    }
    expect(missing, `no Russian for:\n${missing.join('\n')}`).toEqual([]);
  });

  it('keeps Russian values free of Ukrainian-only letters (brand names excepted)', () => {
    const suspicious = Object.entries(DATA_RU).filter(([, ru]) => !ru.trim() || (/[іїєґІЇЄҐ]/.test(ru) && !ru.includes('Будинок іграшок')));
    expect(suspicious).toEqual([]);
  });
});

describe('locale helpers', () => {
  it('detects and strips the /ru prefix', () => {
    expect(localeFromPath('/ru')).toBe('ru');
    expect(localeFromPath('/ru/zones')).toBe('ru');
    expect(localeFromPath('/rules')).toBe('uk');
    expect(stripLocale('/ru/zones/sofa')).toBe('/zones/sofa');
    expect(stripLocale('/ru')).toBe('/');
    expect(withLocale('/zones', 'ru')).toBe('/ru/zones');
    expect(withLocale('/ru/zones', 'uk')).toBe('/zones');
    expect(withLocale('/', 'ru')).toBe('/ru/');
  });

  it('translates with interpolation and falls back to Ukrainian', () => {
    setLocale('ru');
    expect(t('Показати ще {n}', { n: 4 })).toBe('Показать ещё 4');
    expect(t('рядок без перекладу')).toBe('рядок без перекладу');
    setLocale('uk');
    expect(t('Показати ще {n}', { n: 4 })).toBe('Показати ще 4');
  });

  it('plural forms', () => {
    expect(plural(1, 'крок', 'кроки', 'кроків')).toBe('крок');
    expect(plural(3, 'крок', 'кроки', 'кроків')).toBe('кроки');
    expect(plural(5, 'крок', 'кроки', 'кроків')).toBe('кроків');
    expect(plural(11, 'крок', 'кроки', 'кроків')).toBe('кроків');
    expect(plural(21, 'крок', 'кроки', 'кроків')).toBe('крок');
  });
});
