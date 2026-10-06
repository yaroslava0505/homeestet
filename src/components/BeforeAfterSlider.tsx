import { useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { BeforeAfterData } from '../types.ts';
import { AppImage } from './AppImage.tsx';
import { formatUAH } from '../utils/format.ts';

interface BeforeAfterSliderProps {
  data: BeforeAfterData;
  onRepeatSolution?: () => void;
}

/**
 * Before/after comparison. The divider is a native range input, so it works with mouse, touch,
 * keyboard and screen readers.
 */
export function BeforeAfterSlider({ data, onRepeatSolution }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const sliderId = useId();

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 border border-[#ECE8E1] shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">
            Реальна трансформація
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl text-[#2C2C2C] font-normal leading-snug">{data.title}</h3>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">{data.subtitle}</p>
        </div>

        {data.budget !== undefined && (
          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200 shrink-0 text-left sm:text-right">
            <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-medium">
              Бюджет цього оновлення:
            </span>
            <div className="flex items-baseline gap-2 sm:justify-end mt-0.5">
              <span className="text-xl font-serif font-bold text-[#2C2C2C] tabular-nums">{formatUAH(data.budget)}</span>
              {data.budgetFrom !== undefined && (
                <span className="text-xs text-[#967259] font-medium">(можна від {formatUAH(data.budgetFrom)})</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden select-none border border-[#E2DDD5] mb-8 bg-stone-100">
        <AppImage
          image={data.afterImg}
          alt={data.afterLabel ?? 'Після'}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />
        <div className="absolute top-4 right-4 z-10 px-3.5 py-1.5 bg-white/90 backdrop-blur-md rounded-lg text-xs font-semibold text-stone-800 shadow-xs uppercase tracking-wider pointer-events-none">
          {data.afterLabel ?? 'Після'}
        </div>

        <AppImage
          image={data.beforeImg}
          alt={data.beforeLabel ?? 'До'}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none grayscale contrast-125"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        />
        <div
          className="absolute top-4 left-4 z-10 px-3.5 py-1.5 bg-stone-900/85 backdrop-blur-md rounded-lg text-xs font-semibold text-white shadow-xs uppercase tracking-wider pointer-events-none"
          style={{ opacity: position > 18 ? 1 : 0, transition: 'opacity 150ms' }}
        >
          {data.beforeLabel ?? 'До'}
        </div>

        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] z-20 pointer-events-none"
          style={{ left: `${position}%` }}
          aria-hidden="true"
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-[#2C2C2C] border border-stone-200 text-xs font-bold">
            ⇔
          </div>
        </div>

        <label htmlFor={sliderId} className="sr-only">
          Порівняння до і після: положення роздільника
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          aria-valuetext={`${position}% до, ${100 - position}% після`}
        />
      </div>

      <div className="pt-2 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          {data.changes && data.changes.length > 0 && (
            <>
              <h4 className="text-xs uppercase tracking-widest text-[#967259] font-semibold mb-3">Що саме змінили у просторі:</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
                {data.changes.map((item, idx) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#FAF2EB] text-[#967259] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {data.notes && <p className="text-xs text-stone-500 mt-3">{data.notes}</p>}
        </div>

        {onRepeatSolution && (
          <div className="bg-[#FAF8F5] p-6 rounded-xl border border-stone-200/90 flex flex-col justify-between">
            <div>
              <h5 className="font-serif text-lg font-medium text-[#2C2C2C] mb-1">Хочете такий результат для своєї зони?</h5>
              <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                Вкажіть свій бюджет, виберіть наявні предмети, і HomeEstet підбере аналогічний план без зайвих покупок.
              </p>
            </div>
            <button
              type="button"
              onClick={onRepeatSolution}
              className="w-full py-3 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Повторити це рішення для мого дому</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
