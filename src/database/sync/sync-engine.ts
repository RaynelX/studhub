import { BehaviorSubject } from 'rxjs';
import { supabase } from '../../lib/supabase';
import type { AppDatabase } from '../types';

// ============================================================
// Типы
// ============================================================

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'success' | 'error' | 'offline';
  lastSyncAt: string | null;
  error?: string;
}

interface CollectionSyncConfig {
  /** Имя коллекции в RxDB */
  rxdbName: keyof AppDatabase['collections'];
  /** Имя таблицы в Supabase */
  supabaseTable: string;
  /** Есть ли поле is_deleted */
  hasIsDeleted: boolean;
  /**
   * Справочник, который не меняется неделями: тянется не чаще, чем раз в N мс,
   * и ведёт собственную отметку времени. Глобальную использовать нельзя —
   * она двигается на каждой синхронизации, и пропущенные из-за интервала
   * изменения навсегда остались бы за её границей.
   *
   * Ручной триггер (админка после записи) обходит интервал: sync({ force: true }).
   */
  syncIntervalMs?: number;
}

/** Сутки — интервал для справочников, статичных в течение семестра. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ============================================================
// Конфигурация: маппинг коллекций на таблицы
// ============================================================

// Категории и подгруппы идут первыми: без них остальные коллекции
// невозможно отфильтровать по подгруппе студента.
const SYNC_CONFIGS: CollectionSyncConfig[] = [
  { rxdbName: 'subgroup_categories', supabaseTable: 'subgroup_categories', hasIsDeleted: true },
  { rxdbName: 'subgroups', supabaseTable: 'subgroups',          hasIsDeleted: true },
  { rxdbName: 'semester',  supabaseTable: 'semester_config',    hasIsDeleted: false },
  { rxdbName: 'subjects',  supabaseTable: 'subjects',           hasIsDeleted: true },
  // Кафедры — раньше преподавателей: преподаватели на них ссылаются.
  { rxdbName: 'departments', supabaseTable: 'departments',      hasIsDeleted: true, syncIntervalMs: ONE_DAY_MS },
  { rxdbName: 'teachers',  supabaseTable: 'teachers',           hasIsDeleted: true },
  { rxdbName: 'students',  supabaseTable: 'students',           hasIsDeleted: true },
  { rxdbName: 'schedule',  supabaseTable: 'schedule_entries',   hasIsDeleted: true },
  { rxdbName: 'overrides', supabaseTable: 'schedule_overrides', hasIsDeleted: true },
  { rxdbName: 'events',    supabaseTable: 'events',             hasIsDeleted: true },
  { rxdbName: 'deadlines', supabaseTable: 'deadlines',          hasIsDeleted: true },
  { rxdbName: 'homeworks', supabaseTable: 'homeworks',           hasIsDeleted: true },
];

// Версия ключа поднята с -02: при переходе на гибкие подгруппы миграция схем
// выбрасывает документы со старой тройкой target_*, поэтому каждому клиенту
// нужен одноразовый полный pull, а не инкрементальный.
const LAST_SYNC_KEY = 'student_hub_last_sync-03';

/** Собственная отметка коллекции с syncIntervalMs. */
function collectionSyncKey(rxdbName: string): string {
  return `student_hub_sync_${rxdbName}-01`;
}

// ============================================================
// Утилиты
// ============================================================

/**
 * Supabase возвращает null для пустых полей.
 * RxDB-схемы с type: 'string' не принимают null.
 * Удаляем null-значения — RxDB обработает их как отсутствующие (optional).
 */
function stripNulls(doc: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// ============================================================
// Класс SyncEngine
// ============================================================

export class SyncEngine {
  private db: AppDatabase;
  private isSyncing = false;

  public status$ = new BehaviorSubject<SyncStatus>({
    state: 'idle',
    lastSyncAt: this.getLastSyncAt(),
  });

  constructor(db: AppDatabase) {
    this.db = db;
  }

  // ----------------------------------------------------------
  // Публичный метод: запуск синхронизации
  // ----------------------------------------------------------

  /**
   * @param options.force — тянуть и те справочники, у которых ещё не истёк
   * собственный интервал (ручной триггер из админки после записи).
   */
  async sync(options?: { force?: boolean }): Promise<void> {
    const force = options?.force ?? false;

    if (this.isSyncing) {
      console.log('[Sync] Already syncing, skipping');
      return;
    }

    if (!navigator.onLine) {
      this.status$.next({
        state: 'offline',
        lastSyncAt: this.getLastSyncAt(),
      });
      return;
    }

    this.isSyncing = true;
    this.status$.next({
      state: 'syncing',
      lastSyncAt: this.getLastSyncAt(),
    });

    // Таймаут — если сеть есть, но сервер не отвечает
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Sync timeout')), 10_000),
    );

    try {
      const since = this.getLastSyncAt();
      const syncTimestamp = new Date().toISOString();

      if (since) {
        console.log(`[Sync] Catch-up sync since ${since}`);
      } else {
        console.log('[Sync] Initial sync (first launch)');
      }

      const allOk = await Promise.race([this.syncAllCollections(since, force), timeout]);

      // Timestamp двигаем только при полном успехе: иначе изменения, пропущенные
      // упавшей коллекцией, навсегда останутся за границей инкрементального pull.
      if (allOk) {
        this.setLastSyncAt(syncTimestamp);
      }

      this.status$.next({
        state: 'success',
        lastSyncAt: this.getLastSyncAt(),
      });
      console.log(
        allOk
          ? '[Sync] Completed successfully'
          : '[Sync] Completed with errors — timestamp not advanced, will retry in full',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Sync] Failed:', message);
      this.status$.next({
        state: 'error',
        lastSyncAt: this.getLastSyncAt(),
        error: message,
      });
    } finally {
      this.isSyncing = false;
    }
  }

  // ----------------------------------------------------------
  // Синхронизация всех коллекций
  // ----------------------------------------------------------

  /** @returns true, если все коллекции с общей отметкой синхронизировались без ошибок */
  private async syncAllCollections(since: string | null, force: boolean): Promise<boolean> {
    const errors: string[] = [];
    // Коллекции с собственным интервалом считаются отдельно: они не влияют
    // на глобальную отметку времени.
    let sharedCount = 0;

    for (const config of SYNC_CONFIGS) {
      if (config.syncIntervalMs !== undefined) {
        await this.syncThrottledCollection(config, force);
        continue;
      }

      sharedCount++;
      try {
        await this.syncCollection(config, since);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${config.rxdbName}: ${message}`);
        console.error(`[Sync] Error syncing ${config.rxdbName}:`, message);
      }
    }

    // Если ВСЕ коллекции упали — это критическая ошибка
    if (errors.length === sharedCount) {
      throw new Error(`All collections failed to sync`);
    }

    // Если часть упала — логируем, но не падаем
    if (errors.length > 0) {
      console.warn(`[Sync] Partial sync: ${errors.length} collection(s) failed`);
      return false;
    }

    return true;
  }

  // ----------------------------------------------------------
  // Справочник с собственным интервалом
  // ----------------------------------------------------------

  /**
   * Тянет коллекцию не чаще раза в syncIntervalMs, по собственной отметке.
   * Ни пропуск, ни ошибка не трогают глобальный watermark: у коллекции свой,
   * и при неудаче она просто повторит попытку в следующий раз.
   */
  private async syncThrottledCollection(
    config: CollectionSyncConfig,
    force: boolean,
  ): Promise<void> {
    const key = collectionSyncKey(config.rxdbName);
    const stored = localStorage.getItem(key);
    const lastSyncedAt = stored && !Number.isNaN(Date.parse(stored)) ? stored : null;

    if (!force && lastSyncedAt && Date.now() - Date.parse(lastSyncedAt) < config.syncIntervalMs!) {
      console.log(`[Sync] ${config.rxdbName}: skipped (throttled)`);
      return;
    }

    const syncTimestamp = new Date().toISOString();

    try {
      await this.syncCollection(config, lastSyncedAt);
      localStorage.setItem(key, syncTimestamp);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Sync] Error syncing ${config.rxdbName}:`, message);
    }
  }

  // ----------------------------------------------------------
  // Синхронизация одной коллекции
  // ----------------------------------------------------------

  private async syncCollection(
    config: CollectionSyncConfig,
    since: string | null,
  ): Promise<void> {
    const { rxdbName, supabaseTable, hasIsDeleted } = config;

    // Формируем запрос к Supabase
    let query = supabase.from(supabaseTable).select('*');

    if (since) {
      // Catch-up: всё, что изменилось после последней синхронизации
      query = query.gt('updated_at', since);
    } else if (hasIsDeleted) {
      // Initial: только неудалённые записи
      query = query.eq('is_deleted', false);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase query failed for ${supabaseTable}: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log(`[Sync] ${rxdbName}: no changes`);
      return;
    }

    // Разделяем на обновления и удаления
    const collection = this.db[rxdbName] as any;
    const toUpsert: Record<string, any>[] = [];
    const toRemove: string[] = [];

    for (const row of data) {
      if (hasIsDeleted && row.is_deleted) {
        toRemove.push(row.id);
      } else {
        toUpsert.push(stripNulls(row));
      }
    }

    // Применяем изменения в RxDB
    if (toUpsert.length > 0) {
      await collection.bulkUpsert(toUpsert);
    }

    if (toRemove.length > 0) {
      await collection.bulkRemove(toRemove).catch(() => {
        // Игнорируем ошибки удаления — документ мог не существовать в RxDB
      });
    }

    console.log(
      `[Sync] ${rxdbName}: ${toUpsert.length} upserted, ${toRemove.length} removed`,
    );
  }

  // ----------------------------------------------------------
  // localStorage: timestamp последней синхронизации
  // ----------------------------------------------------------

  private getLastSyncAt(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  }

  private setLastSyncAt(timestamp: string): void {
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  }
}