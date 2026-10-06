const uah = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });

/** 1850 → "1 850 ₴" */
export function formatUAH(amount: number): string {
  return `${uah.format(Math.round(amount))} ₴`;
}

/** "1 200 – 2 400 ₴" */
export function formatUAHRange(from: number, to: number): string {
  return `${uah.format(Math.round(from))} – ${uah.format(Math.round(to))} ₴`;
}

export type ShareStatus = 'idle' | 'shared' | 'copied' | 'cancelled' | 'failed';

/** Last-resort copy for browsers where the async clipboard API is unavailable. */
function legacyCopy(text: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

/**
 * Share with the Web Share API when the browser supports it, otherwise copy the URL to the clipboard.
 * Returns what actually happened so the UI can show honest feedback (and the URL for manual copying).
 */
export async function shareOrCopy(data: { title: string; text?: string; url: string }): Promise<{ status: ShareStatus; url: string }> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;

  if (nav && typeof nav.share === 'function' && (typeof nav.canShare !== 'function' || nav.canShare(data))) {
    try {
      await nav.share(data);
      return { status: 'shared', url: data.url };
    } catch (error) {
      // The user closed the share sheet: not an error worth reporting.
      if (error instanceof DOMException && error.name === 'AbortError') return { status: 'cancelled', url: data.url };
      // Any other failure (no user gesture, unsupported data): fall back to copying.
    }
  }

  try {
    await nav?.clipboard?.writeText(data.url);
    if (nav?.clipboard) return { status: 'copied', url: data.url };
  } catch {
    // Clipboard blocked (insecure context, document not focused): try the legacy path.
  }

  if (legacyCopy(data.url)) return { status: 'copied', url: data.url };
  return { status: 'failed', url: data.url };
}

/** Short deterministic hash for ids built from parameters. */
export function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
