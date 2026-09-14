import { useSubgroups } from '../../../targeting/SubgroupsProvider';
import {
  idsFromSelection,
  pruneSelection,
  selectionFromIds,
  subgroupsOf,
  visibleCategories,
} from '../../../../shared/targeting/match';

interface StudentSubgroupPickerProps {
  /** Подгруппы студента — по одной на категорию */
  value: string[];
  onChange: (subgroupIds: string[]) => void;
}

/**
 * Выбор подгрупп конкретного студента: ровно одна подгруппа в каждой
 * видимой категории. Отличается от TargetPicker, где запись нацеливается
 * на произвольный набор подгрупп.
 */
export function StudentSubgroupPicker({ value, onChange }: StudentSubgroupPickerProps) {
  const { index } = useSubgroups();

  const selection = selectionFromIds(value, index);
  const categories = visibleCategories(index, selection);

  if (categories.length === 0) {
    return (
      <p className="text-sm text-neutral-400 dark:text-neutral-500">
        Подгруппы не заведены
      </p>
    );
  }

  const select = (categoryId: string, subgroupId: string) => {
    const next = { ...selection, [categoryId]: subgroupId };
    onChange(idsFromSelection(pruneSelection(index, next)));
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const subgroups = subgroupsOf(index, category.id);
        if (subgroups.length === 0) return null;

        return (
          <div key={category.id}>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {category.name}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {subgroups.map((subgroup) => (
                <button
                  key={subgroup.id}
                  type="button"
                  onClick={() => select(category.id, subgroup.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    selection[category.id] === subgroup.id
                      ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-300'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  {subgroup.name}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
