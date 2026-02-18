import { useSettings } from './SettingsProvider';

export function ResetButton() {
  const { resetSettings } = useSettings();

  const handleReset = () => {
    if (confirm('Сбросить все настройки? Вы вернётесь на экран первоначальной настройки.')) {
      resetSettings();
    }
  };

  return (
    <div className="pt-2 pb-8">
      <button
        onClick={handleReset}
        className="w-full py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 active:bg-red-100 dark:active:bg-red-950/50 transition-colors"
      >
        Сбросить настройки
      </button>
    </div>
  );
}