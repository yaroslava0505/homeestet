import { useEffect, useId, useRef, useState } from 'react';
import type { AnalyzeParams, PageView, PhotoPlan, PlanEntry, ProductItem, SavedPhotoPlan } from '../types.ts';
import { BUDGET_TIERS, STYLES, ZONES, findProduct } from '../data/homeestetData.ts';
import { AnalyzeError, prepareImage, requestAnalysis, type PreparedImage } from '../lib/analyzeClient.ts';
import { consumeAnalysisQuota, getAnalysisQuota, type AnalysisQuota } from '../lib/storage.ts';
import { formatUAH, formatUAHRange, hashString } from '../utils/format.ts';
import { ProductMiniCard } from '../components/ProductMiniCard.tsx';
import {
  Camera,
  UploadCloud,
  Sparkles,
  AlertTriangle,
  Check,
  ArrowRight,
  Bookmark,
  Calendar,
  RotateCcw,
  Trash2,
  MinusCircle,
  Move,
  Recycle,
  Info,
} from 'lucide-react';

interface AnalyzePageProps {
  /** When set, shows a saved analysis from localStorage instead of the upload form. */
  planId?: string;
  savedPlans: SavedPhotoPlan[];
  onSavePlan: (item: SavedPhotoPlan) => void;
  onRemovePlan: (id: string) => void;
  onAddToPlan: (entry: PlanEntry) => void;
  isInPlan: (entryId: string) => boolean;
  onNavigate: (view: PageView) => void;
  onOpenProduct: (product: ProductItem) => void;
}

type Stage = 'form' | 'loading' | 'result';

const LOADING_STEPS = [
  'Дивимося на фото…',
  'Визначаємо зону, стиль і палітру…',
  'Шукаємо, що заважає спокою…',
  'Складаємо 5 кроків і підбираємо речі в бюджет…',
];

function planEntryId(id: string): string {
  return `plan-photo-${id}`;
}

/** "5 кроків", "3 кроки", "1 крок" */
function stepsHeading(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word = mod10 === 1 && mod100 !== 11 ? 'крок' : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? 'кроки' : 'кроків';
  return `${count} ${word} для цього кута`;
}

export function AnalyzePage({
  planId,
  savedPlans,
  onSavePlan,
  onRemovePlan,
  onAddToPlan,
  isInPlan,
  onNavigate,
  onOpenProduct,
}: AnalyzePageProps) {
  const saved = planId ? savedPlans.find((p) => p.id === planId) : undefined;

  const [image, setImage] = useState<PreparedImage | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [budgetId, setBudgetId] = useState(BUDGET_TIERS[1].id);
  const [rental, setRental] = useState(false);
  const [note, setNote] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [plan, setPlan] = useState<PhotoPlan | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [quota, setQuota] = useState<AnalysisQuota>(() => getAnalysisQuota());
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const noteId = useId();

  useEffect(() => {
    if (stage !== 'loading') return;
    setLoadingStep(0);
    const timer = window.setInterval(() => setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 6000);
    return () => window.clearInterval(timer);
  }, [stage]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPreparing(true);
    try {
      setImage(await prepareImage(file));
    } catch (e) {
      setImage(null);
      setError(
        e instanceof AnalyzeError ? { code: e.code, message: e.message } : { code: 'decode', message: 'Не вдалося обробити файл.' }
      );
    } finally {
      setPreparing(false);
    }
  };

  const runAnalysis = async () => {
    if (!image) return;
    if (getAnalysisQuota().remaining <= 0) {
      setQuota(getAnalysisQuota());
      setError({ code: 'daily_limit', message: `На сьогодні ${quota.limit} аналізи використано. Повертайся завтра або відкрий збережені плани.` });
      return;
    }
    const params: AnalyzeParams = { budgetId, rental, note: note.trim() || undefined };
    setError(null);
    setStage('loading');
    try {
      const response = await requestAnalysis(image, params);
      const id = `${Date.now().toString(36)}-${hashString(image.data.slice(0, 4000))}`;
      setQuota(consumeAnalysisQuota());
      setPlan(response.plan);
      setResultId(id);
      setStage('result');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (e) {
      setStage('form');
      setError(
        e instanceof AnalyzeError ? { code: e.code, message: e.message } : { code: 'unknown', message: 'Щось пішло не так. Спробуйте ще раз.' }
      );
    }
  };

  const reset = () => {
    setImage(null);
    setPlan(null);
    setResultId(null);
    setError(null);
    setStage('form');
    if (inputRef.current) inputRef.current.value = '';
    if (planId) onNavigate({ type: 'analyze' });
  };

  // ---- Saved analysis view ----
  if (planId) {
    if (!saved) {
      return (
        <div className="bg-[#FAF8F5] min-h-[60vh] py-16 text-center px-4">
          <h1 className="font-serif text-3xl text-[#2C2C2C]">Аналіз не знайдено</h1>
          <p className="text-sm text-stone-600 mt-2">Збережені аналізи живуть у цьому браузері. Можливо, їх було очищено.</p>
          <button type="button" onClick={reset} className="mt-6 px-5 py-2.5 bg-[#2C2C2C] text-white text-xs font-semibold rounded-lg">
            Новий аналіз
          </button>
        </div>
      );
    }
    return (
      <div className="bg-[#FAF8F5] min-h-[85vh] py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <PlanResult
            plan={saved.plan}
            params={saved.params}
            previewUrl={saved.thumbnail}
            saved
            inPlan={isInPlan(planEntryId(saved.id))}
            onSave={() => undefined}
            onRemove={() => {
              onRemovePlan(saved.id);
              onNavigate({ type: 'my-homeestet' });
            }}
            onAddToPlan={() => onAddToPlan(buildPlanEntry(saved.id, saved.plan))}
            onReset={reset}
            onNavigate={onNavigate}
            onOpenProduct={onOpenProduct}
          />
        </div>
      </div>
    );
  }

  // ---- Result of a fresh analysis ----
  if (stage === 'result' && plan && image && resultId) {
    const params: AnalyzeParams = { budgetId, rental, note: note.trim() || undefined };
    const isSaved = savedPlans.some((p) => p.id === resultId);
    return (
      <div className="bg-[#FAF8F5] min-h-[85vh] py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <PlanResult
            plan={plan}
            params={params}
            previewUrl={image.previewUrl}
            saved={isSaved}
            inPlan={isInPlan(planEntryId(resultId))}
            onSave={() =>
              onSavePlan({ id: resultId, createdAt: new Date().toISOString(), thumbnail: image.thumbnail, params, plan })
            }
            onAddToPlan={() => onAddToPlan(buildPlanEntry(resultId, plan))}
            onReset={reset}
            onNavigate={onNavigate}
            onOpenProduct={onOpenProduct}
          />
        </div>
      </div>
    );
  }

  // ---- Upload form / loading ----
  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-10 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-2">Головний інструмент HomeEstet</span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#2C2C2C] font-normal tracking-tight text-balance">
            Сфотографуй кут, отримай план
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
            Один знімок кімнати. У відповідь: що заважає простору, 5 конкретних кроків і лише ті речі, які варто докупити у твій бюджет.
          </p>
        </div>

        {stage === 'loading' ? (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-8 sm:p-12 text-center space-y-5" role="status" aria-live="polite">
            {image && (
              <img src={image.previewUrl} alt="" className="w-full max-h-72 object-cover rounded-xl opacity-80" />
            )}
            <div className="w-12 h-12 rounded-full border-4 border-[#967259] border-t-transparent animate-spin mx-auto" />
            <div>
              <h2 className="font-serif text-2xl text-stone-900">{LOADING_STEPS[loadingStep]}</h2>
              <p className="text-xs text-stone-500 mt-1">Зазвичай це займає 20–60 секунд. Фото нікуди не зберігається.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 sm:p-8 space-y-6">
            <div>
              <label
                htmlFor={inputId}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  void handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`block border-2 border-dashed rounded-xl text-center cursor-pointer transition-all group overflow-hidden ${
                  dragging ? 'border-[#967259] bg-[#FAF2EB]' : 'border-[#D5CBB9] hover:border-[#967259] bg-[#FAF8F5] hover:bg-white'
                } ${image ? 'p-2' : 'p-8 sm:p-12'}`}
              >
                <input
                  ref={inputRef}
                  id={inputId}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  className="sr-only"
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                />
                {image ? (
                  <span className="block relative">
                    <img src={image.previewUrl} alt="Обране фото кімнати" className="w-full max-h-[420px] object-contain rounded-lg bg-stone-100" />
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-stone-700 shadow-sm">
                      Обрати інше фото
                    </span>
                  </span>
                ) : (
                  <span className="block">
                    {preparing ? (
                      <span className="w-10 h-10 rounded-full border-4 border-[#967259] border-t-transparent animate-spin mx-auto mb-3 block" />
                    ) : (
                      <UploadCloud className="w-12 h-12 text-stone-400 group-hover:text-[#967259] mx-auto mb-3 transition-colors" aria-hidden="true" />
                    )}
                    <span className="font-medium text-base text-stone-800 block">Перетягни фото сюди або натисни, щоб обрати</span>
                    <span className="text-xs text-stone-500 mt-1.5 block">JPG, PNG, WebP або HEIC. Фотографуй при денному світлі, щоб було видно весь кут.</span>
                    <span className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#2C2C2C] text-white text-xs font-semibold rounded-lg">
                      <Camera className="w-4 h-4" aria-hidden="true" />
                      Обрати фото
                    </span>
                  </span>
                )}
              </label>
            </div>

            <fieldset>
              <legend className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">Бюджет на зміни</legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup">
                {BUDGET_TIERS.map((tier) => {
                  const active = budgetId === tier.id;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={active}
                      key={tier.id}
                      onClick={() => setBudgetId(tier.id)}
                      className={`px-3 py-2.5 rounded-lg border text-left text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] ${
                        active ? 'border-[#967259] bg-[#FAF8F5] text-stone-900 font-semibold ring-2 ring-[#967259]/20' : 'border-stone-200 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {tier.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-stone-200 bg-[#FAF8F5] cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#8A9A86]">
                <input type="checkbox" checked={rental} onChange={(e) => setRental(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#967259]" />
                <span className="block">
                  <span className="text-sm font-medium text-stone-900 block">Орендоване житло</span>
                  <span className="text-xs text-stone-500 block">Без свердління, фарбування і заміни меблів власника</span>
                </span>
              </label>
              <div>
                <label htmlFor={noteId} className="text-xs uppercase tracking-wider text-stone-500 font-semibold block mb-1.5">
                  Що найбільше заважає? <span className="normal-case tracking-normal font-normal">(необов’язково)</span>
                </label>
                <textarea
                  id={noteId}
                  value={note}
                  maxLength={300}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Наприклад: немає де працювати, занадто темно ввечері"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#8A9A86]"
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {error.message}
                  {(error.code === 'not_configured' || error.code === 'budget_exhausted' || error.code === 'daily_limit' || error.code === 'ip_limit') && (
                    <span className="block text-xs text-red-700/80 mt-1">
                      Поки що можна отримати рішення вручну: обери зону, стиль і бюджет у майстрі «Зроби цю зону».
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
              <p className="text-[11px] text-stone-500 leading-relaxed max-w-sm">
                Фото стискається в браузері і надсилається моделі лише для цього аналізу. HomeEstet не зберігає знімки.
                <span className="block mt-1 text-stone-600">
                  {quota.remaining > 0
                    ? `Сьогодні доступно ще ${quota.remaining} з ${quota.limit} безкоштовних аналізів.`
                    : `Сьогодні всі ${quota.limit} безкоштовні аналізи використано.`}
                </span>
              </p>
              <button
                type="button"
                onClick={() => void runAnalysis()}
                disabled={!image || preparing || quota.remaining <= 0}
                className="px-6 py-3 bg-[#967259] hover:bg-[#7e5f49] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm shrink-0"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Проаналізувати</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-600">
          <div className="p-4 bg-white/70 rounded-xl border border-stone-200/80">
            <span className="font-semibold text-stone-800 block mb-1">1. Фото</span>
            Один кут або кімната цілком, при денному світлі.
          </div>
          <div className="p-4 bg-white/70 rounded-xl border border-stone-200/80">
            <span className="font-semibold text-stone-800 block mb-1">2. Діагноз</span>
            Зона, стиль, палітра і що саме створює візуальний шум.
          </div>
          <div className="p-4 bg-white/70 rounded-xl border border-stone-200/80">
            <span className="font-semibold text-stone-800 block mb-1">3. План</span>
            5 кроків від безкоштовних до покупок у межах бюджету.
          </div>
        </div>
      </div>
    </div>
  );
}

function buildPlanEntry(id: string, plan: PhotoPlan): PlanEntry {
  const zone = plan.zoneId ? ZONES.find((z) => z.id === plan.zoneId) : undefined;
  return {
    id: planEntryId(id),
    title: `📸 ${plan.zoneLabel}: план за фото`,
    zoneId: zone?.id ?? 'sofa',
    zoneName: zone?.name ?? plan.zoneLabel,
    tasks: plan.steps.map((step, idx) => ({ id: String(idx + 1).padStart(2, '0'), title: step.title, description: step.description })),
    productIds: plan.products.map((p) => p.id),
    budget: plan.estimatedCost,
    status: 'active',
    addedAt: new Date().toISOString(),
  };
}

interface PlanResultProps {
  plan: PhotoPlan;
  params: AnalyzeParams;
  previewUrl: string;
  saved: boolean;
  inPlan: boolean;
  onSave: () => void;
  onRemove?: () => void;
  onAddToPlan: () => void;
  onReset: () => void;
  onNavigate: (view: PageView) => void;
  onOpenProduct: (product: ProductItem) => void;
}

function PlanResult({ plan, params, previewUrl, saved, inPlan, onSave, onRemove, onAddToPlan, onReset, onNavigate, onOpenProduct }: PlanResultProps) {
  const style = STYLES.find((s) => s.id === plan.suggestedStyleId) ?? STYLES[0];
  const budgetTier = BUDGET_TIERS.find((b) => b.id === params.budgetId) ?? BUDGET_TIERS[1];
  const products = plan.products
    .map((item) => ({ item, product: findProduct(item.id) }))
    .filter((x): x is { item: PhotoPlan['products'][number]; product: ProductItem } => Boolean(x.product));
  const noiseTone = plan.noiseLevel >= 60 ? 'bg-red-600/90' : plan.noiseLevel >= 35 ? 'bg-amber-600/90' : 'bg-emerald-600/90';
  const noiseLabel = plan.noiseLevel >= 60 ? 'високий' : plan.noiseLevel >= 35 ? 'середній' : 'низький';

  if (!plan.isInterior) {
    return (
      <div className="space-y-6 animate-in">
        <div className="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#2C2C2C]">На цьому фото не видно кімнати</h1>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">{plan.summary}</p>
            </div>
          </div>
          <img src={previewUrl} alt="" className="w-full max-h-64 object-cover rounded-xl opacity-70" />
          <button type="button" onClick={onReset} className="px-5 py-2.5 bg-[#2C2C2C] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Спробувати інше фото
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#ECE8E1]">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#967259] font-semibold mb-1">
            <Camera className="w-3.5 h-3.5" aria-hidden="true" />
            <span>План за фото</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2C2C] font-normal leading-tight">{plan.zoneLabel}</h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600 mt-2">
            <span>
              <strong>Бюджет:</strong> {budgetTier.label}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong>Житло:</strong> {params.rental ? 'оренда, без свердління' : 'власне'}
            </span>
            {plan.confidence !== 'high' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-800">{plan.confidence === 'low' ? 'на фото видно мало, висновки обережні' : 'частину деталей видно нечітко'}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onRemove ? (
            <button type="button" onClick={onRemove} className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border bg-white text-stone-700 border-stone-300 hover:text-red-600 hover:border-red-300">
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Видалити</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSave}
              aria-pressed={saved}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                saved ? 'bg-[#967259] text-white border-[#967259]' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
              <span>{saved ? 'Збережено ✓' : 'Зберегти'}</span>
            </button>
          )}
          <button type="button" onClick={onReset} className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border bg-white text-stone-700 border-stone-300 hover:bg-stone-50">
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Новий аналіз</span>
          </button>
        </div>
      </div>

      {/* Photo with badges */}
      <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm">
        <img src={previewUrl} alt="Проаналізоване фото" className="w-full max-h-[520px] object-cover object-center" />
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1 rounded-md">
          Визначено: {plan.zoneLabel}
        </div>
        <div className={`absolute bottom-3 right-3 ${noiseTone} text-white text-[11px] font-semibold px-2.5 py-1 rounded-md`}>
          Візуальний шум: {plan.noiseLevel}% ({noiseLabel})
        </div>
      </div>

      <p className="font-serif text-lg sm:text-xl text-stone-800 leading-relaxed border-l-2 border-[#967259] pl-4">{plan.summary}</p>

      {/* Facts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-white rounded-xl border border-stone-200">
          <span className="text-[10px] uppercase tracking-wider text-stone-500 block mb-1">Зараз</span>
          <span className="font-semibold text-stone-900">{plan.currentStyle || 'Без вираженого стилю'}</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-stone-200">
          <span className="text-[10px] uppercase tracking-wider text-stone-500 block mb-1">Потенціал</span>
          <span className="font-semibold text-emerald-800">{style.name}</span>
          <span className="text-stone-500 block">{style.uaName}</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-stone-200">
          <span className="text-[10px] uppercase tracking-wider text-stone-500 block mb-1.5">Палітра на фото</span>
          <span className="flex items-center gap-1.5" aria-label={`Кольори: ${plan.palette.join(', ')}`}>
            {plan.palette.map((hex) => (
              <span key={hex} className="w-6 h-6 rounded-full border border-stone-200 shadow-2xs" style={{ backgroundColor: hex }} title={hex} />
            ))}
            {plan.palette.length === 0 && <span className="text-stone-500">не визначено</span>}
          </span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-stone-200">
          <span className="text-[10px] uppercase tracking-wider text-stone-500 block mb-1">Матеріали</span>
          <span className="text-stone-800">{plan.materials.join(', ') || 'не визначено'}</span>
        </div>
      </div>

      {/* Problems */}
      {plan.problems.length > 0 && (
        <section className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-[#967259] font-semibold">Що заважає простору</h2>
          {plan.noiseComment && <p className="text-xs text-stone-500">{plan.noiseComment}</p>}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-stone-700">
            {plan.problems.map((item, idx) => (
              <li key={item} className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FAF8F5] border border-stone-200/80">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">{idx + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Steps */}
      <section className="bg-white p-5 sm:p-8 rounded-2xl border border-stone-200 space-y-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Покроковий план</span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2C2C2C]">{stepsHeading(plan.steps.length)}</h2>
        </div>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plan.steps.map((step, idx) => (
            <li key={step.title} className="p-4 bg-[#FAF8F5] rounded-xl border border-stone-200/80">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-mono font-bold text-[#967259] tracking-wider">0{idx + 1}</span>
                <span className="text-[10px] text-stone-500 font-medium text-right">{step.impact}</span>
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900 mb-1 leading-snug">{step.title}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Remove / rearrange / use owned */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionList icon={<MinusCircle className="w-4 h-4 text-red-600" aria-hidden="true" />} title="Прибрати" items={plan.remove} />
        <ActionList icon={<Move className="w-4 h-4 text-[#967259]" aria-hidden="true" />} title="Переставити" items={plan.rearrange} />
        <ActionList icon={<Recycle className="w-4 h-4 text-emerald-700" aria-hidden="true" />} title="Використати з наявного" items={plan.useOwned} />
      </div>

      {/* Products */}
      <section className="bg-white p-5 sm:p-8 rounded-2xl border border-stone-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Розумний шопінг</span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2C2C2C]">{products.length > 0 ? 'Що варто докупити' : 'Купувати нічого не треба'}</h2>
          </div>
          <div className="text-left sm:text-right text-xs text-stone-600">
            <span className="block">Орієнтовно на весь план: <strong>{plan.budgetMax > 0 ? formatUAHRange(plan.budgetMin, plan.budgetMax) : '0 ₴'}</strong></span>
            <span className="block">Ліміт: {formatUAH(plan.budgetLimit)}</span>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="space-y-3">
            {products.map(({ item, product }) => (
              <div key={product.id} className="p-3 rounded-xl border border-stone-200/80 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center gap-3">
                <ProductMiniCard product={product} onOpen={onOpenProduct} className="sm:w-80 shrink-0" />
                <p className="text-xs text-stone-700 leading-relaxed sm:pl-2">
                  <strong className="text-stone-900">Чому:</strong> {item.reason}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-sm">
              <span className="text-stone-600">Разом за покупки</span>
              <span className="font-serif text-xl font-bold text-stone-900 tabular-nums">{formatUAH(plan.estimatedCost)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-600 flex items-start gap-2">
            <Check className="w-4 h-4 text-[#8A9A86] shrink-0 mt-0.5" aria-hidden="true" />
            Усе, що потрібно для цього кута, у тебе вже є. План вище повністю безкоштовний.
          </p>
        )}
      </section>

      {/* Actions */}
      <div className="p-5 sm:p-6 bg-[#FAF2EB] rounded-2xl border border-[#E6D4C2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-medium text-stone-900">Перенести ці кроки в мій план на 30 днів?</h3>
          <p className="text-xs text-stone-600 mt-0.5">Кроки стануть чек-листом із прогресом, усе зберігається у цьому браузері.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={inPlan ? () => onNavigate({ type: 'personal-plan' }) : onAddToPlan}
            className={`px-5 py-2.5 text-white text-xs font-semibold rounded-lg flex items-center gap-2 ${inPlan ? 'bg-[#8A9A86] hover:bg-[#75856F]' : 'bg-[#967259] hover:bg-[#7e5f49]'}`}
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>{inPlan ? 'Додано до плану ✓ · Відкрити' : 'Додати до плану'}</span>
          </button>
          {plan.zoneId && (
            <button
              type="button"
              onClick={() => onNavigate({ type: 'zone-builder', zoneId: plan.zoneId ?? undefined, prefilledStyle: plan.suggestedStyleId })}
              className="px-4 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <span>Майстер для цієї зони</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-stone-500 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
        План складено за одним фото і може не враховувати те, чого на ньому не видно. Ціни в каталозі орієнтовні.
      </p>
    </div>
  );
}

function ActionList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200">
      <h2 className="text-xs uppercase tracking-wider text-stone-700 font-semibold flex items-center gap-2 mb-3">
        {icon}
        {title}
      </h2>
      <ul className="space-y-2 text-sm text-stone-700">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-[#8A9A86] shrink-0 mt-0.5" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
