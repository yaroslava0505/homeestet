import type { QuizResult } from '../types.ts';
import { STYLES } from '../data/homeestetData.ts';

export type StyleWeights = Partial<Record<string, number>>;

export interface QuizOption {
  id: string;
  label: string;
  desc?: string;
  /** Colour swatch for the palette question. */
  swatch?: string;
  /** Points added to each style when this option is picked. */
  weights: StyleWeights;
}

export interface QuizQuestion {
  id: string;
  title: string;
  layout: 'swatches' | 'cards' | 'tiles' | 'styles' | 'list';
  options: QuizOption[];
}

/**
 * Every answer adds points to several styles; the winner is the style with the highest total.
 * No single question can decide the result on its own: the strongest option gives 3 points
 * and the other five questions together can give up to 13.
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'colors',
    title: '1. Які кольори тобі найбільше подобаються в інтер’єрі?',
    layout: 'swatches',
    options: [
      { id: 'beige', label: 'Бежевий та пісочний', swatch: '#EFECE6', weights: { 'warm-minimalism': 3, cozy: 1, japandi: 1 } },
      { id: 'white', label: 'Чистий білий та кремовий', swatch: '#FFFFFF', weights: { scandinavian: 3, modern: 1, classic: 1 } },
      { id: 'dark', label: 'Глибокий темний та графіт', swatch: '#2C2C2C', weights: { modern: 3, japandi: 1, contemporary: 1 } },
      { id: 'earth', label: 'Природні (шавлія, теракота)', swatch: '#8A9A86', weights: { natural: 3, japandi: 1 } },
      { id: 'pastel', label: 'М’які пастельні', swatch: '#E8DFD8', weights: { classic: 2, cozy: 2, contemporary: 1 } },
      { id: 'accent', label: 'Виразні кольорові акценти', swatch: '#967259', weights: { contemporary: 3, classic: 1 } },
    ],
  },
  {
    id: 'priority',
    title: '2. Що для тебе найважливіше відчувати вдома?',
    layout: 'cards',
    options: [
      { id: 'minimalism', label: 'Мінімалізм', desc: 'Багато вільного простору, нічого зайвого перед очима', weights: { japandi: 2, 'warm-minimalism': 2, modern: 1 } },
      { id: 'coziness', label: 'Затишок', desc: 'Тепло, пледи, приглушене світло, відчуття обіймів', weights: { cozy: 3, 'warm-minimalism': 1, natural: 1 } },
      { id: 'function', label: 'Функціональність', desc: 'Все зручно, практично, легко прибирати', weights: { scandinavian: 3, modern: 1 } },
      { id: 'aesthetics', label: 'Естетика', desc: 'Красиві фотогенічні предмети, дизайнерські форми', weights: { classic: 2, contemporary: 2 } },
      { id: 'order', label: 'Порядок', desc: 'Все на своїх місцях, чітка організація та структурованість', weights: { modern: 2, scandinavian: 1, japandi: 1 } },
    ],
  },
  {
    id: 'materials',
    title: '3. До яких матеріалів найприємніше торкатися?',
    layout: 'tiles',
    options: [
      { id: 'wood', label: 'Натуральне дерево', weights: { 'warm-minimalism': 2, scandinavian: 1, natural: 1, japandi: 1 } },
      { id: 'stone', label: 'Камінь / травертин', weights: { classic: 2, modern: 1, contemporary: 1 } },
      { id: 'metal', label: 'Тонкий метал', weights: { modern: 3, classic: 1 } },
      { id: 'glass', label: 'Скло та дзеркала', weights: { classic: 2, modern: 1, contemporary: 1 } },
      { id: 'textile', label: 'Текстиль (льон, шерсть)', weights: { cozy: 3, natural: 1 } },
      { id: 'ceramic', label: 'Матова кераміка / глина', weights: { japandi: 3, natural: 1, contemporary: 1 } },
    ],
  },
  {
    id: 'visual',
    title: '4. Який простір на фото відгукується найбільше?',
    layout: 'styles',
    options: STYLES.map((style) => ({
      id: style.id,
      label: `${style.name} (${style.uaName})`,
      desc: style.description,
      weights: { [style.id]: 3 },
    })),
  },
  {
    id: 'decor',
    title: '5. Який рівень декору тобі комфортний на полицях?',
    layout: 'list',
    options: [
      { id: 'minimum', label: 'Мінімум', desc: '1–2 предмети, абсолютно чисті площини, вільне дихання простору', weights: { japandi: 2, modern: 2, 'warm-minimalism': 1 } },
      { id: 'moderate', label: 'Помірно', desc: 'Збалансована композиція: свічка, рослина та красива книга', weights: { scandinavian: 2, 'warm-minimalism': 1, natural: 1, contemporary: 1 } },
      { id: 'rich', label: 'Люблю багато деталей', desc: 'Багато картин, вінтаж, кераміка, заповнені стелажі', weights: { cozy: 2, classic: 2, natural: 1 } },
    ],
  },
  {
    id: 'budget',
    title: '6. Який бюджет ти розглядаєш для точкового оновлення?',
    layout: 'list',
    options: [
      { id: 'under-1000', label: 'До 1 000 ₴ (максимальна економія)', weights: { scandinavian: 1, cozy: 1, natural: 1 } },
      { id: '1000-3000', label: '1 000 – 3 000 ₴ (розумний оптимум)', weights: { 'warm-minimalism': 1, natural: 1, japandi: 1 } },
      { id: '3000-5000', label: '3 000 – 5 000 ₴ (комплексний затишок)', weights: { contemporary: 1, modern: 1, japandi: 1 } },
      { id: '5000-10000', label: '5 000 – 10 000 ₴ (преміальні матеріали)', weights: { classic: 2, contemporary: 1 } },
    ],
  },
];

/** Styles whose score is within this distance of the winner are offered as a secondary style. */
const SECONDARY_THRESHOLD = 2;

export function scoreQuiz(answers: Record<string, string>): Omit<QuizResult, 'completedAt'> {
  const scores: Record<string, number> = Object.fromEntries(STYLES.map((s) => [s.id, 0]));

  for (const question of QUIZ_QUESTIONS) {
    const chosen = question.options.find((o) => o.id === answers[question.id]);
    if (!chosen) continue;
    for (const [styleId, points] of Object.entries(chosen.weights)) {
      if (styleId in scores && typeof points === 'number') scores[styleId] += points;
    }
  }

  // Stable order: higher score first, ties resolved by catalogue order.
  const ordered = STYLES.map((s) => s.id).sort((a, b) => scores[b] - scores[a]);
  const primaryStyleId = ordered[0];
  const runnerUp = ordered[1];
  const secondaryStyleId =
    runnerUp && scores[runnerUp] > 0 && scores[primaryStyleId] - scores[runnerUp] <= SECONDARY_THRESHOLD
      ? runnerUp
      : undefined;

  return { primaryStyleId, secondaryStyleId, scores, answers };
}

export function isQuizComplete(answers: Record<string, string>): boolean {
  return QUIZ_QUESTIONS.every((q) => Boolean(answers[q.id]));
}
