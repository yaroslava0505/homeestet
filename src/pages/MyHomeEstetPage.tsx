import { STYLES, PLAN_TASKS, findProduct } from '../data/homeestetData.ts';
import type { PageView, PlanState, ProductItem, QuizResult, SavedItem, SavedPhotoPlan } from '../types.ts';
import { AppImage } from '../components/AppImage.tsx';
import { ProductMiniCard } from '../components/ProductMiniCard.tsx';
import { formatUAH } from '../utils/format.ts';
import { User, Bookmark, ArrowRight, Trash2, Calendar, Palette, Lightbulb, Camera } from 'lucide-react';

interface MyHomeEstetPageProps {
  styleId?: string;
  quizResult: QuizResult | null;
  savedItems: SavedItem[];
  onRemoveSaved: (id: string) => void;
  savedProductIds: string[];
  onToggleSavedProduct: (productId: string) => void;
  photoPlans: SavedPhotoPlan[];
  onRemovePhotoPlan: (id: string) => void;
  plan: PlanState;
  onNavigate: (view: PageView) => void;
  onOpenProduct: (product: ProductItem) => void;
}

export function MyHomeEstetPage({
  styleId,
  quizResult,
  savedItems,
  onRemoveSaved,
  savedProductIds,
  onToggleSavedProduct,
  photoPlans,
  onRemovePhotoPlan,
  plan,
  onNavigate,
  onOpenProduct,
}: MyHomeEstetPageProps) {
  const currentStyle = styleId ? STYLES.find((s) => s.id === styleId) : undefined;
  const secondaryStyle = quizResult?.secondaryStyleId ? STYLES.find((s) => s.id === quizResult.secondaryStyleId) : undefined;
  const savedSolutions = savedItems.filter((item) => item.kind === 'solution');
  const savedIdeas = savedItems.filter((item) => item.kind === 'idea');
  const savedProducts = savedProductIds.map(findProduct).filter((p): p is ProductItem => Boolean(p));

  const totalTasks = PLAN_TASKS.length + plan.entries.reduce((sum, entry) => sum + entry.tasks.length, 0);
  const completedTasks = plan.completedTaskIds.length;

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="border-b border-stone-200 pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#967259] font-semibold mb-1">
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Особистий простір</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2C2C] font-normal">Мій HomeEstet</h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Ваш стиль, збережені рішення та ідеї, товари і прогрес плану. Усе зберігається у цьому браузері.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate({ type: 'zone-builder' })}
              className="px-4 py-2.5 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <span>+ Створити нову зону</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate({ type: 'style-quiz' })}
              className="px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-medium rounded-lg"
            >
              Пройти тест стилю
            </button>
          </div>
        </div>

        {/* Style */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          {currentStyle ? (
            <>
              <div className="flex items-center gap-5">
                <AppImage image={currentStyle.image} alt="" sizes="96px" className="w-24 h-24 rounded-xl object-cover shrink-0 border border-stone-200" />
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#967259] font-semibold block">Визначений стиль інтер’єру</span>
                  <h2 className="font-serif text-2xl font-medium text-stone-900 mt-0.5">
                    {currentStyle.name} ({currentStyle.uaName})
                  </h2>
                  <p className="text-xs text-stone-600 max-w-md mt-1 leading-relaxed">{currentStyle.description}</p>
                  {secondaryStyle && (
                    <p className="text-xs text-stone-500 mt-1">
                      Також вам може підійти: <strong>{secondaryStyle.name}</strong>
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate({ type: 'style-quiz' })}
                className="px-4 py-2 border border-stone-300 hover:border-stone-500 rounded-lg text-xs font-medium text-stone-700 transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Palette className="w-3.5 h-3.5 text-[#967259]" aria-hidden="true" />
                <span>Змінити стиль</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#FAF2EB] flex items-center justify-center shrink-0">
                  <Palette className="w-6 h-6 text-[#967259]" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-medium text-stone-900">Стиль ще не визначено</h2>
                  <p className="text-xs text-stone-600 max-w-md mt-1">
                    Пройдіть тест із 6 питань, і майстер «Зроби цю зону» підставлятиме ваш стиль автоматично.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate({ type: 'style-quiz' })}
                className="px-4 py-2.5 bg-[#967259] hover:bg-[#7e5f49] text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5"
              >
                <span>Пройти тест стилю</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </>
          )}
        </section>

        {/* Photo analyses */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-stone-900 font-normal">Аналізи за фото ({photoPlans.length})</h2>
            <button
              type="button"
              onClick={() => onNavigate({ type: 'analyze' })}
              className="text-xs font-semibold text-[#967259] hover:text-[#7e5f49] flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Новий аналіз</span>
            </button>
          </div>

          {photoPlans.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center space-y-3">
              <Camera className="w-10 h-10 text-stone-300 mx-auto" aria-hidden="true" />
              <h3 className="font-serif text-lg text-stone-800">Ще немає жодного аналізу</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Сфотографуй кут кімнати, і HomeEstet складе план: що прибрати, що переставити і що докупити в бюджет.
              </p>
              <button
                type="button"
                onClick={() => onNavigate({ type: 'analyze' })}
                className="px-5 py-2.5 bg-[#2C2C2C] text-white text-xs font-semibold rounded-lg hover:bg-[#444] transition-colors inline-flex items-center gap-1.5"
              >
                <span>📸 Сфотографувати кут</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photoPlans.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-4 border border-stone-200 hover:border-stone-400 transition-all flex gap-4">
                  <img src={item.thumbnail} alt="" className="w-24 h-24 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200" />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-[#967259] font-medium block">
                        {item.plan.zoneLabel} · шум {item.plan.noiseLevel}%
                      </span>
                      <p className="text-sm text-stone-800 line-clamp-2 mt-0.5">{item.plan.summary}</p>
                      <span className="text-xs text-stone-500 block mt-1">
                        Покупки: <strong>{formatUAH(item.plan.estimatedCost)}</strong> · {new Date(item.createdAt).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-100 text-xs">
                      <button
                        type="button"
                        onClick={() => onNavigate({ type: 'analyze', planId: item.id })}
                        className="font-semibold text-stone-900 hover:text-[#967259] flex items-center gap-1"
                      >
                        <span>Відкрити план</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemovePhotoPlan(item.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                        title="Видалити аналіз"
                        aria-label="Видалити аналіз"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Saved solutions */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-stone-900 font-normal">Мої збережені рішення ({savedSolutions.length})</h2>

          {savedSolutions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center space-y-3">
              <Bookmark className="w-10 h-10 text-stone-300 mx-auto" aria-hidden="true" />
              <h3 className="font-serif text-lg text-stone-800">У вас поки немає збережених зон</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Скористайтеся головною функцією «Зроби цю зону», оберіть бюджет та збережіть результат для свого дому.
              </p>
              <button
                type="button"
                onClick={() => onNavigate({ type: 'zone-builder' })}
                className="px-5 py-2.5 bg-[#967259] text-white text-xs font-semibold rounded-lg hover:bg-[#7e5f49] transition-colors inline-flex items-center gap-1.5"
              >
                <span>✨ Створити першу зону</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedSolutions.map((sol) => (
                <div key={sol.id} className="bg-white rounded-xl p-5 border border-stone-200 hover:border-stone-400 transition-all flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs text-[#967259] font-medium block">
                        {sol.zoneName} · {sol.styleName}
                      </span>
                      <h3 className="font-serif text-xl font-medium text-stone-900 mt-0.5">{sol.title}</h3>
                      <span className="text-xs text-stone-500 block mt-1">
                        Бюджет: <strong>{formatUAH(sol.estimatedCost)}</strong> ({sol.budgetName}) · {new Date(sol.savedAt).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveSaved(sol.id)}
                      className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                      title="Видалити зі збережених"
                      aria-label="Видалити зі збережених"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                    <span className="text-stone-500 font-light truncate pr-2">Вже є: {sol.params.existingItems.join(', ') || 'з нуля'}</span>
                    <button
                      type="button"
                      onClick={() => onNavigate({ type: 'zone-builder', zoneId: sol.zoneId, params: sol.params })}
                      className="font-semibold text-stone-900 hover:text-[#967259] flex items-center gap-1 shrink-0"
                    >
                      <span>Відкрити</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Saved ideas */}
        {savedIdeas.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-stone-900 font-normal">Збережені ідеї ({savedIdeas.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedIdeas.map((idea) => (
                <div key={idea.id} className="bg-white rounded-xl p-5 border border-stone-200 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-[#967259] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-stone-500 block">
                      {idea.zoneHint} · {idea.estimatedBudget}
                    </span>
                    <h3 className="font-serif text-lg font-medium text-stone-900 mt-0.5">{idea.title}</h3>
                    <button
                      type="button"
                      onClick={() => onNavigate({ type: 'zone-builder', zoneId: idea.zoneId })}
                      className="text-xs font-semibold text-stone-900 hover:text-[#967259] inline-flex items-center gap-1 mt-2"
                    >
                      <span>Спробувати у своїй зоні</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveSaved(idea.id)}
                    className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                    title="Видалити ідею"
                    aria-label="Видалити ідею"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Saved products */}
        {savedProducts.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-stone-900 font-normal">Збережені товари ({savedProducts.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedProducts.map((product) => (
                <div key={product.id} className="flex items-stretch gap-2">
                  <ProductMiniCard product={product} onOpen={onOpenProduct} className="flex-1" />
                  <button
                    type="button"
                    onClick={() => onToggleSavedProduct(product.id)}
                    className="px-2 text-stone-400 hover:text-red-500 border border-stone-200 rounded-lg bg-white transition-colors"
                    title="Прибрати зі збережених"
                    aria-label="Прибрати зі збережених"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Plan */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/90 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#8A9A86] font-semibold block">Прогрес плану оновлення</span>
            <h3 className="font-serif text-2xl text-stone-900 font-medium">30-денний чек-лист оновлення простору</h3>
            <p className="text-xs text-stone-600">
              Виконано кроків: <strong>{completedTasks}</strong> з {totalTasks}
              {plan.entries.length > 0 ? ` (у плані ${plan.entries.length} ваших рішень)` : ''}. Кожен крок робить ваш дім затишнішим.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ type: 'personal-plan' })}
            className="px-5 py-2.5 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs font-semibold rounded-lg flex items-center gap-2 shrink-0"
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>Відкрити мій план</span>
          </button>
        </section>
      </div>
    </div>
  );
}
