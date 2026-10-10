import { ARTICLES_CATALOG, findArticle } from '../data/articles.ts';
import type { PageView, ProductItem } from '../types.ts';
import { AppImage } from '../components/AppImage.tsx';
import { ProductMiniCard } from '../components/ProductMiniCard.tsx';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider.tsx';
import { ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';

interface InspirationPageProps {
  articleId?: string;
  onNavigate: (view: PageView) => void;
  onOpenProduct: (product: ProductItem) => void;
}

export function InspirationPage({ articleId, onNavigate, onOpenProduct }: InspirationPageProps) {
  const article = articleId ? findArticle(articleId) : undefined;
  const backToList = () => onNavigate({ type: 'inspiration' });

  if (articleId && !article) {
    return (
      <div className="bg-[#FAF8F5] min-h-[60vh] py-16 text-center px-4">
        <h1 className="font-serif text-3xl text-[#2C2C2C]">Статтю не знайдено</h1>
        <p className="text-sm text-stone-600 mt-2">Можливо, посилання застаріло або містить помилку.</p>
        <button type="button" onClick={backToList} className="mt-6 px-5 py-2.5 bg-[#2C2C2C] text-white text-xs font-semibold rounded-lg">
          До всіх лайфхаків
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {article ? (
          <article className="max-w-3xl mx-auto space-y-8 animate-in">
            <button
              type="button"
              onClick={backToList}
              className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> До всіх лайфхаків
            </button>

            <header className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-[#967259] font-semibold">
                #{article.categoryLabel} · {article.readTime}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#2C2C2C] font-normal leading-tight">{article.title}</h1>
              <div className="text-xs text-stone-500 flex items-center gap-2">
                <span>{article.date}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {article.author.name}, {article.author.role.toLowerCase()}
                </span>
              </div>
            </header>

            <div className="rounded-2xl overflow-hidden aspect-[16/9] border border-stone-200 bg-stone-100">
              <AppImage image={article.coverImage} alt={article.title} priority sizes="(min-width: 768px) 768px, 100vw" className="w-full h-full object-cover" />
            </div>

            <p className="font-serif text-lg text-stone-800 leading-relaxed italic border-l-2 border-[#967259] pl-4">{article.intro}</p>

            <div className="space-y-10 pt-4">
              {article.sections.map((section) => (
                <section key={section.step} className="space-y-3">
                  <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block">Лайфхак №{section.step}</span>
                  <h2 className="font-serif text-2xl text-stone-900 font-medium">{section.title}</h2>
                  <p className="text-sm text-stone-700 leading-relaxed">{section.description}</p>
                  <div className="rounded-xl overflow-hidden aspect-[16/10] border border-stone-200 bg-stone-100">
                    <AppImage image={section.image} alt={section.imageAlt ?? section.title} sizes="(min-width: 768px) 768px, 100vw" className="w-full h-full object-cover" />
                  </div>

                  {section.products.length > 0 && (
                    <div className="bg-white border border-[#E6E0D6] rounded-xl p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-3.5 text-xs uppercase tracking-wider text-stone-700 font-semibold">
                        <ShoppingBag className="w-4 h-4 text-[#967259]" aria-hidden="true" />
                        <span>Купити деталь з фото</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {section.products.map((product) => (
                          <ProductMiniCard key={product.id} product={product} onOpen={onOpenProduct} caption={product.merchant} />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {article.beforeAfter && <BeforeAfterSlider data={article.beforeAfter} />}

            <div className="p-8 bg-[#FAF2EB] rounded-2xl border border-[#E6D4C2] text-center space-y-4 my-10">
              <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block">Практичний крок</span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#2C2C2C]">Хочеш таку зону у своєму домі?</h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                HomeEstet налаштує готову схему під ваш бюджет і предмети, які вже є у вас вдома.
              </p>
              <button
                type="button"
                onClick={() => onNavigate({ type: 'zone-builder', zoneId: article.zoneId })}
                className="px-8 py-3 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <span>Зробити мою зону</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {article.relatedArticleIds.length > 0 && (
              <section className="pt-8 border-t border-[#ECE8E1] space-y-4">
                <h2 className="font-serif text-2xl text-[#2C2C2C] font-normal">Схожі добірки</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {article.relatedArticleIds
                    .map(findArticle)
                    .filter((related) => related !== undefined)
                    .map((related) => (
                      <li key={related.id}>
                        <button
                          type="button"
                          onClick={() => onNavigate({ type: 'inspiration', articleId: related.id })}
                          className="w-full text-left p-3 bg-white rounded-xl border border-stone-200 hover:border-stone-400 flex items-center gap-3 transition-all group"
                        >
                          <AppImage image={related.coverImage} alt="" sizes="64px" className="w-16 h-16 object-cover rounded-lg shrink-0" />
                          <span className="block min-w-0">
                            <span className="text-[10px] text-[#967259] uppercase tracking-wider font-semibold block">{related.categoryLabel}</span>
                            <span className="font-serif text-sm font-medium text-stone-900 group-hover:text-[#967259] line-clamp-2 block">{related.title}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            )}
          </article>
        ) : (
          <div className="space-y-10">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Практичний журнал HomeEstet</span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#2C2C2C] font-normal tracking-tight">💡 Лайфхаки простору</h1>
              <p className="text-stone-600 text-xs sm:text-base mt-2 max-w-xl">
                Короткі прийоми, які можна повторити за вечір: що зробити з наявного, що переставити і що докупити, якщо дуже треба.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {ARTICLES_CATALOG.map((item) => (
                <article key={item.id} className="bg-white rounded-xl overflow-hidden border border-[#ECE8E1] hover:border-stone-400 transition-all flex flex-col justify-between group shadow-2xs">
                  <button
                    type="button"
                    className="aspect-[16/10] overflow-hidden bg-stone-100 block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86]"
                    onClick={() => onNavigate({ type: 'inspiration', articleId: item.id })}
                    aria-label={`Читати: ${item.title}`}
                  >
                    <AppImage image={item.coverImage} alt="" sizes="(min-width: 768px) 33vw, 100vw" className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500" />
                  </button>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                      <span className="text-[#967259] font-medium">#{item.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.readTime}</span>
                    </div>

                    <h2 className="font-serif text-lg font-medium text-stone-900 leading-snug mb-2">
                      <button
                        type="button"
                        onClick={() => onNavigate({ type: 'inspiration', articleId: item.id })}
                        className="text-left group-hover:text-[#967259] transition-colors line-clamp-2 focus:outline-none focus-visible:underline"
                      >
                        {item.title}
                      </button>
                    </h2>

                    <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed mb-6 flex-1">{item.excerpt}</p>

                    <button
                      type="button"
                      onClick={() => onNavigate({ type: 'zone-builder', zoneId: item.zoneId })}
                      className="w-full py-2.5 bg-[#FAF8F5] hover:bg-[#FAF2EB] text-[#2C2C2C] hover:text-[#967259] border border-stone-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Зробити цю зону</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
