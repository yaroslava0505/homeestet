import { useCallback, useEffect, useState } from 'react';
import type { PageView, SolutionParams } from '../types.ts';

/**
 * Minimal history-based router.
 *
 *  /                          home
 *  /analyze                   photo analysis ("Фото → план"); /analyze/:planId opens a saved analysis
 *  /zones                     zone wizard, step "choose zone"
 *  /zones/:zoneId             zone wizard for a zone (optional ?style=)
 *  /zones/:zoneId/result?…    generated solution (style, mood, budget, have)
 *  /style                     style quiz
 *  /small-spaces, /rented, /plan, /lifehacks, /lifehacks/:articleId (alias /inspiration), /saved
 */

export function viewToPath(view: PageView): string {
  switch (view.type) {
    case 'home':
      return '/';
    case 'analyze':
      return view.planId ? `/analyze/${encodeURIComponent(view.planId)}` : '/analyze';
    case 'zone-builder': {
      if (!view.zoneId) return '/zones';
      const base = `/zones/${encodeURIComponent(view.zoneId)}`;
      if (view.params) {
        const q = new URLSearchParams({
          style: view.params.styleId,
          mood: view.params.moodId,
          budget: view.params.budgetId,
        });
        if (view.params.existingItems.length > 0) {
          q.set('have', view.params.existingItems.join(','));
        }
        return `${base}/result?${q.toString()}`;
      }
      if (view.prefilledStyle) return `${base}?style=${encodeURIComponent(view.prefilledStyle)}`;
      return base;
    }
    case 'style-quiz':
      return '/style';
    case 'small-spaces':
      return '/small-spaces';
    case 'rented-home':
      return '/rented';
    case 'personal-plan':
      return '/plan';
    case 'inspiration':
      return view.articleId ? `/lifehacks/${encodeURIComponent(view.articleId)}` : '/lifehacks';
    case 'my-homeestet':
      return '/saved';
  }
}

export function pathToView(pathname: string, search: string): PageView {
  const parts = pathname
    .replace(/\/+$/, '')
    .split('/')
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    });
  const query = new URLSearchParams(search);
  const [root, second, third] = parts;

  if (!root) return { type: 'home' };

  switch (root) {
    case 'analyze':
      return { type: 'analyze', planId: second };
    case 'zones': {
      if (!second) return { type: 'zone-builder' };
      if (third === 'result') {
        const params: SolutionParams = {
          zoneId: second,
          styleId: query.get('style') || 'warm-minimalism',
          moodId: query.get('mood') || 'calm',
          budgetId: query.get('budget') || '1000-3000',
          existingItems: (query.get('have') || '').split(',').filter(Boolean),
        };
        return { type: 'zone-builder', zoneId: second, params };
      }
      return { type: 'zone-builder', zoneId: second, prefilledStyle: query.get('style') || undefined };
    }
    case 'style':
      return { type: 'style-quiz' };
    case 'small-spaces':
      return { type: 'small-spaces' };
    case 'rented':
      return { type: 'rented-home' };
    case 'plan':
      return { type: 'personal-plan' };
    case 'lifehacks':
    case 'inspiration': // old address, kept so shared links keep working
      return { type: 'inspiration', articleId: second };
    case 'saved':
      return { type: 'my-homeestet' };
    default:
      return { type: 'home' };
  }
}

function currentLocation(): string {
  return window.location.pathname + window.location.search;
}

/** Returns the current view and a navigate function that also updates the URL. */
export function useRouter(): [PageView, (view: PageView, options?: { replace?: boolean }) => void] {
  const [view, setView] = useState<PageView>(() =>
    pathToView(window.location.pathname, window.location.search)
  );

  useEffect(() => {
    const onPopState = () => setView(pathToView(window.location.pathname, window.location.search));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((next: PageView, options?: { replace?: boolean }) => {
    const path = viewToPath(next);
    if (path !== currentLocation()) {
      if (options?.replace) window.history.replaceState(null, '', path);
      else window.history.pushState(null, '', path);
    }
    setView(next);
  }, []);

  return [view, navigate];
}

/** Absolute URL for a view, for sharing. */
export function absoluteUrl(view: PageView): string {
  return `${window.location.origin}${viewToPath(view)}`;
}
