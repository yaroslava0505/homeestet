import { describe, expect, it } from 'vitest';
import { QUIZ_QUESTIONS, isQuizComplete, scoreQuiz } from '../utils/quizEngine.ts';
import { STYLES } from '../data/homeestetData.ts';

/** Answer sets that should lead to each of the 8 styles. */
const REACHABLE: Record<string, Record<string, string>> = {
  'warm-minimalism': { colors: 'beige', priority: 'minimalism', materials: 'wood', visual: 'warm-minimalism', decor: 'minimum', budget: '1000-3000' },
  scandinavian: { colors: 'white', priority: 'function', materials: 'wood', visual: 'scandinavian', decor: 'moderate', budget: 'under-1000' },
  japandi: { colors: 'earth', priority: 'minimalism', materials: 'ceramic', visual: 'japandi', decor: 'minimum', budget: '1000-3000' },
  natural: { colors: 'earth', priority: 'coziness', materials: 'textile', visual: 'natural', decor: 'moderate', budget: 'under-1000' },
  modern: { colors: 'dark', priority: 'order', materials: 'metal', visual: 'modern', decor: 'minimum', budget: '3000-5000' },
  cozy: { colors: 'pastel', priority: 'coziness', materials: 'textile', visual: 'cozy', decor: 'rich', budget: 'under-1000' },
  classic: { colors: 'pastel', priority: 'aesthetics', materials: 'stone', visual: 'classic', decor: 'rich', budget: '5000-10000' },
  contemporary: { colors: 'accent', priority: 'aesthetics', materials: 'ceramic', visual: 'contemporary', decor: 'moderate', budget: '3000-5000' },
};

describe('scoreQuiz', () => {
  it('has a test answer set for every style', () => {
    expect(Object.keys(REACHABLE).sort()).toEqual(STYLES.map((s) => s.id).sort());
  });

  for (const [styleId, answers] of Object.entries(REACHABLE)) {
    it(`style "${styleId}" is reachable`, () => {
      expect(isQuizComplete(answers)).toBe(true);
      expect(scoreQuiz(answers).primaryStyleId).toBe(styleId);
    });
  }

  it('does not depend on the visual question alone', () => {
    const scandi = REACHABLE.scandinavian;
    for (const style of STYLES) {
      const result = scoreQuiz({ ...scandi, visual: style.id });
      expect(result.primaryStyleId).toBe('scandinavian');
    }
  });

  it('uses every question: changing an early answer can change the winner', () => {
    const base = { ...REACHABLE.cozy, visual: 'natural' };
    const withTextile = scoreQuiz(base);
    const withMetal = scoreQuiz({ ...base, materials: 'metal', colors: 'dark', priority: 'order', decor: 'minimum' });
    expect(withTextile.primaryStyleId).not.toBe(withMetal.primaryStyleId);
  });

  it('offers a secondary style when scores are close', () => {
    // japandi 10 vs warm-minimalism 9: close enough to suggest both.
    const result = scoreQuiz({ colors: 'beige', priority: 'minimalism', materials: 'wood', visual: 'japandi', decor: 'minimum', budget: '1000-3000' });
    expect(result.primaryStyleId).toBe('japandi');
    expect(result.secondaryStyleId).toBe('warm-minimalism');

    // A clear winner gets no secondary style.
    const clear = scoreQuiz(REACHABLE.modern);
    expect(clear.primaryStyleId).toBe('modern');
    expect(clear.secondaryStyleId).toBeUndefined();
  });

  it('every option only references known styles', () => {
    const known = new Set(STYLES.map((s) => s.id));
    for (const question of QUIZ_QUESTIONS) {
      for (const option of question.options) {
        for (const styleId of Object.keys(option.weights)) expect(known.has(styleId)).toBe(true);
      }
    }
  });
});
