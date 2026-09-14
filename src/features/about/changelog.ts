export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.2',
    date: '14.09.2026',
    changes: [
      'Приложение адаптировано под расписание третьего семестра',
      'Полностью переработана система подгрупп',
      'Исправлена зона действия жеста перехода на расписание сегодняшнего дня',
      'Добавлена шторка "Что нового?" после обновления приложения',
      'Добавлена функция копирования домашнего задания',
      'Временно скрыта секция с информацией о преподавателях кафедры',
    ],
  },
];

export function findChangelogEntry(version: string): ChangelogEntry | undefined {
  return CHANGELOG.find((entry) => entry.version === version);
}
