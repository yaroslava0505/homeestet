import { RENTED_HOME_DATA } from '../data/homeestetData.ts';
import type { PageView, ProductItem } from '../types.ts';
import { AppImage } from '../components/AppImage.tsx';
import { ProductMiniCard } from '../components/ProductMiniCard.tsx';
import { formatUAH } from '../utils/format.ts';
import { Truck, Check, ArrowRight, Ban } from 'lucide-react';

interface RentedHomePageProps {
  onNavigate: (view: PageView) => void;
  onOpenProduct: (product: ProductItem) => void;
}

const RESTRICTIONS = ['Не можна свердлити', 'Не можна фарбувати', 'Не можна викидати старі меблі', 'Не можна міняти проводку'];

export function RentedHomePage({ onNavigate, onOpenProduct }: RentedHomePageProps) {
  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-2">Для орендарів</span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#2C2C2C] font-normal tracking-tight">🏡 Красивий дім без ремонту</h1>
          <p className="text-stone-600 text-sm sm:text-base mt-2 leading-relaxed">
            Як перетворити орендовану квартиру на затишний простір, коли діють суворі обмеження орендодавця. Всі рішення можна спакувати за 2 години і забрати із собою при переїзді.
          </p>

          <ul className="flex flex-wrap gap-2 mt-5" aria-label="Типові обмеження">
            {RESTRICTIONS.map((restriction) => (
              <li key={restriction} className="px-3 py-1 bg-white text-stone-700 text-xs font-medium rounded-lg border border-stone-200 flex items-center gap-1.5">
                <Ban className="w-3 h-3 text-red-600" aria-hidden="true" />
                {restriction}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-12">
          {RENTED_HOME_DATA.map((item) => (
            <article key={item.id} className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 border border-stone-200/90 shadow-2xs space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-5">
                <div>
                  <span className="text-xs uppercase tracking-wider text-red-700 font-semibold flex items-center gap-1.5 mb-1">
                    <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                    Обмеження: {item.restriction}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal">{item.title}</h2>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div
                    className={`p-3 rounded-xl border text-right ${
                      item.canTakeWhenMoving ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    <span className={`text-[10px] uppercase tracking-wider block font-semibold ${item.canTakeWhenMoving ? 'text-emerald-700' : 'text-stone-500'}`}>
                      Забрати із собою?
                    </span>
                    <span className="text-xs sm:text-sm font-bold flex items-center gap-1">
                      <Truck className={`w-4 h-4 ${item.canTakeWhenMoving ? 'text-emerald-600' : 'text-stone-400'}`} aria-hidden="true" />
                      {item.canTakeWhenMoving ? 'Так, усе мобільне' : 'Частково'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] text-stone-900 rounded-xl border border-stone-200 text-right">
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">Бюджет:</span>
                    <span className="text-base sm:text-lg font-bold tabular-nums">{formatUAH(item.cost)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-stone-100 border border-stone-200">
                  <AppImage image={item.beforeImage} alt="До перетворення" sizes="(min-width: 640px) 50vw, 100vw" className="w-full h-full object-cover grayscale contrast-125" />
                  <div className="absolute top-3 left-3 bg-black/80 text-white text-xs font-semibold px-3 py-1 rounded-md">До</div>
                </div>
                <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-stone-100 border border-stone-200">
                  <AppImage image={item.afterImage} alt="Після перетворення" sizes="(min-width: 640px) 50vw, 100vw" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-white/90 text-stone-900 text-xs font-semibold px-3 py-1 rounded-md shadow-xs">Після</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF8F5] p-6 rounded-xl border border-stone-200">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[#967259] font-semibold mb-3">Що саме змінили без ремонту:</h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
                    {item.whatChanged.map((step) => (
                      <li key={step} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#8A9A86] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1">Порада для орендованого житла:</h4>
                    <p className="text-xs text-stone-600 leading-relaxed italic">«{item.takeawayTips}»</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'zone-builder', zoneId: 'sofa' })}
                    className="py-2.5 px-4 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 self-start"
                  >
                    <span>Підібрати рішення для моєї орендованої кімнати</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-3">Рекомендовані мобільні товари:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {item.products.map((product) => (
                    <ProductMiniCard
                      key={product.id}
                      product={product}
                      onOpen={onOpenProduct}
                      caption={product.canTakeWhenMoving ? '✓ Забирається при переїзді' : product.category}
                    />
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
