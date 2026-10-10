import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { AnalyzeParams, AnalyzeResponse } from '../../src/types.ts';
import { PRODUCTS_CATALOG } from '../../src/data/products.ts';
import { BUDGET_TIERS } from '../../src/data/homeestetData.ts';
import {
  DEFAULT_ANALYSIS_MODEL,
  DEFAULT_WORKERS_AI_MODEL,
  MOCK_MODEL_PLAN,
  ModelPlanSchema,
  type ModelPlan,
  buildOpenModelGuide,
  buildSystemPrompt,
  buildUserPrompt,
  extractJsonObject,
  modelPlanJsonSchema,
  modelRequestOptions,
  normalizePlan,
} from '../../src/lib/photoPlan.ts';

/**
 * POST /api/analyze
 * Body: { image: { data: <base64>, mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }, budgetId, rental, note? }
 * Reply: AnalyzeResponse, or { error: <code>, message } with a matching HTTP status.
 *
 * Two model providers, chosen automatically unless ANALYSIS_PROVIDER pins one:
 *  - "anthropic": Claude via the Anthropic SDK when ANTHROPIC_API_KEY is set (best quality, paid per request).
 *  - "workers-ai": Cloudflare Workers AI through the AI binding (free daily allocation, simpler answers).
 *
 * Cost control, in layers:
 *  1. The spend limit in the Anthropic console (or the Workers AI free allocation) is the hard ceiling.
 *  2. With a KV namespace bound as ANALYSIS_KV this function caps analyses per day, globally and per IP.
 *  3. The client additionally limits each browser to a few analyses per day.
 *
 * The photo is forwarded to the model for this one request and is not stored anywhere by HomeEstet.
 */

interface WorkersAi {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

interface Env {
  ANTHROPIC_API_KEY?: string;
  /** "anthropic" | "workers-ai"; when unset the function picks what is configured. */
  ANALYSIS_PROVIDER?: string;
  /** Anthropic model id; defaults to the cheapest capable model (see DEFAULT_ANALYSIS_MODEL). */
  ANALYSIS_MODEL?: string;
  /** Workers AI model id; defaults to DEFAULT_WORKERS_AI_MODEL. */
  WORKERS_AI_MODEL?: string;
  /** Workers AI binding ([ai] in wrangler.toml). */
  AI?: WorkersAi;
  /** "1" returns a canned plan without calling any model (local development only). */
  ANALYSIS_MOCK?: string;
  /** Optional KV binding; when present, daily quotas below are enforced. */
  ANALYSIS_KV?: KVNamespace;
  /** Analyses per day for the whole site (default 100). */
  ANALYSIS_DAILY_LIMIT?: string;
  /** Analyses per day from one IP address (default 5). */
  ANALYSIS_IP_DAILY_LIMIT?: string;
}

type Provider = 'anthropic' | 'workers-ai';

const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type MediaType = (typeof MEDIA_TYPES)[number];
/** ~3 MB of base64 ≈ 2.2 MB image; the client resizes to 1024px so real requests are far smaller. */
const MAX_BASE64_LENGTH = 3_000_000;
const MAX_NOTE_LENGTH = 300;
const DEFAULT_DAILY_LIMIT = 100;
const DEFAULT_IP_DAILY_LIMIT = 5;

const SYSTEM_PROMPT = buildSystemPrompt(PRODUCTS_CATALOG);
const OPEN_MODEL_SYSTEM_PROMPT = `${SYSTEM_PROMPT}\n\n${buildOpenModelGuide()}`;
const JSON_SCHEMA = modelPlanJsonSchema();

interface AnalyzeBody {
  image: { data: string; mediaType: MediaType };
  budgetId: string;
  rental: boolean;
  note?: string;
}

interface ModelResult {
  raw: ModelPlan;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

class AnalysisFailure extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
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

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function resolveProvider(env: Env): Provider | null {
  const pinned = env.ANALYSIS_PROVIDER?.trim().toLowerCase();
  if (pinned === 'anthropic') return env.ANTHROPIC_API_KEY ? 'anthropic' : null;
  if (pinned === 'workers-ai') return env.AI ? 'workers-ai' : null;
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  if (env.AI) return 'workers-ai';
  return null;
}

// ---- Quotas (optional KV) ----

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

interface Quota {
  globalKey: string;
  ipKey: string;
  globalUsed: number;
  ipUsed: number;
}

async function readQuota(env: Env, request: Request): Promise<Quota | null> {
  const kv = env.ANALYSIS_KV;
  if (!kv) return null;
  const day = new Date().toISOString().slice(0, 10);
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const globalKey = `quota:global:${day}`;
  const ipKey = `quota:ip:${(await sha256(ip)).slice(0, 32)}:${day}`;
  const [globalRaw, ipRaw] = await Promise.all([kv.get(globalKey), kv.get(ipKey)]);
  return { globalKey, ipKey, globalUsed: Number(globalRaw) || 0, ipUsed: Number(ipRaw) || 0 };
}

async function consumeQuota(env: Env, quota: Quota): Promise<void> {
  const kv = env.ANALYSIS_KV;
  if (!kv) return;
  const ttl = 2 * 24 * 60 * 60;
  await Promise.all([
    kv.put(quota.globalKey, String(quota.globalUsed + 1), { expirationTtl: ttl }),
    kv.put(quota.ipKey, String(quota.ipUsed + 1), { expirationTtl: ttl }),
  ]);
}

// ---- Provider: Anthropic (Claude) ----

async function runAnthropic(env: Env, body: AnalyzeBody, params: AnalyzeParams): Promise<ModelResult> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 90_000 });
  const model = env.ANALYSIS_MODEL || DEFAULT_ANALYSIS_MODEL;
  const options = modelRequestOptions(model);

  try {
    const response = await client.beta.messages.parse({
      model,
      max_tokens: options.maxTokens,
      ...(options.fallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      output_config: {
        format: zodOutputFormat(ModelPlanSchema),
        ...(options.effort ? { effort: options.effort } : {}),
      },
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
      throw new AnalysisFailure(422, 'refused', 'Модель не змогла проаналізувати це фото. Спробуйте інший знімок кімнати.');
    }
    if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
      throw new AnalysisFailure(502, 'bad_model_output', 'Не вдалося отримати структурований план. Спробуйте ще раз.');
    }
    return {
      raw: response.parsed_output,
      model: response.model,
      usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
    };
  } catch (error) {
    if (error instanceof AnalysisFailure) throw error;
    if (error instanceof Anthropic.RateLimitError) {
      throw new AnalysisFailure(429, 'rate_limited', 'Забагато запитів одночасно. Зачекайте хвилину і спробуйте знову.');
    }
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AnalysisFailure(503, 'not_configured', 'Ключ доступу до моделі недійсний.');
    }
    if (error instanceof Anthropic.BadRequestError) {
      throw new AnalysisFailure(400, 'bad_request', 'Модель не прийняла зображення. Спробуйте інше фото у форматі JPEG.');
    }
    if (error instanceof Anthropic.APIError) {
      // 402/403 from the provider usually means the monthly spend limit or balance is exhausted.
      const exhausted = error.status === 402 || error.status === 403;
      throw new AnalysisFailure(
        503,
        exhausted ? 'budget_exhausted' : 'upstream',
        exhausted
          ? 'Аналіз фото тимчасово недоступний: вичерпано місячний ліміт сервісу.'
          : `Сервіс аналізу тимчасово недоступний (${error.status ?? 'помилка'}).`
      );
    }
    throw error;
  }
}

// ---- Provider: Cloudflare Workers AI ----

const WORKERS_AI_JSON_REMINDER =
  'Відповідай лише одним JSON-об’єктом за схемою, без пояснень і без тексту до чи після нього.';

function workersAiText(result: unknown): unknown {
  if (!result || typeof result !== 'object') return null;
  const value = (result as { response?: unknown }).response;
  const json = typeof value === 'string' ? extractJsonObject(value) : value && typeof value === 'object' ? value : null;
  // Open models sometimes drop list fields they had nothing to say about; an empty list is a valid answer.
  if (json && typeof json === 'object' && !('shopping' in json)) (json as Record<string, unknown>).shopping = [];
  return json;
}

function workersAiUsage(result: unknown): { inputTokens: number; outputTokens: number } {
  const usage = (result as { usage?: { prompt_tokens?: number; completion_tokens?: number } } | null)?.usage;
  return { inputTokens: usage?.prompt_tokens ?? 0, outputTokens: usage?.completion_tokens ?? 0 };
}

async function runWorkersAi(env: Env, body: AnalyzeBody, params: AnalyzeParams): Promise<ModelResult> {
  const ai = env.AI;
  if (!ai) throw new AnalysisFailure(503, 'not_configured', 'Аналіз фото ще не підключено на сервері.');
  const model = env.WORKERS_AI_MODEL || DEFAULT_WORKERS_AI_MODEL;
  const imageUrl = `data:${body.image.mediaType};base64,${body.image.data}`;

  const ask = async (extraInstruction: string) => {
    try {
      return await ai.run(model, {
        messages: [
          { role: 'system', content: `${OPEN_MODEL_SYSTEM_PROMPT}\n\n${WORKERS_AI_JSON_REMINDER}${extraInstruction}` },
          {
            role: 'user',
            content: [
              { type: 'text', text: buildUserPrompt(params) },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        response_format: { type: 'json_schema', json_schema: JSON_SCHEMA },
        max_tokens: 2000,
        temperature: 0.3,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/quota|limit|neurons|exceed/i.test(message)) {
        throw new AnalysisFailure(503, 'budget_exhausted', 'Аналіз фото тимчасово недоступний: вичерпано денний ліміт сервісу.');
      }
      if (/image|unsupported|invalid/i.test(message)) {
        throw new AnalysisFailure(400, 'bad_request', 'Модель не прийняла зображення. Спробуйте інше фото у форматі JPEG.');
      }
      throw new AnalysisFailure(503, 'upstream', 'Сервіс аналізу тимчасово недоступний. Спробуйте ще раз за хвилину.');
    }
  };

  let result = await ask('');
  let parsed = ModelPlanSchema.safeParse(workersAiText(result));
  if (!parsed.success) {
    // One retry with a stricter instruction: open models occasionally wrap or truncate the JSON.
    result = await ask(
      ' Усі поля обов’язкові. steps має містити рівно 5 кроків; problems, remove, rearrange, use_owned не менше 2 пунктів кожен; shopping 2–4 категорії з переліку.'
    );
    parsed = ModelPlanSchema.safeParse(workersAiText(result));
  }
  if (!parsed.success) {
    throw new AnalysisFailure(502, 'bad_model_output', 'Не вдалося отримати структурований план. Спробуйте ще раз.');
  }
  return { raw: parsed.data, model, usage: workersAiUsage(result) };
}

// ---- Handler ----

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return fail(400, 'bad_request', 'Не вдалося прочитати запит.');
  }

  const body = parseBody(parsedBody);
  if (typeof body === 'string') return fail(400, 'bad_request', body);

  const params: AnalyzeParams = { budgetId: body.budgetId, rental: body.rental, note: body.note };

  if (env.ANALYSIS_MOCK === '1') {
    const plan = normalizePlan(MOCK_MODEL_PLAN, params, PRODUCTS_CATALOG);
    const reply: AnalyzeResponse = { plan, model: 'mock', usage: { inputTokens: 0, outputTokens: 0 } };
    return json(reply);
  }

  const provider = resolveProvider(env);
  if (!provider) return fail(503, 'not_configured', 'Аналіз фото ще не підключено на сервері.');

  const quota = await readQuota(env, request);
  if (quota) {
    if (quota.globalUsed >= positiveInt(env.ANALYSIS_DAILY_LIMIT, DEFAULT_DAILY_LIMIT)) {
      return fail(429, 'daily_limit', 'На сьогодні ліміт аналізів на сайті вичерпано. Повертайся завтра.');
    }
    if (quota.ipUsed >= positiveInt(env.ANALYSIS_IP_DAILY_LIMIT, DEFAULT_IP_DAILY_LIMIT)) {
      return fail(429, 'ip_limit', 'З цієї адреси сьогодні вже зроблено максимум аналізів. Спробуй завтра.');
    }
  }

  try {
    const result = provider === 'anthropic' ? await runAnthropic(env, body, params) : await runWorkersAi(env, body, params);
    if (quota) waitUntil(consumeQuota(env, quota));
    const plan = normalizePlan(result.raw, params, PRODUCTS_CATALOG);
    const reply: AnalyzeResponse = { plan, model: result.model, usage: result.usage };
    return json(reply);
  } catch (error) {
    if (error instanceof AnalysisFailure) return fail(error.status, error.code, error.message);
    return fail(500, 'internal', 'Несподівана помилка. Спробуйте ще раз.');
  }
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === 'POST') return new Response(null, { status: 404 });
  return new Response(null, { status: 405, headers: { allow: 'POST' } });
};
