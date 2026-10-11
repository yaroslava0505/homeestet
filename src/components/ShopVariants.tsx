import { useEffect, useState } from 'react';
import { ExternalLink, ShoppingBag } from 'lucide-react';
import type { PhotoPlanShopping, ShopProduct } from '../types.ts';
import { shopCategoryName } from '../data/shopCategories.ts';
import { STORE_NAMES, loadShopCatalog, pickSpread, storeLink, variantsFor } from '../lib/shop.ts';
import { formatUAH, formatUAHRange } from '../utils/format.ts';
import { t } from '../i18n/index.ts';

const INITIAL_VISIBLE = 6;

interface ShopVariantsProps {
  shopping: PhotoPlanShopping[];
  budgetLimit: number;
  budgetMin: number;
  budgetMax: number;
}

/** "What to buy" block of the photo plan: for each suggested category, several real store products in different prices. */
export function ShopVariants({ shopping, budgetLimit, budgetMin, budgetMax }: ShopVariantsProps) {
  const [catalog, setCatalog] = useState<ShopProduct[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadShopCatalog().then((items) => {
      if (alive) setCatalog(items);
    });
    return () => {
      alive = false;
    };
  }, []);

  const rows = catalog ? shopping.map((entry) => ({ entry, items: variantsFor(catalog, entry.category, budgetLimit) })).filter((r) => r.items.length > 0) : [];
  const minimalKit = rows.reduce((sum, r) => sum + r.items[0].price, 0);

  return (
    <section className="bg-white p-5 sm:p-8 rounded-2xl border border-stone-200 space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">{t('Розумний шопінг')}</span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2C2C2C]">{shopping.length > 0 ? t('Що варто докупити') : t('Купувати нічого не треба')}</h2>
          {shopping.length > 0 && (
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              {t('Для кожної речі кілька реальних варіантів у різних цінах із Sinsay та Епіцентру в межах {limit}. Ціни на момент збору каталогу, остаточна в магазині.', { limit: formatUAH(budgetLimit) })}
            </p>
          )}
        </div>
        {shopping.length > 0 && (
          <div className="text-left sm:text-right text-xs text-stone-600 shrink-0">
            <span className="block">
              {t('Орієнтовно на весь план:')} <strong>{budgetMax > 0 ? formatUAHRange(budgetMin, budgetMax) : '0 ₴'}</strong>
            </span>
            {minimalKit > 0 && (
              <span className="block">
                {t('Найдешевший набір:')} <strong>від {formatUAH(minimalKit)}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {shopping.length === 0 ? (
        <p className="text-sm text-stone-600">{t('Усе, що потрібно для цього кута, у тебе вже є. План вище повністю безкоштовний.')}</p>
      ) : !catalog ? (
        <p className="text-sm text-stone-500" aria-live="polite">
          {t('Завантажуємо каталог…')}
        </p>
      ) : (
        rows.map(({ entry, items }) => <VariantRow key={entry.category} entry={entry} items={items} />)
      )}
    </section>
  );
}

function VariantRow({ entry, items }: { entry: PhotoPlanShopping; items: ShopProduct[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : pickSpread(items, INITIAL_VISIBLE);
  const hidden = items.length - visible.length;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-serif text-lg text-stone-900">{shopCategoryName(entry.category)}</h3>
        {entry.why && (
          <p className="text-xs text-stone-700 mt-0.5">
            <strong className="text-stone-900">{t('Чому:')}</strong> {entry.why}
          </p>
        )}
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 list-none p-0 m-0">
        {visible.map((product) => (
          <li key={product.id}>
            <ShopProductCard product={product} />
          </li>
        ))}
      </ul>
      {(hidden > 0 || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-[#967259] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] rounded"
        >
          {expanded ? t('Згорнути') : t('Показати ще {n}', { n: hidden })}
        </button>
      )}
    </div>
  );
}

export function ShopProductCard({ product }: { product: ShopProduct }) {
  const [broken, setBroken] = useState(false);
  return (
    <a
      href={storeLink(product)}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      className="group block h-full rounded-xl border border-stone-200 bg-white overflow-hidden hover:border-stone-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86]"
    >
      <span className="block aspect-square bg-stone-100 overflow-hidden">
        {broken ? (
          <span className="w-full h-full flex items-center justify-center text-stone-400">
            <ShoppingBag className="w-6 h-6" aria-hidden="true" />
          </span>
        ) : (
          <img
            src={product.image}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        )}
      </span>
      <span className="block p-2.5">
        <span className="text-[10px] uppercase tracking-wider text-stone-500 block">{STORE_NAMES[product.store]}</span>
        <span className="text-xs text-stone-800 leading-snug line-clamp-2 min-h-[2.6em] block">{product.name}</span>
        <span className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold text-stone-900 tabular-nums">{formatUAH(product.price)}</span>
          <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#967259]" aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}
