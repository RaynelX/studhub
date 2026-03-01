import type { WeekParity } from '../../../database/types';
import { addDays, getMonday, getWeekParity, toISODate } from '../../schedule/utils/week-utils';

/**
 * Вычисляет дату конца курса по количеству занятий.
 *
 * @param startDate — дата (ISO), с которой начинаем считать
 * @param dayOfWeek — день недели (1=Пн .. 6=Сб)
 * @param weekParity — чётность: 'all' (каждую неделю), 'odd', 'even'
 * @param pairCount — сколько раз должна пройти пара
 * @param oddWeekStart — ISO-дата понедельника первой нечётной недели семестра
 * @returns ISO date строка — дата последнего занятия
 */
export function calculateEndDate(
  startDate: string,
  dayOfWeek: number,
  weekParity: WeekParity,
  pairCount: number,
  oddWeekStart: string,
): string {
  const dates = generateScheduleDates(startDate, dayOfWeek, weekParity, pairCount, oddWeekStart);
  return dates[dates.length - 1];
}

/**
 * Генерирует список дат, на которые попадают занятия.
 *
 * @returns массив ISO date строк длиной `pairCount`
 */
export function generateScheduleDates(
  startDate: string,
  dayOfWeek: number,
  weekParity: WeekParity,
  pairCount: number,
  oddWeekStart: string,
): string[] {
  if (pairCount <= 0) return [];

  const dates: string[] = [];

  // Ищем первый день недели >= startDate, совпадающий по dayOfWeek
  let cursor = findFirstOccurrence(startDate, dayOfWeek);

  // Ограничение: не более 200 итераций (≈4 года)
  const MAX_ITERATIONS = 200;
  let iterations = 0;

  while (dates.length < pairCount && iterations < MAX_ITERATIONS) {
    const parity = getWeekParity(cursor, oddWeekStart);
    const matches =
      weekParity === 'all' || weekParity === parity;

    if (matches && toISODate(cursor) >= startDate) {
      dates.push(toISODate(cursor));
    }

    // Шаг: +1 неделя (если all) или +1 неделя (и следующая итерация проверит чётность)
    cursor = addDays(cursor, 7);
    iterations++;
  }

  return dates;
}

/**
 * Считает сколько оставшихся занятий от текущей даты до конца курса.
 */
export function countRemainingPairs(
  today: string,
  dateTo: string,
  dayOfWeek: number,
  weekParity: WeekParity,
  oddWeekStart: string,
): number {
  if (today > dateTo) return 0;

  let cursor = findFirstOccurrence(today, dayOfWeek);
  let count = 0;
  const MAX_ITERATIONS = 200;
  let iterations = 0;

  while (toISODate(cursor) <= dateTo && iterations < MAX_ITERATIONS) {
    if (toISODate(cursor) >= today) {
      const parity = getWeekParity(cursor, oddWeekStart);
      if (weekParity === 'all' || weekParity === parity) {
        count++;
      }
    }
    cursor = addDays(cursor, 7);
    iterations++;
  }

  return count;
}

/**
 * Зная дату начала, возвращает количество пар от date_from до date_to.
 */
export function countTotalPairs(
  dateFrom: string,
  dateTo: string,
  dayOfWeek: number,
  weekParity: WeekParity,
  oddWeekStart: string,
): number {
  return countRemainingPairs(dateFrom, dateTo, dayOfWeek, weekParity, oddWeekStart);
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * Находит ближайший день >= anchorDate, попадающий на dayOfWeek (1=Пн .. 6=Сб).
 */
function findFirstOccurrence(anchorDate: string, dayOfWeek: number): Date {
  const monday = getMonday(new Date(anchorDate + 'T00:00:00'));
  const target = addDays(monday, dayOfWeek - 1);

  // Если target < anchorDate, переходим на следующую неделю
  if (toISODate(target) < anchorDate) {
    return addDays(target, 7);
  }
  return target;
}
