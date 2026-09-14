import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useDatabase } from '../../app/providers/DatabaseProvider';
import { useRxCollection } from '../../database/hooks/use-rx-collection';
import type { SubgroupCategoryDoc, SubgroupDoc } from '../../database/types';
import { buildSubgroupIndex } from '../../shared/targeting/match';
import type { SubgroupIndex } from '../../shared/targeting/types';

interface SubgroupsContextValue {
  /** Проиндексированные категории и подгруппы для чистых функций из shared/targeting */
  index: SubgroupIndex;
  /** Сырые документы — нужны админке (code, created_at и т.п.) */
  categories: SubgroupCategoryDoc[];
  subgroups: SubgroupDoc[];
  loading: boolean;
}

const SubgroupsContext = createContext<SubgroupsContextValue | null>(null);

/**
 * Держит актуальный список категорий и подгрупп.
 *
 * Стоит выше развилки роутов: список нужен и студенту (фильтрация + экран
 * настройки), и админке (формы, детектор конфликтов, бейджи).
 */
export function SubgroupsProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();

  const { data: allCategories, loading: categoriesLoading } =
    useRxCollection<SubgroupCategoryDoc>(db.subgroup_categories);
  const { data: allSubgroups, loading: subgroupsLoading } =
    useRxCollection<SubgroupDoc>(db.subgroups);

  const value = useMemo<SubgroupsContextValue>(() => {
    const categories = allCategories.filter((c) => !c.is_deleted);
    const subgroups = allSubgroups.filter((s) => !s.is_deleted);

    return {
      index: buildSubgroupIndex(categories, subgroups),
      categories,
      subgroups,
      loading: categoriesLoading || subgroupsLoading,
    };
  }, [allCategories, allSubgroups, categoriesLoading, subgroupsLoading]);

  return (
    <SubgroupsContext.Provider value={value}>
      {children}
    </SubgroupsContext.Provider>
  );
}

export function useSubgroups(): SubgroupsContextValue {
  const ctx = useContext(SubgroupsContext);
  if (!ctx) {
    throw new Error('useSubgroups() must be used within <SubgroupsProvider>');
  }
  return ctx;
}
