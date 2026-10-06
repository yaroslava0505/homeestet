import { useEffect, useId, useRef, useState } from 'react';
import { X, Camera, ArrowRight, UploadCloud, Info } from 'lucide-react';
import type { PageView } from '../types.ts';
import { Modal } from './Modal.tsx';

interface PhotoAIAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: PageView) => void;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/**
 * Photo analysis is not connected to a model yet. This dialog lets the user pick a photo
 * (validated and previewed locally, nothing is uploaded) and shows an honest "coming soon" status
 * with an example of what the report will contain. It never presents a fake result as real.
 */
export function PhotoAIAnalyzerModal({ isOpen, onClose, onNavigate }: PhotoAIAnalyzerModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      setFileName(null);
      setError(null);
    }
  }, [isOpen]);

  const handleFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
      setError('Підтримуються лише JPG, PNG, WebP або HEIC.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Файл завеликий: максимум 5 МБ.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
  };

  const handleGoToZoneBuilder = () => {
    onClose();
    onNavigate({ type: 'zone-builder' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Аналіз фото кімнати" panelClassName="max-w-2xl">
      <div className="p-5 border-b border-[#ECE8E1] bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-[#FAF2EB] text-[#967259]">
            <Camera className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <span className="text-[11px] font-semibold text-[#967259] uppercase tracking-wider block">HomeEstet</span>
            <h3 className="font-serif text-lg sm:text-xl font-medium text-[#2C2C2C]">Аналіз фото кімнати</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-stone-100 rounded-full text-stone-500"
          aria-label="Закрити"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto space-y-5">
        <div
          role="status"
          className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2 leading-relaxed"
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
          <span>
            <strong>Автоматичний аналіз фото готується.</strong> Зараз функція працює в демо-режимі: ви можете обрати
            фото і подивитися, як виглядатиме звіт. Фото нікуди не надсилається і не аналізується.
          </span>
        </div>

        <div>
          <label
            htmlFor={inputId}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              handleFile(event.dataTransfer.files?.[0]);
            }}
            className={`block border-2 border-dashed p-6 rounded-xl text-center cursor-pointer transition-all group ${
              dragging ? 'border-[#967259] bg-white' : 'border-[#D5CBB9] hover:border-[#967259] bg-white/80 hover:bg-white'
            }`}
          >
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            {previewUrl ? (
              <span className="block">
                <img src={previewUrl} alt="Попередній перегляд обраного фото" className="max-h-56 mx-auto rounded-lg object-contain" />
                <span className="text-xs text-stone-500 mt-2 block truncate">{fileName}</span>
                <span className="text-xs text-[#967259] font-medium mt-1 block">Обрати інше фото</span>
              </span>
            ) : (
              <span className="block">
                <UploadCloud className="w-10 h-10 text-stone-400 group-hover:text-[#967259] mx-auto mb-2 transition-colors" aria-hidden="true" />
                <span className="font-medium text-sm text-stone-800 block">Перетягніть фото кімнати або натисніть, щоб обрати</span>
                <span className="text-xs text-stone-500 mt-1 block">JPG, PNG, WebP або HEIC до 5 МБ</span>
              </span>
            )}
          </label>
          {error && (
            <p role="alert" className="text-xs text-red-700 mt-2">
              {error}
            </p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Що міститиме звіт</h4>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
              Приклад, не результат
            </span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-stone-700 list-disc pl-4">
            <li>Тип зони та поточний стиль</li>
            <li>Палітра кольорів і матеріали</li>
            <li>Рівень візуального шуму</li>
            <li>Проблемні місця на фото</li>
            <li>Що прибрати і що переставити</li>
            <li>Що можна додати з наявного</li>
            <li>Що варто докупити</li>
            <li>Орієнтовний бюджет</li>
          </ul>
        </div>

        <div className="pt-1">
          <p className="text-xs text-stone-600 mb-2">
            Поки аналіз фото готується, готове рішення можна отримати за 5 кроків: оберіть зону, стиль, настрій і бюджет.
          </p>
          <button
            type="button"
            onClick={handleGoToZoneBuilder}
            className="w-full py-3.5 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Зробити цю зону за готовим планом HomeEstet</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
