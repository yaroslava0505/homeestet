import type { AnalyzeParams, AnalyzeResponse } from '../types.ts';

/** Longest side the photo is downscaled to before upload: enough detail for the model, fewer image tokens. */
const MAX_SIDE = 1024;
const JPEG_QUALITY = 0.82;
/** Thumbnail kept with a saved analysis (localStorage), so keep it tiny. */
const THUMB_SIDE = 320;

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const MAX_FILE_BYTES = 12 * 1024 * 1024;

export interface PreparedImage {
  /** Base64 JPEG without the data: prefix, ready for the API. */
  data: string;
  mediaType: 'image/jpeg';
  /** Data URL for on-screen preview. */
  previewUrl: string;
  /** Small data URL for the saved list. */
  thumbnail: string;
  width: number;
  height: number;
}

export class AnalyzeError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AnalyzeError('decode', 'Не вдалося відкрити це зображення. Спробуйте JPEG або PNG.'));
    };
    img.src = url;
  });
}

function drawScaled(img: HTMLImageElement, maxSide: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new AnalyzeError('canvas', 'Браузер не підтримує обробку зображень.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Validates, downsizes and re-encodes the chosen file as JPEG. Everything happens in the browser. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const typeOk = ACCEPTED_TYPES.includes(file.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
  if (!typeOk) throw new AnalyzeError('type', 'Підтримуються JPG, PNG, WebP або HEIC.');
  if (file.size > MAX_FILE_BYTES) throw new AnalyzeError('size', 'Файл завеликий: максимум 12 МБ.');

  const img = await loadImage(file);
  const main = drawScaled(img, MAX_SIDE);
  const previewUrl = main.toDataURL('image/jpeg', JPEG_QUALITY);
  const thumbnail = drawScaled(img, THUMB_SIDE).toDataURL('image/jpeg', 0.7);

  return {
    data: previewUrl.slice(previewUrl.indexOf(',') + 1),
    mediaType: 'image/jpeg',
    previewUrl,
    thumbnail,
    width: main.width,
    height: main.height,
  };
}

/** Calls the Pages Function. Throws AnalyzeError with the server's code on failure. */
export async function requestAnalysis(image: PreparedImage, params: AnalyzeParams): Promise<AnalyzeResponse> {
  let response: Response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        image: { data: image.data, mediaType: image.mediaType },
        budgetId: params.budgetId,
        rental: params.rental,
        note: params.note,
      }),
    });
  } catch {
    throw new AnalyzeError('network', 'Немає з’єднання. Перевірте інтернет і спробуйте ще раз.');
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON error page (e.g. 404 from a host without the function).
  }

  if (!response.ok) {
    const err = (payload ?? {}) as { error?: string; message?: string };
    const code = err.error ?? (response.status === 404 ? 'not_configured' : 'upstream');
    const message =
      err.message ??
      (response.status === 404
        ? 'Аналіз фото ще не підключено на цьому сервері.'
        : `Сервіс аналізу відповів помилкою ${response.status}.`);
    throw new AnalyzeError(code, message);
  }

  return payload as AnalyzeResponse;
}
