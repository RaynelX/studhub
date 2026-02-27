import { useState, useEffect } from 'react';
import type { RxCollection, MangoQuery, RxDocument } from 'rxdb';

/**
 * Module-level cache: stores the last emitted data per collection+query.
 * When a component re-mounts (e.g. tab switch), it initialises from cache
 * instantly instead of showing "Загрузка…" for a render frame.
 */
const dataCache = new Map<string, unknown[]>();

function cacheKey(collectionName: string, queryKey: string): string {
  return `${collectionName}::${queryKey}`;
}

export function useRxCollection<T>(
  collection: RxCollection<T>,
  query?: MangoQuery<T>,
): { data: T[]; loading: boolean } {
  // Стабилизация: эффект перезапускается только при изменении
  // содержимого запроса, а не ссылки на объект
  const queryKey = JSON.stringify(query);
  const key = cacheKey(collection.name, queryKey);

  // Если в кеше уже есть данные — стартуем с них (loading: false)
  const cached = dataCache.get(key) as T[] | undefined;
  const [data, setData] = useState<T[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    // При смене коллекции/запроса пробуем подхватить кеш,
    // чтобы не мигать «Загрузка» при каждом переключении
    const hit = dataCache.get(key) as T[] | undefined;
    if (hit) {
      setData(hit);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const rxQuery = query
      ? collection.find(query)
      : collection.find();

    const sub = rxQuery.$.subscribe((results: RxDocument<T>[]) => {
      const items = results.map((doc) => doc.toMutableJSON());
      dataCache.set(key, items);
      setData(items);
      setLoading(false);
    });

    return () => sub.unsubscribe();
  }, [collection, key]);

  return { data, loading };
}