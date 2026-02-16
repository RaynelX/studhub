import { useState } from 'react';
import type { StudentSettings } from './SettingsProvider';

interface Props {
  onComplete: (settings: StudentSettings) => void;
}

type Language = 'en' | 'de' | 'fr' | 'es';
type Subgroup = 'a' | 'b';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'Английский' },
  { value: 'de', label: 'Немецкий' },
  { value: 'fr', label: 'Французский' },
  { value: 'es', label: 'Испанский' },
];

export function SettingsSetup({ onComplete }: Props) {
  const [language, setLanguage] = useState<Language | null>(null);
  const [engSubgroup, setEngSubgroup] = useState<Subgroup | null>(null);
  const [oitSubgroup, setOitSubgroup] = useState<Subgroup | null>(null);

  const needsEngSubgroup = language === 'en';
  const canSubmit =
    language !== null &&
    (!needsEngSubgroup || engSubgroup !== null) &&
    oitSubgroup !== null;

  const handleSubmit = () => {
    if (!language || !oitSubgroup) return;
    onComplete({
      language,
      eng_subgroup: needsEngSubgroup ? engSubgroup : null,
      oit_subgroup: oitSubgroup,
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-black"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
      }}
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">StudHub</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            Настройте отображение расписания
          </p>
        </div>

        {/* Шаг 1: Язык */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Иностранный язык
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map(({ value, label }) => (
              <OptionButton
                key={value}
                selected={language === value}
                onClick={() => {
                  setLanguage(value);
                  if (value !== 'en') setEngSubgroup(null);
                }}
              >
                {label}
              </OptionButton>
            ))}
          </div>
        </fieldset>

        {/* Шаг 2: Подгруппа по англ. (только для англичан) */}
        {needsEngSubgroup && (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Подгруппа по англ. языку
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <OptionButton
                selected={engSubgroup === 'a'}
                onClick={() => setEngSubgroup('a')}
              >
                Ильюшенко
              </OptionButton>
              <OptionButton
                selected={engSubgroup === 'b'}
                onClick={() => setEngSubgroup('b')}
              >
                Гилевич
              </OptionButton>
            </div>
          </fieldset>
        )}

        {/* Шаг 3: Подгруппа по ОИТ */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Подгруппа по ОИТ
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <OptionButton
              selected={oitSubgroup === 'a'}
              onClick={() => setOitSubgroup('a')}
            >
              Войтешенко
            </OptionButton>
            <OptionButton
              selected={oitSubgroup === 'b'}
              onClick={() => setOitSubgroup('b')}
            >
              Левчук
            </OptionButton>
          </div>
        </fieldset>

        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
            canSubmit
              ? 'bg-blue-600 text-white active:bg-blue-700'
              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
          }`}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
        selected
          ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
          : 'border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 active:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}