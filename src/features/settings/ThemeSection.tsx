import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Section } from '../../shared/ui/Section';

type Theme = 'light' | 'dark' | 'system';

const THEMES: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Светлая' },
  { value: 'dark', icon: Moon, label: 'Тёмная' },
  { value: 'system', icon: Monitor, label: 'Системная' },
];

export function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <Section title="Тема">
      <div className="flex gap-2">
        {THEMES.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-colors ${
              theme === value
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>
    </Section>
  );
}