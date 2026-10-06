import { useState } from 'react';
import { SMALL_SPACES_DATA } from '../data/homeestetData.ts';
import type { PageView, ProductItem } from '../types.ts';
import { AppImage } from '../components/AppImage.tsx';
import { ProductMiniCard } from '../components/ProductMiniCard.tsx';
import { formatUAH } from '../utils/format.ts';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface SmallSpacesPageProps {
  onNavigate: (view: PageView) => void;
  onOpenProduct: (product: ProductItem) => void;
}

const SUBCATEGORIES = [
  { id: 'all', label: 'Всі площі' },
  { id: '20 м²', label: '20 м²' },
  { id: 'маленька кухня', label: 'Маленька кухня' },
  { id: 'маленька спальня', label: 'Маленька спальня' },
  { id: 'маленьке робоче місце', label: 'Робочий куточок' },
];

const ZONE_FOR_SUBCATEGORY: Record<string, string> = {
  '20 м²': 'sofa',
  'маленька кухня': 'kitchen',
  'маленька спальня': 'bedroom',
  'маленьке робоче місце': 'workspace',
};

export function SmallSpacesPage({ onNavigate, onOpenProduct }: SmallSpacesPageProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  const filteredSolutions =
    selectedSubcategory === 'all' ? SMALL_SPACES_DATA : SMALL_SPACES_DATA.filter((s) => s.subcategory === selectedSubcategory);

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-2">Розумна ергономіка</span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#2C2C2C] font-normal tracking-tight">🏠 Маленький дім: простір, повітря та порядок</h1>
          <p className="text-stone-600 text-sm sm:text-base mt-2 leading-relaxed">
            Як перетворити смарт-квартиру 20–40 м² чи компактну кімнату на візуально просторий, естетичний простір без капітального перепланування.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-6" role="group" aria-label="Фільтр за площею">
            {SUBCATEGORIES.map((sub) => (
              <button
                type="button"
                key={sub.id}
                onClick={() => setSelectedSubcategory(sub.id)}
                aria-pressed={selectedSubcategory === sub.id}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedSubcategory === sub.id
                    ? 'bg-[#2C2C2C] text-white shadow-2xs font-semibold'
                    : 'bg-white text-stone-700 hover:bg-stone-200/60 border border-stone-200'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          {filteredSolutions.map((item) => (
            <article key={item.id} className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 border border-stone-200/90 shadow-2xs space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#967259] font-semibold block">{item.areaLabel}</span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal mt-0.5">{item.title}</h2>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs text-stone-500 block">Бюджет трансформації:</span>
                  <span className="font-serif text-xl font-bold text-stone-900 tabular-nums">{formatUAH(item.budget)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 bg-red-50/60 rounded-xl border border-red-200/60 text-stone-800">
                  <span className="flex items-center gap-1.5 font-semibold text-red-800 text-xs uppercase tracking-wider mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
                    Типова проблема:
                  </span>
                  <p className="leading-relaxed text-stone-700">{item.problem}</p>
                </div>
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/60 text-stone-800">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-800 text-xs uppercase tracking-wider mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    Рішення HomeEstet:
                  </span>
                  <p className="leading-relaxed text-stone-700">{item.solution}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                <div className="lg:col-span-2 rounded-xl overflow-hidden aspect-[16/10] bg-stone-100 border border-stone-200">
                  <AppImage image={item.image} alt={item.title} sizes="(min-width: 1024px) 66vw, 100vw" className="w-full h-full object-cover object-center" />
                </div>

                <div className="bg-[#FAF8F5] p-5 rounded-xl border border-stone-200 space-y-4">
                  <span className="text-xs uppercase tracking-wider text-emerald-800 font-semibold block">♻️ Альтернатива без покупки (0 ₴)</span>
                  <p className="text-xs text-stone-600 leading-relaxed">{item.freeAlternative}</p>

                  <div className="pt-3 border-t border-stone-200">
                    <span className="text-[11px] font-semibold text-stone-800 block mb-1">Золоте правило простору:</span>
                    <p className="text-xs italic text-stone-600">«{item.keyTakeaway}»</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'zone-builder', zoneId: ZONE_FOR_SUBCATEGORY[item.subcategory] })}
                    className="w-full py-2.5 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Зробити мою маленьку зону</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-3">Рекомендовані товари для вирішення:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {item.products.map((product) => (
                    <ProductMiniCard key={product.id} product={product} onOpen={onOpenProduct} className="bg-[#FAF8F5]" />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
