import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { schemas } from './schemas';
import type { AppDatabase } from './types';
import type { MigrationStrategies, RxStorage } from 'rxdb';

addRxPlugin(RxDBMigrationSchemaPlugin);

/**
 * v0 → v1: расширен допустимый диапазон pair_number (5 → 8 пар).
 * Сами документы не меняются — локальная база лишь кэш Supabase.
 *
 * → v2: тройка target_language / target_eng_subgroup / target_oit_subgroup
 * заменена на target_subgroup_ids. Старые документы выбрасываются (стратегия
 * возвращает null): перенацелить их на новые подгруппы невозможно, а локальная
 * база — только кэш. Взамен LAST_SYNC_KEY в sync-engine поднят, так что при
 * первом запуске после обновления происходит полный pull.
 */
const dropLegacyTargets: MigrationStrategies = {
  1: (doc) => doc,
  2: () => null,
};

/** Коллекции, у которых тройка появилась уже после v0. */
const dropLegacyTargetsFromV0: MigrationStrategies = {
  1: () => null,
};

let dbPromise: Promise<AppDatabase> | null = null;

export function getDatabase(): Promise<AppDatabase> {
  if (!dbPromise) {
    dbPromise = createDatabase();
  }
  return dbPromise;
}

async function createDatabase(): Promise<AppDatabase> {
  let storage: RxStorage<any, any> = getRxStorageDexie();

  if (import.meta.env.DEV) {
    const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
    addRxPlugin(RxDBDevModePlugin);

    const { wrappedValidateAjvStorage } = await import('rxdb/plugins/validate-ajv');
    storage = wrappedValidateAjvStorage({ storage });
  }

  const db = await createRxDatabase<AppDatabase>({
    name: 'studhub',
    storage,
  });

  await db.addCollections({
    subjects: { schema: schemas.subjects },
    teachers: { schema: schemas.teachers },
    subgroup_categories: { schema: schemas.subgroup_categories },
    subgroups: { schema: schemas.subgroups },
    schedule: { schema: schemas.schedule, migrationStrategies: dropLegacyTargets },
    overrides: { schema: schemas.overrides, migrationStrategies: dropLegacyTargets },
    events: { schema: schemas.events, migrationStrategies: dropLegacyTargets },
    deadlines: { schema: schemas.deadlines, migrationStrategies: dropLegacyTargetsFromV0 },
    students: { schema: schemas.students, migrationStrategies: dropLegacyTargetsFromV0 },
    semester: { schema: schemas.semester },
    homeworks: { schema: schemas.homeworks, migrationStrategies: dropLegacyTargets },
  });

  console.log('[DB] Database initialized with collections:', Object.keys(db.collections));

  return db;
}