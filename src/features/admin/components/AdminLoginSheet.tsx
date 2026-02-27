import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { useAdmin } from '../AdminProvider';
import { FADE_SLIDE_VARIANTS, TWEEN_FAST } from '../../../shared/constants/motion';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AdminLoginSheet({ open, onClose }: Props) {
  const { signIn, error, loading } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    await signIn(email, password);
    if (!error) {
      setEmail('');
      setPassword('');
      onClose();
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Вход для старосты">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700
                       bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                       text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700
                       bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                       text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            placeholder="Пароль"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              className="text-sm text-red-600 dark:text-red-400"
              variants={FADE_SLIDE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={TWEEN_FAST}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
            loading || !email || !password
              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              : 'bg-blue-600 text-white active:bg-blue-700'
          }`}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </div>
    </BottomSheet>
  );
}