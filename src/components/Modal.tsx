import { useEffect, useRef, type ReactNode, type MouseEvent } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  children: ReactNode;
  /** Classes for the panel (width, radius, layout). */
  panelClassName?: string;
  /** Vertical placement of the panel. */
  align?: 'center' | 'top';
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal shell shared by every dialog in the app:
 * Escape and backdrop click close it, focus moves inside and is trapped, body scroll is locked,
 * focus returns to the opener on close.
 */
export function Modal({ isOpen, onClose, label, children, panelClassName = '', align = 'center' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    openerRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? panel)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab' && panel) {
        const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center p-4 bg-black/60 backdrop-blur-xs ${
        align === 'top' ? 'items-start pt-16 sm:pt-24' : 'items-center'
      }`}
      onClick={onBackdropClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`bg-[#FAF8F5] w-full rounded-2xl overflow-hidden shadow-2xl border border-[#DCD5C9] flex flex-col max-h-[90vh] focus:outline-none ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
