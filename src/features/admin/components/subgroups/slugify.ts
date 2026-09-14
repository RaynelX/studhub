const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/**
 * Русское название → латинский слаг для стабильного кода подгруппы.
 * Код попадает в OneSignal-теги (sg_<code>), поэтому он должен пережить
 * переименование категории и не содержать ничего, кроме [a-z0-9_].
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .split('')
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

/** Добавляет числовой суффикс, пока код не станет уникальным. */
export function uniqueCode(base: string, taken: string[]): string {
  const fallback = base || 'sg';
  if (!taken.includes(fallback)) return fallback;

  for (let i = 2; i < 100; i++) {
    const candidate = `${fallback}_${i}`;
    if (!taken.includes(candidate)) return candidate;
  }

  return `${fallback}_${Date.now()}`;
}
