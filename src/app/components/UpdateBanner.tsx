import { useExitTransition } from '../../shared/hooks/use-exit-transition';

interface Props {
  sw: {
    needRefresh: boolean;
    update: () => void;
    dismiss: () => void;
  };
}

export function UpdateBanner({ sw }: Props) {
  const { mounted, entering } = useExitTransition(sw.needRefresh, 350);

  if (!mounted) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-sm ${
        entering ? 'anim-banner-enter' : 'anim-banner-exit'
      }`}
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
    </div>
  );
}