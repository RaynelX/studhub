import { useEffect, useRef, type ReactNode } from 'react';
import { useExitTransition } from '../hooks/use-exit-transition';
import { useBottomSheetGesture } from '../hooks/use-bottom-sheet-gesture';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Sticky footer rendered below the scrollable content area */
  footer?: ReactNode;
}

export function BottomSheet({ open, onClose, title, children, footer }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { mounted, entering } = useExitTransition(open, 350);
  const { onTouchStart, onTouchMove, onTouchEnd } = useBottomSheetGesture({
    sheetRef,
    open,
    onClose,
  });

  // Закрытие по Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Блокировка скролла body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Reset sheet transform when re-opening
  useEffect(() => {
    if (open && sheetRef.current) {
      sheetRef.current.style.transform = '';
      sheetRef.current.style.transition = '';
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ height: '100dvh' }}>
      {/* Затемнение */}
      <div
        className={`absolute inset-0 bg-black/50 ${entering ? 'anim-backdrop-enter' : 'anim-backdrop-exit'}`}
        onClick={onClose}
      />

      {/* Шторка */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-2xl shadow-xl
                     max-h-[85dvh] flex flex-col ${entering ? 'anim-sheet-enter' : 'anim-sheet-exit'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Ручка */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing touch-none">
          <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div>

        {/* Заголовок */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-sm text-neutral-400 dark:text-neutral-500 active:text-neutral-600 transition-colors px-2 py-1"
            >
              Закрыть
            </button>
          </div>
        )}

        {/* Контент */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4" data-sheet-scroll>
          {children}
        </div>

        {/* Фиксированный футер */}
        {footer && (
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}