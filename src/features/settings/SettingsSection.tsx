import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from './SettingsProvider';
import { Section } from '../../shared/ui/Section';
import { EXPAND_VARIANTS, SPRING_SNAPPY } from '../../shared/constants/motion';

type Language = 'en' | 'de' | 'fr' | 'es';
type Subgroup = 'a' | 'b';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'Англ.' },
  { value: 'de', label: 'Нем.' },
  { value: 'fr', label: 'Фр.' },
  { value: 'es', label: 'Исп.' },
];

export function SettingsSection() {
  const { settings, updateSettings } = useSettings();

  const setLanguage = (lang: Language) => {
    updateSettings({
      ...settings,
      language: lang,
      eng_subgroup: lang === 'en' ? settings.eng_subgroup ?? 'a' : null,
    });
  };

  const setEngSubgroup = (sg: Subgroup) => {
    updateSettings({ ...settings, eng_subgroup: sg });
  };

  const setOitSubgroup = (sg: Subgroup) => {
    updateSettings({ ...settings, oit_subgroup: sg });
  };

  return (
    <Section title="Настройки">
      <div className="space-y-4">
        {/* Язык */}
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
            Иностранный язык
          </p>
          <div className="flex gap-2">
            {LANGUAGES.map(({ value, label }) => (
              <ToggleButton
                key={value}
                active={settings.language === value}
                onClick={() => setLanguage(value)}
              >
                {label}
              </ToggleButton>
            ))}
          </div>
        </div>

        {/* Подгруппа по англ. */}
        <AnimatePresence initial={false}>
          {settings.language === 'en' && (
            <motion.div
              variants={EXPAND_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={SPRING_SNAPPY}
              className="overflow-hidden"
            >
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                  Подгруппа по англ. языку
                </p>
                <div className="flex gap-2">
                  <ToggleButton
                    active={settings.eng_subgroup === 'a'}
                    onClick={() => setEngSubgroup('a')}
                  >
                    Ильюшенко
                  </ToggleButton>
                  <ToggleButton
                    active={settings.eng_subgroup === 'b'}
                    onClick={() => setEngSubgroup('b')}
                  >
                    Гилевич
                  </ToggleButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Подгруппа по ОИТ */}
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
            Подгруппа по ОИТ
          </p>
          <div className="flex gap-2">
            <ToggleButton
              active={settings.oit_subgroup === 'a'}
              onClick={() => setOitSubgroup('a')}
            >
              Войтешенко
            </ToggleButton>
            <ToggleButton
              active={settings.oit_subgroup === 'b'}
              onClick={() => setOitSubgroup('b')}
            >
              Левчук
            </ToggleButton>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700'
      }`}
    >
      {children}
    </button>
  );
}