import { useState } from 'react';
import type { ProductItem } from '../types.ts';
import { X, ExternalLink, ShieldCheck, Check, Star, Bookmark, Share2 } from 'lucide-react';
import { Modal } from './Modal.tsx';
import { AppImage } from './AppImage.tsx';
import { formatUAH, shareOrCopy, type ShareStatus } from '../utils/format.ts';

interface ProductModalProps {
  product: ProductItem | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (productId: string) => void;
}

export function ProductModal({ product, onClose, isSaved, onToggleSave }: ProductModalProps) {
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');

  if (!product) return null;

  const hasStoreLink = Boolean(product.affiliateUrl && product.affiliateUrl.startsWith('http'));
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  const handleShare = async () => {
    const { status } = await shareOrCopy({
      title: product.name,
      text: `${product.name} — ${formatUAH(product.price)} · HomeEstet`,
      url: window.location.href,
    });
    setShareStatus(status);
    window.setTimeout(() => setShareStatus('idle'), 2500);
  };

  return (
    <Modal isOpen onClose={onClose} label={product.name} panelClassName="max-w-2xl md:flex-row relative">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white text-stone-700 rounded-full transition-colors shadow-2xs"
        aria-label="Закрити"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      <div className="md:w-1/2 bg-stone-100 relative min-h-[220px] md:min-h-full shrink-0">
        <AppImage
          image={product.image}
          alt={product.name}
          sizes="(min-width: 768px) 336px, 100vw"
          className="w-full h-full object-cover object-center absolute inset-0"
        />
        {discount > 0 && (
          <div className="absolute top-4 left-4 bg-[#967259] text-white text-xs font-semibold px-2.5 py-1 rounded">
            Знижка {discount}%
          </div>
        )}
      </div>

      <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between gap-4 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-600 mb-1 pr-8">
            <span>{product.merchant}</span>
            {product.rating !== undefined && product.reviewsCount !== undefined && (
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
                <span>
                  {product.rating} ({product.reviewsCount} відгуків)
                </span>
              </span>
            )}
          </div>

          <h3 className="font-serif text-xl sm:text-2xl text-[#2C2C2C] font-normal leading-snug mb-3">{product.name}</h3>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-semibold text-[#2C2C2C] tabular-nums">{formatUAH(product.price)}</span>
            {discount > 0 && product.oldPrice && (
              <span className="text-sm text-stone-600 line-through tabular-nums">{formatUAH(product.oldPrice)}</span>
            )}
          </div>

          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
            {product.description ?? product.reason ?? 'Натуральні матеріали та продумана ергономіка для щоденного комфорту.'}
          </p>

          <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-200/80 pt-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#8A9A86]" aria-hidden="true" />
              <span>Підібрано стилістами HomeEstet</span>
            </div>
            {product.inStock !== undefined && (
              <div className="flex items-center gap-2">
                <Check className={`w-4 h-4 ${product.inStock ? 'text-[#8A9A86]' : 'text-stone-400'}`} aria-hidden="true" />
                <span>{product.inStock ? 'В наявності у партнера' : 'Тимчасово немає в наявності'}</span>
              </div>
            )}
            {product.canTakeWhenMoving && (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#8A9A86]" aria-hidden="true" />
                <span>Можна забрати із собою при переїзді</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {hasStoreLink ? (
            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="w-full py-3 bg-[#2C2C2C] hover:bg-[#444444] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Переглянути в магазині</span>
              <ExternalLink className="w-4 h-4 text-stone-300" aria-hidden="true" />
            </a>
          ) : (
            <div
              role="status"
              className="w-full py-3 px-3 bg-[#EAE6DF] text-stone-700 text-xs text-center rounded-lg leading-relaxed"
            >
              Посилання на магазин буде додано після запуску каталогу партнерів.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(product.id)}
              aria-pressed={isSaved}
              className={`py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 border ${
                isSaved
                  ? 'bg-[#967259] text-white border-[#967259]'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
              <span>{isSaved ? 'Збережено ✓' : 'Зберегти товар'}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="py-2 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg transition-colors border border-stone-300 flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {shareStatus === 'copied'
                  ? 'Посилання скопійовано ✓'
                  : shareStatus === 'shared'
                    ? 'Надіслано ✓'
                    : shareStatus === 'failed'
                      ? 'Скопіюйте адресу з рядка браузера'
                      : 'Поділитися'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
