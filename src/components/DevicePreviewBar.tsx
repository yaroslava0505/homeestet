import type { PageView } from '../types.ts';
import { Monitor, Smartphone, Maximize2, Sparkles, Palette, ClipboardList, Camera } from 'lucide-react';

export type DeviceMode = 'fluid' | 'desktop-1440' | 'mobile-375';

interface DevicePreviewBarProps {
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  pageView: PageView;
  setPageView: (view: PageView) => void;
  onOpenSurprise: () => void;
}

const QUICK_LINKS: { label: string; view: PageView; icon?: typeof Sparkles; iconClass?: string }[] = [
  { label: 'Головна', view: { type: 'home' } },
  { label: 'Зроби цю зону', view: { type: 'zone-builder' }, icon: Sparkles, iconClass: 'text-[#967259]' },
  { label: 'Тест стилю', view: { type: 'style-quiz' }, icon: Palette, iconClass: 'text-amber-300' },
  { label: 'Маленький дім', view: { type: 'small-spaces' } },
  { label: 'Оренда', view: { type: 'rented-home' } },
  { label: 'План 30 днів', view: { type: 'personal-plan' }, icon: ClipboardList, iconClass: 'text-emerald-400' },
];

/** Development-only toolbar for checking layouts at 1440px and 375px. Never rendered in production. */
export function DevicePreviewBar({
  deviceMode,
  setDeviceMode,
  pageView,
  setPageView,
  onOpenSurprise,
}: DevicePreviewBarProps) {
  return (
    <aside
      aria-label="Панель перегляду макетів (тільки для розробки)"
      className="bg-[#1C1A18] text-[#EAE6DF] border-b border-[#2E2A27] px-3 sm:px-6 py-2 text-xs select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-0.5">
          <div className="flex items-center gap-1.5 font-medium text-white tracking-wider uppercase text-[11px] whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#967259] inline-block" />
            <span>DEV · HomeEstet</span>
          </div>

          <div className="h-3.5 w-px bg-white/20 hidden sm:block" />

          <div className="flex items-center gap-1 bg-[#282522] p-1 rounded-md overflow-x-auto">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              const active = pageView.type === link.view.type;
              return (
                <button
                  type="button"
                  key={link.label}
                  onClick={() => setPageView(link.view)}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
                    active ? 'bg-[#FAF8F5] text-[#1C1A18] font-semibold' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className={`w-3 h-3 ${link.iconClass ?? ''}`} aria-hidden="true" />}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSurprise}
            className="text-stone-300 hover:text-amber-200 transition-colors px-2 py-1 text-[11px] border border-stone-700 rounded flex items-center gap-1"
          >
            🎲 Здивуй
          </button>

          <button
            type="button"
            onClick={() => setPageView({ type: 'analyze' })}
            className="text-stone-300 hover:text-white transition-colors px-2 py-1 text-[11px] border border-stone-700 rounded flex items-center gap-1"
          >
            <Camera className="w-3 h-3 text-[#967259]" aria-hidden="true" />
            <span className="hidden sm:inline">Аналіз фото</span>
          </button>

          <div className="flex items-center bg-[#282522] p-1 rounded-md border border-[#3C3833]" role="group" aria-label="Режим перегляду">
            {(
              [
                { mode: 'fluid', title: 'Адаптивний екран', icon: Maximize2, label: '' },
                { mode: 'desktop-1440', title: '1440px Desktop макет', icon: Monitor, label: '1440px' },
                { mode: 'mobile-375', title: '375px Mobile макет', icon: Smartphone, label: '375px' },
              ] as const
            ).map(({ mode, title, icon: Icon, label }) => (
              <button
                type="button"
                key={mode}
                onClick={() => setDeviceMode(mode)}
                title={title}
                aria-pressed={deviceMode === mode}
                className={`p-1.5 rounded transition-colors flex items-center gap-1 text-[11px] ${
                  deviceMode === mode ? 'bg-[#967259] text-white font-medium' : 'text-stone-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {label && <span className="hidden sm:inline">{label}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
