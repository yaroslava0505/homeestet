import { ZONES, HOME_BEFORE_AFTER } from '../data/homeestetData.ts';
import { ARTICLES_CATALOG } from '../data/articles.ts';
import { IMAGES } from '../data/images.ts';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider.tsx';
import { AppImage } from '../components/AppImage.tsx';
import type { PageView } from '../types.ts';
import { ArrowRight, Calendar } from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: PageView) => void;
  onOpenSurprise: () => void;
}

const INTENT_CARDS: { icon: string; title: string; hint: string; view?: PageView; accent?: boolean }[] = [
  { icon: '✨', title: 'Зробити красивіше', hint: '→ готові рішення', view: { type: 'zone-builder' } },
  { icon: '🧺', title: 'Навести порядок', hint: '→ план на 30 днів', view: { type: 'personal-plan' } },
  { icon: '🛋️', title: 'Оновити кімнату', hint: '→ рішення для кімнат', view: { type: 'zone-builder' } },
  { icon: '💰', title: 'Вкластися в бюджет', hint: '→ бюджетні рішення', view: { type: 'zone-builder' } },
  { icon: '🎨', title: 'Знайти свій стиль', hint: '→ генератор стилю', view: { type: 'style-quiz' } },
  { icon: '🎲', title: 'Здивуй мене', hint: '→ випадкова ідея', accent: true },
];

export function HomePage({ onNavigate, onOpenSurprise }: HomePageProps) {
  return (
    <div className="space-y-0">
      {/* 1. Intent navigator */}
      <section className="relative overflow-hidden bg-[#FAF8F5] pt-14 pb-16 sm:pt-20 sm:pb-20 border-b border-[#ECE8E1]">
        {/* Decorative backdrop: brand photo under a warm frosted wash, fading into the page background. */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <AppImage
            image={IMAGES.sofaWarm}
            alt=""
            priority
            sizes="100vw"
            className="w-full h-full object-cover object-[center_40%] scale-105"
          />
          <div className="absolute inset-0 bg-[#FAF8F5]/78" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/30 via-[#FAF8F5]/10 to-[#FAF8F5]" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[80vw] max-w-5xl h-[28rem] rounded-full bg-[#E8D4C0]/45 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#8A9A86]/15 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold mb-2 inline-block">
              HOMEESTET · Сервіс естетичного та затишного дому
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#2C2C2C] font-normal leading-[1.12] tracking-tight mb-4 text-balance">
              Як хочеш змінити свій дім?
            </h1>
            <p className="text-stone-700 text-sm sm:text-lg font-light leading-relaxed max-w-xl mx-auto">
              Обери, що тобі потрібно, і HomeEstet підкаже, з чого почати, що змінити та як вкластися у свій бюджет.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {INTENT_CARDS.map((card) => (
              <button
                type="button"
                key={card.title}
                onClick={() => (card.view ? onNavigate(card.view) : onOpenSurprise())}
                className={`p-5 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-1 shadow-sm backdrop-blur-sm group flex flex-col justify-between aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] ${
                  card.accent
                    ? 'bg-[#FAF2EB]/95 hover:bg-[#F2E5D5] border-[#E8D4C0] hover:border-[#967259]'
                    : 'bg-white/92 hover:bg-white border-[#ECE8E1] hover:border-[#967259]'
                }`}
              >
                <span className="text-3xl block mb-2" aria-hidden="true">
                  {card.icon}
                </span>
                <span className="block">
                  <span
                    className={`font-serif text-base sm:text-lg font-medium block leading-tight transition-colors ${
                      card.accent ? 'text-[#967259]' : 'text-stone-900 group-hover:text-[#967259]'
                    }`}
                  >
                    {card.title}
                  </span>
                  <span className={`text-[11px] mt-1 block ${card.accent ? 'text-[#967259]/80' : 'text-stone-500'}`}>{card.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Zones */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#ECE8E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Головний інструмент сервісу</span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#2C2C2C] font-normal tracking-tight">✨ Зроби цю зону</h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-xl">
                Не знаєш, з чого почати? Обери зону, і ми підберемо рішення під твій стиль, бюджет і те, що вже є вдома.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate({ type: 'zone-builder' })}
              className="px-6 py-3 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto shadow-2xs"
            >
              <span>Повний конфігуратор</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {ZONES.map((zone) => (
              <button
                type="button"
                key={zone.id}
                onClick={() => onNavigate({ type: 'zone-builder', zoneId: zone.id })}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-stone-100 border border-stone-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-end p-4 sm:p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86]"
              >
                <AppImage
                  image={zone.image}
                  alt=""
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent group-hover:from-black/90 transition-colors" />

                <span className="relative z-10 text-white block">
                  <span className="text-2xl sm:text-3xl block mb-1.5" aria-hidden="true">
                    {zone.icon}
                  </span>
                  <span className="font-serif text-lg sm:text-xl font-medium leading-snug block">{zone.name}</span>
                  <span className="text-[11px] text-stone-300 line-clamp-1 mt-0.5 block">{zone.tagline}</span>
                  <span className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-amber-200">
                    <span className="font-medium">Обрати зону</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Inspiration */}
      <section className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-[#ECE8E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Практичний журнал</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#2C2C2C] font-normal tracking-tight">Натхнення: ідеї, які можна повторити</h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-xl">
                Кожен матеріал має конкретні кроки та веде до створення вашого власного простору.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate({ type: 'inspiration' })}
              className="text-xs sm:text-sm font-semibold text-[#2C2C2C] hover:text-[#967259] transition-colors flex items-center gap-1"
            >
              <span>Всі статті</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {ARTICLES_CATALOG.slice(0, 3).map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-xl overflow-hidden border border-[#ECE8E1] hover:border-stone-400 shadow-2xs hover:shadow-xs transition-all flex flex-col group"
              >
                <button
                  type="button"
                  className="aspect-[16/10] overflow-hidden bg-stone-100 block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86]"
                  onClick={() => onNavigate({ type: 'inspiration', articleId: article.id })}
                  aria-label={`Читати: ${article.title}`}
                >
                  <AppImage
                    image={article.coverImage}
                    alt=""
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                  />
                </button>

                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                    <span className="text-[#967259] font-medium">#{article.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.readTime}</span>
                  </div>

                  <h3 className="font-serif text-lg sm:text-xl font-medium text-stone-900 leading-snug mb-2.5">
                    <button
                      type="button"
                      onClick={() => onNavigate({ type: 'inspiration', articleId: article.id })}
                      className="text-left group-hover:text-[#967259] transition-colors line-clamp-2 focus:outline-none focus-visible:underline"
                    >
                      {article.title}
                    </button>
                  </h3>

                  <p className="text-stone-600 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-6 flex-1">{article.excerpt}</p>

                  <div className="pt-4 border-t border-stone-100 flex flex-col gap-2">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Хочеш таку зону вдома?</span>
                    <button
                      type="button"
                      onClick={() => onNavigate({ type: 'zone-builder', zoneId: article.zoneId })}
                      className="w-full py-2.5 bg-[#FAF2EB] hover:bg-[#F2E5D5] text-[#967259] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Зробити мою зону</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Before / after */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#ECE8E1]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <BeforeAfterSlider data={HOME_BEFORE_AFTER} onRepeatSolution={() => onNavigate({ type: 'zone-builder', zoneId: 'kitchen' })} />
        </div>
      </section>

      {/* 5. Small spaces and rentals */}
      <section className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-[#ECE8E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-stone-200 shadow-2xs space-y-5 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Для смарт-квартир (20–40 м²)</span>
                <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal">🏠 Маленький дім: більше повітря</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                  Як звільнити 30 % робочої площі, прибрати захаращеність у спальні чи кухні та зробити простір візуально ширшим без перепланування.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate({ type: 'small-spaces' })}
                  className="px-5 py-2.5 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <span>Рішення для маленьких площ</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-stone-200 shadow-2xs space-y-5 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#8A9A86] font-semibold block mb-1">Без свердління та фарбування</span>
                <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal">🏡 Красивий дім без ремонту</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                  Орендуєте житло? Дізнайтеся, як замаскувати старий диван, налаштувати тепле світло та за 2 години забрати всі елементи із собою при переїзді.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate({ type: 'rented-home' })}
                  className="px-5 py-2.5 bg-[#967259] hover:bg-[#7e5f49] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <span>Ідеї для орендованого житла</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Plan */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block">Без стресу та вигорання</span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#2C2C2C] font-normal tracking-tight">
            Твій персональний план оновлення дому на 30 днів
          </h2>
          <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            4 тижні: Порядок → Текстиль → Освітлення → Декор. Інтерактивний чек-лист із підрахунком прогресу та точними діями.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate({ type: 'personal-plan' })}
              className="px-8 py-3.5 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm inline-flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>Відкрити мій план на 30 днів</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
