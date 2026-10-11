import { useState } from 'react';
import type { PageView } from '../types.ts';
import { Dices, Menu, X, User, Camera } from 'lucide-react';
import { LOCALES, getLocale, switchLocale, t, type Locale } from '../i18n/index.ts';

interface HeaderProps {
  onNavigate: (view: PageView) => void;
  currentView: PageView;
  onOpenSurprise: () => void;
  savedCount: number;
}

const NAV_ITEMS: { label: string; view: PageView }[] = [
  { label: t('✨ Зроби цю зону'), view: { type: 'zone-builder' } },
  { label: t('🎨 Мій стиль'), view: { type: 'style-quiz' } },
  { label: t('🏠 Маленький дім'), view: { type: 'small-spaces' } },
  { label: t('🏡 Орендована квартира'), view: { type: 'rented-home' } },
  { label: t('📋 Мій план'), view: { type: 'personal-plan' } },
  { label: t('💡 Лайфхаки'), view: { type: 'inspiration' } },
];

const LOCALE_LABELS: Record<Locale, string> = { uk: 'UA', ru: 'RU' };

/** UA | RU toggle; switching reloads the same page in the other language. */
function LanguageSwitch({ className = '' }: { className?: string }) {
  const current = getLocale();
  return (
    <div className={`flex items-center rounded-full border border-stone-200 bg-white/70 p-0.5 text-[11px] font-semibold ${className}`} role="group" aria-label={t('Мова сайту')}>
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          onClick={() => locale !== current && switchLocale(locale)}
          aria-pressed={locale === current}
          className={`px-2 py-1 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] ${
            locale === current ? 'bg-[#2C2C2C] text-white' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}

export function Header({ onNavigate, currentView, onOpenSurprise, savedCount }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: PageView) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const isActive = (view: PageView) => currentView.type === view.type;

  return (
    <header className="sticky top-0 z-40 bg-[#F9F8F6]/95 backdrop-blur-md border-b border-[#ECE8E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleNavClick({ type: 'home' })}
          className="text-left group flex items-baseline gap-2 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] rounded"
          aria-label={t('HomeEstet, на головну')}
        >
          <span className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#2C2C2C] group-hover:text-[#967259] transition-colors">
            HOMEESTET
          </span>
          {/* One-line tagline next to the logo; hidden where the desktop menu needs the room. */}
          <span className="hidden sm:inline-block xl:hidden whitespace-nowrap text-[11px] font-sans tracking-widest uppercase text-stone-500 font-light">
            {t('· Сервіс затишного дому')}
          </span>
        </button>

        <nav className="hidden xl:flex items-center gap-4 text-[13px] font-medium text-stone-600" aria-label={t('Головне меню')}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.view);
            return (
              <button
                type="button"
                key={item.label}
                onClick={() => handleNavClick(item.view)}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap transition-colors relative py-1 hover:text-[#2C2C2C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] rounded ${
                  active ? 'text-[#2C2C2C] font-semibold' : ''
                }`}
              >
                {item.label}
                {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#967259] rounded-full" />}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <LanguageSwitch className="hidden sm:flex" />
          {/* Primary action of the service: photo → plan */}
          <button
            type="button"
            onClick={() => handleNavClick({ type: 'analyze' })}
            aria-current={currentView.type === 'analyze' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shadow-2xs ${
              currentView.type === 'analyze' ? 'bg-[#2C2C2C] text-white' : 'bg-[#967259] hover:bg-[#7e5f49] text-white'
            }`}
            title={t('Сфотографуй кут, отримай план')}
          >
            <Camera className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden md:inline">{t('Аналіз фото')}</span>
            <span className="sr-only md:hidden">{t('Аналіз фото')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSurprise}
            className="p-2 rounded-full text-[#967259] hover:bg-[#FAF2EB] transition-colors"
            title={t('Здивуй мене: випадкова ідея для дому')}
            aria-label={t('Здивуй мене: випадкова ідея для дому')}
          >
            <Dices className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => handleNavClick({ type: 'my-homeestet' })}
            className={`p-2 rounded-full transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] ${
              currentView.type === 'my-homeestet'
                ? 'bg-[#2C2C2C] text-white'
                : 'text-stone-700 hover:bg-stone-200/50 hover:text-black'
            }`}
            title={t('Мій HomeEstet (збережені рішення та план)')}
            aria-label={savedCount > 0 ? t('Мій кабінет, збережено {n}', { n: savedCount }) : t('Мій кабінет')}
          >
            <User className="w-4 h-4" aria-hidden="true" />
            {savedCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-[#967259] text-white rounded-full flex items-center justify-center tabular-nums"
              >
                {savedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="xl:hidden p-2 text-stone-700 hover:text-stone-900 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86]"
            aria-label={mobileMenuOpen ? t('Закрити меню') : t('Відкрити меню')}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-menu" className="xl:hidden bg-[#FAF8F5] border-b border-[#ECE8E1] px-5 py-6 space-y-4 shadow-xl">
          <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">{t('Сервіси HomeEstet')}</p>

          <nav className="grid grid-cols-1 gap-2" aria-label={t('Мобільне меню')}>
            <button
              type="button"
              onClick={() => handleNavClick({ type: 'analyze' })}
              aria-current={currentView.type === 'analyze' ? 'page' : undefined}
              className="text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#967259] bg-[#FAF2EB] hover:bg-[#F2E5D5] transition-colors flex items-center justify-between"
            >
              <span>{t('📸 Аналіз фото: сфотографуй кут, отримай план')}</span>
              <span aria-hidden="true">→</span>
            </button>
            {NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.label}
                onClick={() => handleNavClick(item.view)}
                aria-current={isActive(item.view) ? 'page' : undefined}
                className="text-left px-3.5 py-2.5 rounded-lg text-sm font-medium text-stone-800 hover:bg-stone-200/60 transition-colors flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="text-stone-400" aria-hidden="true">→</span>
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
            <LanguageSwitch className="self-start sm:hidden" />
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSurprise();
              }}
              className="w-full py-2.5 bg-[#FAF2EB] text-[#967259] text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
            >
              <Dices className="w-4 h-4" aria-hidden="true" />
              <span>{t('Здивуй мене (випадкова ідея)')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
