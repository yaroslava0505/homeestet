import { useEffect, useState } from 'react';
import { ExternalLink, ShoppingBag } from 'lucide-react';
import type { PhotoPlanShopping, ShopProduct } from '../types.ts';
import { shopCategoryName } from '../data/shopCategories.ts';
import { STORE_NAMES, loadShopCatalog, storeLink, variantsFor } from '../lib/shop.ts';
import { formatUAH } from '../utils/format.ts';

const INITIAL_VISIBLE = 6;

interface ShopVariantsProps {
  shopping: PhotoPlanShopping[];
  budgetLimit: number;
}

/** "What to add" block of the photo plan: several real store products per suggested category. */
export function ShopVariants({ shopping, budgetLimit }: ShopVariantsProps) {
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

  if (shopping.length === 0) return null;
  return (
    <section className="bg-white p-5 sm:p-8 rounded-2xl border border-stone-200 space-y-7">
      <div>
        <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Варіанти з магазинів</span>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#2C2C2C]">Що можна додати в цей кут</h2>
        <p className="text-sm text-stone-600 mt-2 leading-relaxed">
          Кілька варіантів у різних цінах із Sinsay та Епіцентру в межах {formatUAH(budgetLimit)}. Ціни на момент
          збору каталогу, остаточна в магазині.
        </p>
      </div>
      {catalog ? (
        shopping.map((entry) => <VariantRow key={entry.category} entry={entry} catalog={catalog} budgetLimit={budgetLimit} />)
      ) : (
        <p className="text-sm text-stone-500" aria-live="polite">
          Завантажуємо каталог…
        </p>
      )}
    </section>
  );
}

function VariantRow({ entry, catalog, budgetLimit }: { entry: PhotoPlanShopping; catalog: ShopProduct[]; budgetLimit: number }) {
  const [expanded, setExpanded] = useState(false);
  const items = variantsFor(catalog, entry.category, budgetLimit);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE);
  const hidden = items.length - INITIAL_VISIBLE;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-serif text-lg text-stone-900">{shopCategoryName(entry.category)}</h3>
        {entry.why && <p className="text-xs text-stone-600 mt-0.5">{entry.why}</p>}
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 list-none p-0 m-0">
        {visible.map((product) => (
          <li key={product.id}>
            <ShopProductCard product={product} />
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-[#967259] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] rounded"
        >
          {expanded ? 'Згорнути' : `Показати ще ${hidden}`}
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
