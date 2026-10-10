import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { AnalyzeParams, AnalyzeResponse } from '../../src/types.ts';
import { PRODUCTS_CATALOG } from '../../src/data/products.ts';
import { BUDGET_TIERS } from '../../src/data/homeestetData.ts';
import {
  MOCK_MODEL_PLAN,
  ModelPlanSchema,
  buildSystemPrompt,
  buildUserPrompt,
  normalizePlan,
} from '../../src/lib/photoPlan.ts';

/**
 * POST /api/analyze
 * Body: { image: { data: <base64>, mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }, budgetId, rental, note? }
 * Reply: AnalyzeResponse, or { error: <code>, message } with a matching HTTP status.
 *
 * The API key lives only in Cloudflare (Settings → Variables and secrets → ANTHROPIC_API_KEY).
 * The photo is forwarded to the model for this one request and is not stored anywhere by HomeEstet.
 */

interface Env {
  ANTHROPIC_API_KEY?: string;
  /** Override the model id; defaults to claude-opus-5. */
  ANALYSIS_MODEL?: string;
  /** "1" returns a canned plan without calling the model (local development only). */
  ANALYSIS_MOCK?: string;
}

const DEFAULT_MODEL = 'claude-opus-5';
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type MediaType = (typeof MEDIA_TYPES)[number];
/** ~3 MB of base64 ≈ 2.2 MB image; the client resizes to 1280px so real requests are far smaller. */
const MAX_BASE64_LENGTH = 3_000_000;
const MAX_NOTE_LENGTH = 300;

const SYSTEM_PROMPT = buildSystemPrompt(PRODUCTS_CATALOG);

interface AnalyzeBody {
  image: { data: string; mediaType: MediaType };
  budgetId: string;
  rental: boolean;
  note?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function fail(status: number, error: string, message: string): Response {
  return json({ error, message }, status);
}

function parseBody(input: unknown): AnalyzeBody | string {
  if (!input || typeof input !== 'object') return 'Тіло запиту має бути JSON-об’єктом.';
  const body = input as Record<string, unknown>;
  const image = body.image as Record<string, unknown> | undefined;
  if (!image || typeof image.data !== 'string' || typeof image.mediaType !== 'string') {
    return 'Потрібне поле image з data (base64) і mediaType.';
  }
  if (!MEDIA_TYPES.includes(image.mediaType as MediaType)) return 'Підтримуються лише JPEG, PNG або WebP.';
  if (image.data.length === 0) return 'Порожнє зображення.';
  if (image.data.length > MAX_BASE64_LENGTH) return 'Зображення завелике. Максимум близько 2 МБ.';
  if (!/^[A-Za-z0-9+/=\s]+$/.test(image.data.slice(0, 2000))) return 'Зображення має бути у base64.';

  const budgetId = typeof body.budgetId === 'string' ? body.budgetId : '';
  if (!BUDGET_TIERS.some((b) => b.id === budgetId)) return 'Невідомий бюджет.';

  const note = typeof body.note === 'string' ? body.note.trim().slice(0, MAX_NOTE_LENGTH) : undefined;

  return {
    image: { data: image.data.replace(/\s+/g, ''), mediaType: image.mediaType as MediaType },
    budgetId,
    rental: body.rental === true,
    note: note || undefined,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return fail(400, 'bad_request', 'Не вдалося прочитати запит.');
  }

  const body = parseBody(parsed);
  if (typeof body === 'string') return fail(400, 'bad_request', body);

  const params: AnalyzeParams = { budgetId: body.budgetId, rental: body.rental, note: body.note };

  if (env.ANALYSIS_MOCK === '1') {
    const plan = normalizePlan(MOCK_MODEL_PLAN, params, PRODUCTS_CATALOG);
    const reply: AnalyzeResponse = { plan, model: 'mock', usage: { inputTokens: 0, outputTokens: 0 } };
    return json(reply);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return fail(503, 'not_configured', 'Аналіз фото ще не підключено на сервері.');
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 90_000 });
  const model = env.ANALYSIS_MODEL || DEFAULT_MODEL;

  try {
    const response = await client.beta.messages.parse({
      model,
      max_tokens: 6000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { format: zodOutputFormat(ModelPlanSchema), effort: 'medium' },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: body.image.mediaType, data: body.image.data } },
            { type: 'text', text: buildUserPrompt(params) },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return fail(422, 'refused', 'Модель не змогла проаналізувати це фото. Спробуйте інший знімок кімнати.');
    }
    if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
      return fail(502, 'bad_model_output', 'Не вдалося отримати структурований план. Спробуйте ще раз.');
    }

    const plan = normalizePlan(response.parsed_output, params, PRODUCTS_CATALOG);
    const reply: AnalyzeResponse = {
      plan,
      model: response.model,
      usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
    };
    return json(reply);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return fail(429, 'rate_limited', 'Забагато запитів одночасно. Зачекайте хвилину і спробуйте знову.');
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return fail(503, 'not_configured', 'Ключ доступу до моделі недійсний.');
    }
    if (error instanceof Anthropic.BadRequestError) {
      return fail(400, 'bad_request', 'Модель не прийняла зображення. Спробуйте інше фото у форматі JPEG.');
    }
    if (error instanceof Anthropic.APIError) {
      return fail(502, 'upstream', `Сервіс аналізу тимчасово недоступний (${error.status ?? 'помилка'}).`);
    }
    return fail(500, 'internal', 'Несподівана помилка. Спробуйте ще раз.');
  }
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === 'POST') return new Response(null, { status: 404 });
  return new Response(null, { status: 405, headers: { allow: 'POST' } });
};
