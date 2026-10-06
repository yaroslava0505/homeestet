import type {
  PlanEntry,
  PlanState,
  Preferences,
  QuizResult,
  SavedItem,
} from '../types.ts';

/**
 * Single place for everything HomeEstet keeps in localStorage.
 * Every function reads the current value, applies the change, writes it back and returns the new value,
 * so React state can simply mirror the return value.
 */

export const STORAGE_KEYS = {
  preferences: 'homeestet_preferences',
  savedIdeas: 'homeestet_saved_ideas',
  plan: 'homeestet_plan',
  savedProducts: 'homeestet_saved_products',
  quiz: 'homeestet_quiz',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): T {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota): the in-memory state still works for this session.
  }
  return value;
}

// ---- Preferences ----

export function getPreferences(): Preferences {
  return read<Preferences>(STORAGE_KEYS.preferences, {});
}

export function savePreferences(patch: Partial<Preferences>): Preferences {
  return write(STORAGE_KEYS.preferences, { ...getPreferences(), ...patch });
}

// ---- Saved ideas and solutions ----

export function getSavedIdeas(): SavedItem[] {
  const items = read<SavedItem[]>(STORAGE_KEYS.savedIdeas, []);
  return Array.isArray(items) ? items : [];
}

export function saveIdea(item: SavedItem): SavedItem[] {
  const rest = getSavedIdeas().filter((i) => i.id !== item.id);
  return write(STORAGE_KEYS.savedIdeas, [item, ...rest]);
}

export function removeIdea(id: string): SavedItem[] {
  return write(
    STORAGE_KEYS.savedIdeas,
    getSavedIdeas().filter((i) => i.id !== id)
  );
}

// ---- Plan ----

const EMPTY_PLAN: PlanState = { completedTaskIds: [], entries: [] };

export function getPlan(): PlanState {
  const plan = read<PlanState>(STORAGE_KEYS.plan, EMPTY_PLAN);
  return {
    completedTaskIds: Array.isArray(plan.completedTaskIds) ? plan.completedTaskIds : [],
    entries: Array.isArray(plan.entries) ? plan.entries : [],
  };
}

export function addToPlan(entry: PlanEntry): PlanState {
  const plan = getPlan();
  const entries = [entry, ...plan.entries.filter((e) => e.id !== entry.id)];
  return write(STORAGE_KEYS.plan, { ...plan, entries });
}

export function removeFromPlan(entryId: string): PlanState {
  const plan = getPlan();
  const prefix = `${entryId}:`;
  return write(STORAGE_KEYS.plan, {
    completedTaskIds: plan.completedTaskIds.filter((id) => !id.startsWith(prefix)),
    entries: plan.entries.filter((e) => e.id !== entryId),
  });
}

export function toggleTask(taskId: string): PlanState {
  const plan = getPlan();
  const done = plan.completedTaskIds.includes(taskId);
  return write(STORAGE_KEYS.plan, {
    ...plan,
    completedTaskIds: done
      ? plan.completedTaskIds.filter((id) => id !== taskId)
      : [...plan.completedTaskIds, taskId],
  });
}

// ---- Saved products ----

export function getSavedProducts(): string[] {
  const ids = read<string[]>(STORAGE_KEYS.savedProducts, []);
  return Array.isArray(ids) ? ids : [];
}

export function toggleSavedProduct(productId: string): string[] {
  const ids = getSavedProducts();
  return write(
    STORAGE_KEYS.savedProducts,
    ids.includes(productId) ? ids.filter((id) => id !== productId) : [productId, ...ids]
  );
}

// ---- Quiz ----

export function getQuiz(): QuizResult | null {
  return read<QuizResult | null>(STORAGE_KEYS.quiz, null);
}

export function saveQuiz(result: QuizResult): QuizResult {
  return write(STORAGE_KEYS.quiz, result);
}
