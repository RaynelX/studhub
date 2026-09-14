import { useSettings } from './SettingsProvider';
import { useSubgroups } from '../targeting/SubgroupsProvider';
import { subgroupsOf, visibleCategories } from '../../shared/targeting/match';
import { useTouchRipple } from '../../shared/hooks/use-touch-ripple';
import { Section } from '../../shared/ui/Section';

export function SettingsSection() {
  const { settings, updateSettings } = useSettings();
  const { index } = useSubgroups();

  // Условные категории показываются только при выполненном условии;
  // сам выбор подчищается в updateSettings через pruneSelection.
  const categories = visibleCategories(index, settings.subgroups);

  const selectSubgroup = (categoryId: string, subgroupId: string) => {
    updateSettings({
      subgroups: { ...settings.subgroups, [categoryId]: subgroupId },
    });
  };

  if (categories.length === 0) {
    return (
      <Section title="Подгруппы">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Староста ещё не завёл подгруппы на этот семестр.
        </p>
      </Section>
    );
  }

  return (
    <Section title="Подгруппы">
      <div className="space-y-4">
        {categories.map((category) => {
          const subgroups = subgroupsOf(index, category.id);
          if (subgroups.length === 0) return null;

          return (
            <div key={category.id}>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                {category.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {subgroups.map((subgroup) => (
                  <ToggleButton
                    key={subgroup.id}
                    active={settings.subgroups[category.id] === subgroup.id}
                    onClick={() => selectSubgroup(category.id, subgroup.id)}
                  >
                    {subgroup.name}
                  </ToggleButton>
                ))}
              </div>
            </div>
          );
        })}
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
  const rippleRef = useTouchRipple<HTMLButtonElement>({ stopPropagation: true });
  return (
    <button
      ref={rippleRef}
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
