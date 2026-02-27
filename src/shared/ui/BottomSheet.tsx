import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'motion/react';
import {
  BACKDROP_VARIANTS,
  SHEET_VARIANTS,
  SPRING_GENTLE,
  TWEEN_FAST,
} from '../constants/motion';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

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

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const sheetHeight = sheetRef.current?.offsetHeight ?? 400;
    if (info.velocity.y > 300 || info.offset.y > sheetHeight * 0.4) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" style={{ height: '100dvh' }}>
          {/* Затемнение */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            variants={BACKDROP_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TWEEN_FAST}
            onClick={onClose}
          />

          {/* Шторка */}
          <motion.div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-2xl shadow-xl
                       max-h-[85dvh] flex flex-col"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            variants={SHEET_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={SPRING_GENTLE}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            {/* Ручка */}
            <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
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
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}