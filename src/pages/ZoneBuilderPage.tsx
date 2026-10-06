import { useMemo, useState } from 'react';
import { ZONES, STYLES, MOODS, BUDGET_TIERS } from '../data/homeestetData.ts';
import { generateZoneSolution } from '../utils/solutionEngine.ts';
import type { ZoneSolution, ProductItem, PageView, SolutionParams, PlanEntry } from '../types.ts';
import { absoluteUrl } from '../lib/router.ts';
import { formatUAH, shareOrCopy, type ShareStatus } from '../utils/format.ts';
import { AppImage } from '../components/AppImage.tsx';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  Bookmark,
  Share2,
  Calendar,
  AlertTriangle,
  Info,
  SlidersHorizontal,
} from 'lucide-react';

interface ZoneBuilderPageProps {
  zoneId?: string;
  prefilledStyle?: string;
  /** When present the page shows the generated solution instead of the wizard. */
  params?: SolutionParams;
  onNavigate: (view: PageView) => void;
  onSaveSolution: (solution: ZoneSolution) => void;
  isSolutionSaved: (id: string) => boolean;
  onAddToPlan: (entry: PlanEntry) => void;
  isInPlan: (entryId: string) => boolean;
  onOpenProduct: (product: ProductItem) => void;
}

const STEP_LABELS = ['Простір', 'Стиль', 'Настрій', 'Бюджет', 'Що вже є'];

type PriceMode = 'standard' | 'budget' | 'free';

const PRICE_MODES: { id: PriceMode; label: string; activeClass: string }[] = [
  { id: 'standard', label: '✨ Оптимальний', activeClass: 'text-stone-900' },
  { id: 'budget', label: '💰 Дешевше', activeClass: 'text-stone-900' },
  { id: 'free', label: '♻️ Без покупки (0 ₴)', activeClass: 'text-emerald-900' },
];

function planEntryId(solution: ZoneSolution): string {
  return `plan-${solution.id}`;
}

export function ZoneBuilderPage({
  zoneId,
  prefilledStyle,
  params,
  onNavigate,
  onSaveSolution,
  isSolutionSaved,
  onAddToPlan,
  isInPlan,
  onOpenProduct,
}: ZoneBuilderPageProps) {
  const initialZone = ZONES.find((z) => z.id === (params?.zoneId ?? zoneId)) ?? ZONES[0];
  const initialStyle = STYLES.find((s) => s.id === (params?.styleId ?? prefilledStyle)) ?? STYLES[0];

  const [currentStep, setCurrentStep] = useState<number>(zoneId ? 1 : 0);
  const [selectedZoneId, setSelectedZoneId] = useState(initialZone.id);
  const [selectedStyleId, setSelectedStyleId] = useState(initialStyle.id);
  const [selectedMoodId, setSelectedMoodId] = useState(params?.moodId ?? MOODS[0].id);
  const [selectedBudgetId, setSelectedBudgetId] = useState(params?.budgetId ?? BUDGET_TIERS[1].id);
  const [existingItems, setExistingItems] = useState<string[]>(params?.existingItems ?? initialZone.defaultExistingItems);
  const [priceMode, setPriceMode] = useState<PriceMode>('standard');
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [planFeedback, setPlanFeedback] = useState(false);

  const selectedZone = ZONES.find((z) => z.id === selectedZoneId) ?? ZONES[0];
  const solution = useMemo(() => (params ? generateZoneSolution(params) : null), [params]);

  const handleSelectZone = (nextZoneId: string) => {
    const zone = ZONES.find((z) => z.id === nextZoneId) ?? ZONES[0];
    setSelectedZoneId(zone.id);
    setExistingItems(zone.defaultExistingItems);
    setCurrentStep(1);
    onNavigate({ type: 'zone-builder', zoneId: zone.id });
  };

  const handleToggleExistingItem = (item: string) => {
    setExistingItems((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const handleFinishWizard = () => {
    onNavigate({
      type: 'zone-builder',
      zoneId: selectedZoneId,
      params: {
        zoneId: selectedZoneId,
        styleId: selectedStyleId,
        moodId: selectedMoodId,
        budgetId: selectedBudgetId,
        existingItems,
      },
    });
  };

  /** Leave the result and reopen the wizard at a given step, keeping all choices. */
  const editFromResult = (step: number) => {
    setCurrentStep(step);
    onNavigate({ type: 'zone-builder', zoneId: selectedZoneId });
  };

  const handleReset = () => onNavigate({ type: 'zone-builder' });

  const handleShare = async (sol: ZoneSolution) => {
    const { status, url } = await shareOrCopy({
      title: `HomeEstet: ${sol.zoneName} у стилі ${sol.styleName}`,
      text: sol.tagline,
      url: absoluteUrl({ type: 'zone-builder', zoneId: sol.zoneId, params: sol.params }),
    });
    setShareStatus(status);
    // When nothing could be copied automatically, show the link so it can be copied by hand.
    setShareUrl(status === 'failed' ? url : null);
    if (status !== 'failed') window.setTimeout(() => setShareStatus('idle'), 2500);
  };

  const handleAddToPlan = (sol: ZoneSolution) => {
    onAddToPlan({
      id: planEntryId(sol),
      title: `${sol.zoneIcon} ${sol.zoneName}: ${sol.styleName}`,
      zoneId: sol.zoneId,
      zoneName: sol.zoneName,
      tasks: sol.steps.map((step) => ({ id: step.number, title: step.title, description: step.description })),
      productIds: sol.products.map((p) => p.id),
      budget: sol.estimatedCost,
      status: 'active',
      addedAt: new Date().toISOString(),
      params: sol.params,
    });
    setPlanFeedback(true);
    window.setTimeout(() => setPlanFeedback(false), 3000);
  };

  const nextButton = (label: string, step: number) => (
    <button
      type="button"
      onClick={() => setCurrentStep(step)}
      className="px-6 py-2.5 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
    >
      {label} <ArrowRight className="w-4 h-4" aria-hidden="true" />
    </button>
  );

  const backButton = (step: number) => (
    <button
      type="button"
      onClick={() => setCurrentStep(step)}
      className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-black flex items-center gap-1"
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Назад
    </button>
  );

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {!solution && (
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold mb-2 block">Головна функція HomeEstet</span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2C2C] font-normal tracking-tight">✨ Зроби цю зону</h1>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              Обери простір, який хочеш змінити, і отримай готове рішення під свій стиль та бюджет без зайвих покупок.
            </p>

            <ol className="flex items-center justify-center gap-1.5 mt-6" aria-label="Кроки майстра">
              {STEP_LABELS.map((stepLabel, idx) => (
                <li key={stepLabel} className="flex items-center gap-1.5" aria-current={idx === currentStep ? 'step' : undefined}>
                  <span className="sr-only">{stepLabel}</span>
                  <span
                    aria-hidden="true"
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStep ? 'w-8 bg-[#967259]' : idx < currentStep ? 'w-5 bg-[#8A9A86]' : 'w-4 bg-stone-200'
                    }`}
                  />
                  {idx < STEP_LABELS.length - 1 && (
                    <span className="text-[10px] text-stone-300" aria-hidden="true">
                      ·
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <div className="text-[11px] text-stone-600 mt-2 font-medium">
              Крок {currentStep + 1} з {STEP_LABELS.length}: {STEP_LABELS[currentStep]}
            </div>
          </div>
        )}

        {/* STEP 0: zone */}
        {!solution && currentStep === 0 && (
          <div className="space-y-6 animate-in">
            <h2 className="font-serif text-2xl text-[#2C2C2C] text-center font-normal">Який куточок дому ви хочете оновити?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {ZONES.map((zone) => {
                const isSelected = selectedZoneId === zone.id;
                return (
                  <button
                    type="button"
                    key={zone.id}
                    onClick={() => handleSelectZone(zone.id)}
                    aria-pressed={isSelected}
                    className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between aspect-[4/3] group relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] ${
                      isSelected
                        ? 'border-[#967259] bg-white ring-2 ring-[#967259]/20 shadow-sm'
                        : 'border-[#ECE8E1] bg-white hover:border-stone-400 hover:shadow-2xs'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl block mb-2" aria-hidden="true">
                      {zone.icon}
                    </span>
                    <span className="block">
                      <span className="font-medium text-sm sm:text-base text-stone-900 group-hover:text-[#967259] transition-colors block">
                        {zone.name}
                      </span>
                      <span className="text-[11px] text-stone-600 line-clamp-1 mt-0.5 block">{zone.tagline}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 1: style */}
        {!solution && currentStep === 1 && (
          <div className="space-y-6 animate-in">
            <div className="text-center">
              <h2 className="font-serif text-2xl text-[#2C2C2C] font-normal">Крок 1. Оберіть стиль інтер’єру</h2>
              <p className="text-xs text-stone-600 mt-1">
                Для зони: <strong>{selectedZone.name}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="radiogroup" aria-label="Стиль інтер’єру">
              {STYLES.map((style) => {
                const isSelected = selectedStyleId === style.id;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    key={style.id}
                    onClick={() => setSelectedStyleId(style.id)}
                    className={`rounded-xl border overflow-hidden text-left transition-all flex flex-col group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] ${
                      isSelected ? 'border-[#967259] bg-white ring-2 ring-[#967259]/30 shadow-md' : 'border-[#ECE8E1] bg-white hover:border-stone-400'
                    }`}
                  >
                    <span className="h-28 overflow-hidden bg-stone-100 relative block">
                      <AppImage
                        image={style.image}
                        alt=""
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#967259] text-white flex items-center justify-center text-xs shadow-xs">
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                      )}
                    </span>

                    <span className="p-3.5 flex flex-col flex-1">
                      <span className="font-serif text-base font-medium text-stone-900 block">{style.name}</span>
                      <span className="text-[11px] text-[#967259] font-medium mb-1 block">{style.uaName}</span>
                      <span className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed mb-3 flex-1 block">{style.description}</span>
                      <span className="flex items-center gap-1.5 pt-2 border-t border-stone-100" aria-hidden="true">
                        {style.colors.map((c) => (
                          <span key={c} className="w-3 h-3 rounded-full border border-stone-200" style={{ backgroundColor: c }} />
                        ))}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              {backButton(0)}
              {nextButton('Далі: Настрій', 2)}
            </div>
          </div>
        )}

        {/* STEP 2: mood */}
        {!solution && currentStep === 2 && (
          <div className="space-y-6 max-w-2xl mx-auto animate-in">
            <div className="text-center">
              <h2 className="font-serif text-2xl text-[#2C2C2C] font-normal">Крок 2. Оберіть бажаний настрій простору</h2>
              <p className="text-xs text-stone-600 mt-1">Яке відчуття має дарувати цей куточок щодня?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Настрій простору">
              {MOODS.map((mood) => {
                const isSelected = selectedMoodId === mood.id;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    key={mood.id}
                    onClick={() => setSelectedMoodId(mood.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] ${
                      isSelected ? 'border-[#967259] bg-white ring-2 ring-[#967259]/20 shadow-xs' : 'border-[#ECE8E1] bg-white hover:border-stone-400'
                    }`}
                  >
                    <span className="text-2xl shrink-0" aria-hidden="true">
                      {mood.icon}
                    </span>
                    <span className="flex-1 min-w-0 block">
                      <span className="font-medium text-sm text-stone-900 block">{mood.label}</span>
                      <span className="text-xs text-stone-600 leading-tight block">{mood.desc}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-[#967259] shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              {backButton(1)}
              {nextButton('Далі: Бюджет', 3)}
            </div>
          </div>
        )}

        {/* STEP 3: budget */}
        {!solution && currentStep === 3 && (
          <div className="space-y-6 max-w-2xl mx-auto animate-in">
            <div className="text-center">
              <h2 className="font-serif text-2xl text-[#2C2C2C] font-normal">Крок 3. Оберіть комфортний бюджет</h2>
              <p className="text-xs text-stone-600 mt-1">Жодна рекомендована покупка не вийде за цю суму.</p>
            </div>

            <div className="space-y-2.5" role="radiogroup" aria-label="Бюджет">
              {BUDGET_TIERS.map((tier) => {
                const isSelected = selectedBudgetId === tier.id;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    key={tier.id}
                    onClick={() => setSelectedBudgetId(tier.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] ${
                      isSelected ? 'border-[#967259] bg-white ring-2 ring-[#967259]/20 shadow-xs' : 'border-[#ECE8E1] bg-white hover:border-stone-400'
                    }`}
                  >
                    <span className="block">
                      <span className="font-semibold text-sm sm:text-base text-stone-900 block">{tier.label}</span>
                      <span className="text-xs text-stone-600 block mt-0.5">{tier.desc}</span>
                    </span>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[#967259] text-white flex items-center justify-center text-xs shrink-0">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              {backButton(2)}
              {nextButton('Далі: Що вже є?', 4)}
            </div>
          </div>
        )}

        {/* STEP 4: existing items */}
        {!solution && currentStep === 4 && (
          <div className="space-y-6 max-w-2xl mx-auto animate-in">
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-[#8A9A86] font-semibold mb-1 block">Філософія HomeEstet</span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#2C2C2C] font-normal">Крок 4. Що у вас вже є в цій зоні?</h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-md mx-auto">
                Відмітьте предмети, які вже стоять удома. <strong>HomeEstet не пропонуватиме купувати те, що у вас вже є.</strong>
              </p>
            </div>

            <fieldset className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <legend className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 px-1">
                Предмети для зони «{selectedZone.name}»:
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedZone.commonExistingItems.map((item) => {
                  const isChecked = existingItems.includes(item);
                  return (
                    <label
                      key={item}
                      className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer select-none transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#8A9A86] ${
                        isChecked
                          ? 'bg-[#FAF8F5] border-[#967259]/60 text-stone-900 font-medium'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleExistingItem(item)}
                        className="w-4 h-4 rounded border-stone-300 accent-[#967259]"
                      />
                      <span className="capitalize text-xs sm:text-sm">{item}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="p-3.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Відмічено: {existingItems.length}. Ми спочатку використаємо ваш наявний потенціал, а запропонуємо лише точкові речі, які дійсно змінять простір і вкладуться в бюджет.
              </span>
            </div>

            <div className="flex items-center justify-between pt-4">
              {backButton(3)}
              <button
                type="button"
                onClick={handleFinishWizard}
                className="px-8 py-3 bg-[#967259] hover:bg-[#7e5f49] text-white text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-all hover:scale-102"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Отримати готове рішення</span>
              </button>
            </div>
          </div>
        )}

        {/* RESULT */}
        {solution && (
          <ResultView
            solution={solution}
            priceMode={priceMode}
            onPriceMode={setPriceMode}
            saved={isSolutionSaved(solution.id)}
            inPlan={isInPlan(planEntryId(solution))}
            planFeedback={planFeedback}
            shareStatus={shareStatus}
            shareUrl={shareUrl}
            onSave={() => onSaveSolution(solution)}
            onShare={() => handleShare(solution)}
            onAddToPlan={() => handleAddToPlan(solution)}
            onEdit={editFromResult}
            onReset={handleReset}
            onOpenProduct={onOpenProduct}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
}

interface ResultViewProps {
  solution: ZoneSolution;
  priceMode: PriceMode;
  onPriceMode: (mode: PriceMode) => void;
  saved: boolean;
  inPlan: boolean;
  planFeedback: boolean;
  shareStatus: ShareStatus;
  shareUrl: string | null;
  onSave: () => void;
  onShare: () => void;
  onAddToPlan: () => void;
  onEdit: (step: number) => void;
  onReset: () => void;
  onOpenProduct: (product: ProductItem) => void;
  onNavigate: (view: PageView) => void;
}

function ResultView({
  solution,
  priceMode,
  onPriceMode,
  saved,
  inPlan,
  planFeedback,
  shareStatus,
  shareUrl,
  onSave,
  onShare,
  onAddToPlan,
  onEdit,
  onReset,
  onOpenProduct,
  onNavigate,
}: ResultViewProps) {
  const hasProducts = solution.products.length > 0;
  const shareLabel =
    shareStatus === 'copied'
      ? 'Посилання скопійовано ✓'
      : shareStatus === 'shared'
        ? 'Надіслано ✓'
        : shareStatus === 'failed'
          ? 'Скопіюйте посилання нижче'
          : 'Поділитися';

  return (
    <div className="space-y-10 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#ECE8E1]">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#967259] font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Персональне готове рішення HomeEstet</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2C2C] font-normal leading-tight">
            {solution.zoneIcon} {solution.zoneName}
          </h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600 mt-2 font-sans">
            <span>
              <strong>Стиль:</strong> {solution.styleName}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong>Настрій:</strong> {solution.moodName}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong>Бюджет:</strong> {solution.budgetName}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong>Вже є:</strong> {solution.existingItems.join(', ') || 'з нуля'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSave}
            aria-pressed={saved}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              saved ? 'bg-[#967259] text-white border-[#967259]' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
            <span>{saved ? 'Збережено ✓' : 'Зберегти'}</span>
          </button>

          <button
            type="button"
            onClick={onShare}
            className="px-3 py-2 bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 rounded-lg text-xs flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{shareLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(4)}
            className="px-3 py-2 bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 rounded-lg text-xs flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Змінити параметри</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="p-2 bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 rounded-lg text-xs"
            title="Створити нову зону"
            aria-label="Створити нову зону"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {shareUrl && (
        <div className="p-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-600 space-y-1.5" role="status">
          <span className="block">Автоматично скопіювати не вдалося. Посилання на це рішення:</span>
          <input
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.currentTarget.select()}
            aria-label="Посилання на рішення"
            className="w-full px-3 py-2 bg-[#FAF8F5] border border-stone-200 rounded-lg text-stone-800 font-mono text-[11px]"
          />
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] bg-stone-100 border border-stone-200 shadow-sm">
        <AppImage
          image={solution.conceptImage}
          alt={`Візуальний концепт: ${solution.zoneName}`}
          priority
          sizes="(min-width: 1024px) 960px, 100vw"
          className="w-full h-full object-cover object-center absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
          <span className="text-xs uppercase tracking-widest text-amber-200/90 font-medium mb-1">Візуальний концепт</span>
          <p className="font-serif text-xl sm:text-2xl font-light max-w-2xl leading-snug">{solution.tagline}</p>
        </div>
      </div>

      {/* Budget and filter status */}
      {!hasProducts && (
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-amber-200 space-y-4" aria-live="polite">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-serif text-2xl text-[#2C2C2C] font-normal">
                Ми не знайшли рішення, яке одночасно відповідає всім параметрам.
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                {solution.skippedOwned.length > 0
                  ? `У вас уже є все, що ми зазвичай радимо для цієї зони (${solution.skippedOwned.map((p) => p.category.toLowerCase()).filter((v, i, a) => a.indexOf(v) === i).join(', ')}). `
                  : ''}
                Спробуйте змінити один із параметрів або скористайтеся варіантом без покупок нижче.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onEdit(3)} className="px-4 py-2 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs font-semibold rounded-lg">
              Збільшити бюджет
            </button>
            <button type="button" onClick={() => onEdit(1)} className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-lg">
              Змінити стиль
            </button>
            <button type="button" onClick={() => onEdit(4)} className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-lg">
              Прибрати один із наявних предметів
            </button>
            <a href="#free-tips" className="px-4 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold rounded-lg">
              Варіант без покупок
            </a>
          </div>
        </section>
      )}

      {hasProducts && solution.isPartial && (
        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-900 flex items-start gap-3" role="status">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-2">
            <p>
              <strong>У бюджеті «{solution.budgetName}» повністю змінити зону не вийде</strong>, але ось що можна зробити зараз за{' '}
              <strong>{formatUAH(solution.estimatedCost)}</strong>. Усі рекомендації нижче вкладаються в ліміт {formatUAH(solution.budgetLimit)}.
            </p>
            {solution.overBudget.length > 0 && (
              <p className="text-amber-800/90">
                Не вмістилися в бюджет:{' '}
                {solution.overBudget
                  .slice(0, 3)
                  .map((p) => `${p.name} (${formatUAH(p.price)})`)
                  .join(', ')}
                .
              </p>
            )}
            <button type="button" onClick={() => onEdit(3)} className="underline font-semibold hover:text-amber-950">
              Збільшити бюджет
            </button>
          </div>
        </div>
      )}

      {(solution.relaxedStyle || solution.skippedOwned.length > 0) && hasProducts && (
        <div className="space-y-2 text-xs text-stone-600">
          {solution.relaxedStyle && (
            <p className="flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-stone-500" aria-hidden="true" />
              <span>
                Для стилю «{solution.styleName}» у каталозі поки мало товарів для цієї зони, тому ми додали універсальні речі, які поєднуються з ним.
              </span>
            </p>
          )}
          {solution.skippedOwned.length > 0 && (
            <p className="flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#8A9A86]" aria-hidden="true" />
              <span>
                Не пропонуємо купувати, бо у вас уже є схоже: {solution.skippedOwned.map((p) => p.name.toLowerCase()).join('; ')}.
              </span>
            </p>
          )}
        </div>
      )}

      {/* Steps */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/90 space-y-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Покроковий алгоритм дій</span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2C2C2C] font-normal">Що саме потрібно змінити</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {solution.steps.map((step) => (
            <div key={step.number} className="p-4 bg-[#FAF8F5] rounded-xl border border-stone-200/80">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-mono font-bold text-[#967259] tracking-wider">{step.number}</span>
                <span className="text-[10px] text-stone-500 font-medium">{step.impact}</span>
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900 mb-1 leading-snug">{step.title}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      {hasProducts && (
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Розумний шопінг без зайвого</span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#2C2C2C] font-normal">Що купити (з урахуванням наявного)</h2>
              <p className="text-xs text-stone-600 mt-1">Ми не пропонуємо речі, які ви вже відмітили як наявні.</p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs font-medium self-start sm:self-auto" role="tablist" aria-label="Варіант ціни">
              {PRICE_MODES.map((mode) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={priceMode === mode.id}
                  key={mode.id}
                  onClick={() => onPriceMode(mode.id)}
                  className={`px-3 py-1.5 rounded transition-all ${
                    priceMode === mode.id ? `bg-white shadow-2xs font-semibold ${mode.activeClass}` : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {solution.products.map((prod) => (
              <div
                key={prod.id}
                className="p-4 rounded-xl border border-stone-200/80 hover:border-stone-400 bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <AppImage
                    image={prod.image}
                    alt=""
                    sizes="64px"
                    className="w-16 h-16 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-0.5">
                      <span>{prod.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#967259]">{prod.merchant}</span>
                    </div>
                    <h3 className="font-serif text-base font-medium text-stone-900 leading-snug">{prod.name}</h3>
                    {prod.reason && (
                      <p className="text-xs text-stone-600 mt-0.5">
                        <strong>Чому:</strong> {prod.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                  {priceMode === 'standard' && (
                    <div className="text-right">
                      {prod.oldPrice && prod.oldPrice > prod.price && (
                        <span className="text-xs text-stone-400 line-through tabular-nums block">{formatUAH(prod.oldPrice)}</span>
                      )}
                      <span className="font-semibold text-base text-stone-900 tabular-nums">{formatUAH(prod.price)}</span>
                    </div>
                  )}

                  {priceMode === 'budget' && (
                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 block">Бюджетна версія:</span>
                      <span className="font-semibold text-base text-stone-900 tabular-nums">
                        {formatUAH(prod.budgetAlternativePrice ?? Math.round(prod.price * 0.5))}
                      </span>
                      {prod.budgetAlternativeName && (
                        <span className="text-[10px] text-stone-500 block max-w-[180px]">{prod.budgetAlternativeName}</span>
                      )}
                    </div>
                  )}

                  {priceMode === 'free' && (
                    <div className="text-left md:text-right max-w-sm">
                      <span className="text-[11px] font-semibold text-emerald-800 block">♻️ Порада без витрат:</span>
                      <p className="text-xs text-stone-600 leading-snug">
                        {prod.freeAlternativeTip ?? 'Використайте схожий предмет іншого призначення з шафи.'}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenProduct(prod)}
                    className="px-3.5 py-1.5 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
                  >
                    Детальніше
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-[#FAF8F5] rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-stone-500 uppercase tracking-wider block font-medium">Загальний бюджет цього оновлення:</span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1">
                <span className="font-serif text-2xl font-bold text-stone-900 tabular-nums">{formatUAH(solution.estimatedCost)}</span>
                <span className="text-xs font-medium text-[#8A9A86]">з ліміту {formatUAH(solution.budgetLimit)}</span>
                {solution.cheaperCost < solution.estimatedCost && (
                  <span className="text-xs font-medium text-stone-500">· бюджетна версія: {formatUAH(solution.cheaperCost)}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1">
              <button
                type="button"
                onClick={inPlan ? () => onNavigate({ type: 'personal-plan' }) : onAddToPlan}
                className={`px-5 py-2.5 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  inPlan ? 'bg-[#8A9A86] hover:bg-[#75856F]' : 'bg-[#967259] hover:bg-[#7e5f49]'
                }`}
              >
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>{inPlan ? 'Додано до плану ✓ · Відкрити план' : 'Перенести в План на 30 днів'}</span>
              </button>
              {planFeedback && (
                <span className="text-xs text-emerald-800" role="status">
                  Додано до плану ✓
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Free tips */}
      <section id="free-tips" className="bg-emerald-50/60 p-6 sm:p-8 rounded-2xl border border-emerald-200 space-y-4 scroll-mt-24">
        <div>
          <span className="text-xs uppercase tracking-widest text-emerald-800 font-semibold block mb-1">Варіант без покупок</span>
          <h2 className="font-serif text-2xl text-[#2C2C2C] font-normal">Що можна зробити за 0 ₴ вже сьогодні</h2>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-stone-700">
          {solution.freeTips.map((tip, idx) => (
            <li key={tip} className="flex items-start gap-2.5 bg-white/80 p-3 rounded-lg border border-emerald-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        {!hasProducts && (
          <button
            type="button"
            onClick={onAddToPlan}
            className="px-5 py-2.5 bg-[#967259] hover:bg-[#7e5f49] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>{inPlan ? 'Додано до плану ✓' : 'Додати кроки в План на 30 днів'}</span>
          </button>
        )}
      </section>
    </div>
  );
}
