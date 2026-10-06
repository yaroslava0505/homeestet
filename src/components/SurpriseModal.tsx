import { useState } from 'react';
import { SURPRISE_IDEAS } from '../data/homeestetData.ts';
import type { SurpriseIdea } from '../types.ts';
import { X, Dices, ArrowRight, Bookmark } from 'lucide-react';
import { Modal } from './Modal.tsx';

interface SurpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveIdea: (idea: SurpriseIdea) => void;
  isIdeaSaved: (ideaId: string) => boolean;
  onTryToday: (idea: SurpriseIdea) => void;
}

export function SurpriseModal({ isOpen, onClose, onSaveIdea, isIdeaSaved, onTryToday }: SurpriseModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * SURPRISE_IDEAS.length));

  const currentIdea = SURPRISE_IDEAS[currentIndex % SURPRISE_IDEAS.length];
  const saved = isIdeaSaved(currentIdea.id);

  const rollNextIdea = () => {
    let next = Math.floor(Math.random() * SURPRISE_IDEAS.length);
    if (next === currentIndex) next = (currentIndex + 1) % SURPRISE_IDEAS.length;
    setCurrentIndex(next);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Здивуй мене: випадкова ідея" panelClassName="max-w-lg">
      <div className="p-5 border-b border-[#ECE8E1] bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-[#FAF2EB] text-[#967259]">
            <Dices className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <span className="text-[11px] font-semibold text-[#967259] uppercase tracking-wider block">
              Генератор миттєвого затишку
            </span>
            <h3 className="font-serif text-lg font-medium text-[#2C2C2C]">Здивуй мене: випадкова ідея</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-stone-100 rounded-full text-stone-500 transition-colors"
          aria-label="Закрити"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-6 space-y-5 overflow-y-auto" aria-live="polite">
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500 font-medium">{currentIdea.zoneHint}</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              currentIdea.isFree ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {currentIdea.estimatedBudget}
          </span>
        </div>

        <h4 className="font-serif text-2xl font-normal text-[#2C2C2C] leading-snug">{currentIdea.title}</h4>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block mb-1">
              💡 Чому це працює:
            </span>
            <p className="text-stone-700 leading-relaxed">{currentIdea.whyItWorks}</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block mb-1">
              🛠️ Що потрібно:
            </span>
            <p className="text-stone-700 leading-relaxed">{currentIdea.whatYouNeed}</p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-white border-t border-[#ECE8E1] flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={rollNextIdea}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#FAF2EB] hover:bg-[#F2E5D5] text-[#967259] font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 border border-[#E8D4C0]"
        >
          <Dices className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Ще одна ідея</span>
        </button>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSaveIdea(currentIdea)}
            aria-pressed={saved}
            className={`flex-1 sm:flex-none px-4 py-2.5 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              saved ? 'bg-[#967259] text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
            <span>{saved ? 'Ідею збережено ✓' : 'Зберегти ідею'}</span>
          </button>
          <button
            type="button"
            onClick={() => onTryToday(currentIdea)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#2C2C2C] hover:bg-[#444] text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Спробувати сьогодні</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
