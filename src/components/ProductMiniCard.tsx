import type { ProductItem } from '../types.ts';
import { AppImage } from './AppImage.tsx';
import { formatUAH } from '../utils/format.ts';

interface ProductMiniCardProps {
  product: ProductItem;
  onOpen: (product: ProductItem) => void;
  /** Small caption above the name (category by default). */
  caption?: string;
  className?: string;
}

/** Compact clickable product row used in lists. Opens the product dialog. */
export function ProductMiniCard({ product, onOpen, caption, className = '' }: ProductMiniCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className={`w-full text-left p-3 rounded-lg border border-stone-200 bg-white hover:border-stone-400 transition-all flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] ${className}`}
    >
      <AppImage
        image={product.image}
        alt=""
        sizes="48px"
        className="w-12 h-12 object-cover rounded bg-stone-100 shrink-0"
      />
      <span className="flex-1 min-w-0 block">
        <span className="text-[11px] text-stone-500 block truncate">{caption ?? product.category}</span>
        <span className="text-xs font-medium text-stone-800 line-clamp-1 group-hover:text-[#967259] block">
          {product.name}
        </span>
        <span className="text-xs font-bold text-stone-900 tabular-nums block">{formatUAH(product.price)}</span>
      </span>
    </button>
  );
}
