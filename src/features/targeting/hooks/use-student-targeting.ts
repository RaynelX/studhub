import { useMemo } from 'react';
import { useSubgroups } from '../SubgroupsProvider';
import { useSettings } from '../../settings/SettingsProvider';
import { createStudentPredicate } from '../../../shared/targeting/match';
import type { StudentPredicate, SubgroupIndex } from '../../../shared/targeting/types';

interface StudentTargeting {
  /** «Эта запись предназначена текущему студенту» — единственный фильтр подгрупп в приложении */
  isForStudent: StudentPredicate;
  index: SubgroupIndex;
}

/**
 * Связывает выбор подгрупп студента с индексом категорий.
 * Заменяет собой десяток копий бывшей функции isForStudent.
 */
export function useStudentTargeting(): StudentTargeting {
  const { index } = useSubgroups();
  const { settings } = useSettings();

  const isForStudent = useMemo(
    () => createStudentPredicate(settings.subgroups, index),
    [settings.subgroups, index],
  );

  return { isForStudent, index };
}
