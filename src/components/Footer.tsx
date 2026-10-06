import type { PageView } from '../types.ts';
import { Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: PageView) => void;
}

const SERVICE_LINKS: { label: string; view: PageView }[] = [
  { label: '✨ Зроби цю зону', view: { type: 'zone-builder' } },
  { label: '🎨 Генератор стилю', view: { type: 'style-quiz' } },
  { label: '🏠 Маленький дім (20–40 м²)', view: { type: 'small-spaces' } },
  { label: '🏡 Орендована квартира', view: { type: 'rented-home' } },
  { label: '📋 План на 30 днів', view: { type: 'personal-plan' } },
];

const ZONE_LINKS: { label: string; zoneId: string }[] = [
  { label: '🛋️ Диванна зона', zoneId: 'sofa' },
  { label: '☕ Кавовий куточок', zoneId: 'coffee' },
  { label: '🛏️ Спальня', zoneId: 'bedroom' },
  { label: '🍽️ Кухня', zoneId: 'kitchen' },
  { label: '🖥️ Робоче місце', zoneId: 'workspace' },
];

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#1C1917] text-[#ECE6DE] pt-14 pb-10 border-t border-[#2D2824]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-white/10">
          <div className="lg:col-span-2 space-y-4">
            <span className="font-serif text-2xl font-medium tracking-tight text-white block">HOMEESTET</span>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-sm italic font-serif">
              «HOMEESTET НЕ ПРОСТО ПОКАЗУЄ КРАСИВІ ІНТЕР’ЄРИ. HOMEESTET ДОПОМАГАЄ ЛЮДИНІ ЗРОБИТИ ЇЇ ВЛАСНИЙ ДІМ КРАСИВІШИМ.»
            </p>
            <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
              Спочатку використай те, що вже маєш. Купуй лише те, що реально змінить простір. Розумні рішення під будь-який бюджет без ремонту.
            </p>
          </div>

          <nav aria-label="Головні функції">
            <h4 className="text-xs uppercase tracking-widest text-[#D4B28C] font-semibold mb-4">Головні функції</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-stone-400">
              {SERVICE_LINKS.map((link) => (
                <li key={link.label}>
                  <button type="button" onClick={() => onNavigate(link.view)} className="hover:text-white transition-colors text-left">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Зони для оновлення">
            <h4 className="text-xs uppercase tracking-widest text-[#D4B28C] font-semibold mb-4">Зони для оновлення</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-stone-400">
              {ZONE_LINKS.map((link) => (
                <li key={link.zoneId}>
                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'zone-builder', zoneId: link.zoneId })}
                    className="hover:text-white transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-[#D4B28C] font-semibold mb-4">Прозорість</h4>
            <p className="text-[11px] text-stone-400 leading-relaxed mb-3">
              Ми рекомендуємо лише предмети, перевірені за пропорціями та матеріалами. Партнерські посилання на магазини з’являться після запуску каталогу й будуть позначені.
            </p>
            <button
              type="button"
              onClick={() => onNavigate({ type: 'my-homeestet' })}
              className="text-xs text-[#D4B28C] underline hover:text-white transition-colors"
            >
              Мій кабінет HomeEstet →
            </button>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} HOMEESTET. Всі права захищено.</p>
          <span className="flex items-center gap-1 text-stone-400">
            З турботою про ваш дім <Heart className="w-3 h-3 text-[#967259] fill-current" aria-hidden="true" />
          </span>
        </div>
      </div>
    </footer>
  );
}
