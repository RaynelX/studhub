import { motion, AnimatePresence } from 'motion/react';
import { BANNER_VARIANTS, SPRING_GENTLE } from '../../shared/constants/motion';

interface Props {
  sw: {
    needRefresh: boolean;
    update: () => void;
    dismiss: () => void;
  };
}

export function UpdateBanner({ sw }: Props) {
  return (
    <AnimatePresence>
      {sw.needRefresh && (
        <motion.div
          className="flex items-center justify-between gap-3 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-sm"
          variants={BANNER_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={SPRING_GENTLE}
        >
          <span>Доступно обновление</span>
          <div className="flex gap-2">
            <button
              onClick={sw.dismiss}
              className="px-3 py-1 rounded-lg text-blue-200 active:text-white transition-colors"
            >
              Позже
            </button>
            <button
              onClick={sw.update}
              className="px-3 py-1 rounded-lg bg-white text-blue-600 font-medium active:bg-blue-50 transition-colors"
            >
              Обновить
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}