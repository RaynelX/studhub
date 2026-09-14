import { useSubgroups } from '../../../targeting/SubgroupsProvider';
import { subgroupsOf } from '../../../../shared/targeting/match';

interface TargetPickerProps {
  /** id выбранных подгрупп; пустой массив — запись для всей группы */
  value: string[];
  onChange: (targetSubgroupIds: string[]) => void;
  /** Плотная раскладка для мобильных шитов */
  dense?: boolean;
}

/**
 * Единственный способ нацелить запись на подгруппы — один ряд пилюль на категорию.
 * Используется и в мобильных шитах, и в десктопных формах админки.
 *
 * Внутри категории можно выбрать несколько подгрупп (пара сразу для двух),
 * «Все» означает, что категория запись не ограничивает.
 */
export function TargetPicker({ value, onChange, dense = false }: TargetPickerProps) {
  const { index } = useSubgroups();
  const categories = index.activeCategories;

  const labelClass = dense
    ? 'text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'
    : 'text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1.5 block';

  if (categories.length === 0) {
    return (
      <p className="text-xs text-neutral-400 dark:text-neutral-500">
        Подгруппы не заведены — запись увидит вся группа
      </p>
    );
  }

  const toggle = (subgroupId: string) => {
    onChange(
      value.includes(subgroupId)
        ? value.filter((id) => id !== subgroupId)
        : [...value, subgroupId],
    );
  };

  const clearCategory = (categoryId: string) => {
    onChange(
      value.filter((id) => index.subgroupById.get(id)?.category_id !== categoryId),
    );
  };

  // Ссылки на подгруппы, которых больше нет в справочнике: такую запись
  // не увидит никто, поэтому показываем явно и даём снять.
  const orphanIds = value.filter((id) => !index.subgroupById.has(id));

  return (
    <div className={dense ? 'flex flex-col gap-3' : 'flex flex-col gap-4'}>
      {categories.map((category) => {
        // Архивную подгруппу показываем, только если она уже выбрана в этой записи.
        const subgroups = subgroupsOf(index, category.id, true).filter(
          (s) => !s.is_archived || value.includes(s.id),
        );
        if (subgroups.length === 0) return null;

        const selectedHere = subgroups.filter((s) => value.includes(s.id));

        return (
          <div key={category.id}>
            <label className={labelClass}>{category.name}</label>
            <div className="flex gap-1.5 flex-wrap">
              <Pill
                active={selectedHere.length === 0}
                dense={dense}
                onClick={() => clearCategory(category.id)}
              >
                Все
              </Pill>
              {subgroups.map((subgroup) => (
                <Pill
                  key={subgroup.id}
                  active={value.includes(subgroup.id)}
                  dense={dense}
                  onClick={() => toggle(subgroup.id)}
                >
                  {subgroup.short_name || subgroup.name}
                  {subgroup.is_archived && ' (архив)'}
                </Pill>
              ))}
            </div>
          </div>
        );
      })}

      {orphanIds.length > 0 && (
        <div>
          <label className={labelClass}>Удалённые подгруппы</label>
          <div className="flex gap-1.5 flex-wrap">
            {orphanIds.map((id) => (
              <Pill
                key={id}
                active
                dense={dense}
                onClick={() => onChange(value.filter((v) => v !== id))}
                tone="danger"
              >
                ? — снять
              </Pill>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({
  active,
  dense,
  tone = 'normal',
  onClick,
  children,
}: {
  active: boolean;
  dense: boolean;
  tone?: 'normal' | 'danger';
  onClick: () => void;
  children: React.ReactNode;
}) {
  const size = dense ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  const colors = active
    ? tone === 'danger'
      ? 'bg-red-500 text-white'
      : 'bg-blue-500 text-white'
    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300';

  return (
    <button type="button" onClick={onClick} className={`rounded-lg font-medium ${size} ${colors}`}>
      {children}
    </button>
  );
}
