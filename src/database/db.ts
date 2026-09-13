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
 */
const widenedPairRange: MigrationStrategies = {
  1: (doc) => doc,
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
    schedule: { schema: schemas.schedule, migrationStrategies: widenedPairRange },
    overrides: { schema: schemas.overrides, migrationStrategies: widenedPairRange },
    events: { schema: schemas.events, migrationStrategies: widenedPairRange },
    deadlines: { schema: schemas.deadlines },
    students: { schema: schemas.students },
    semester: { schema: schemas.semester },
    homeworks: { schema: schemas.homeworks, migrationStrategies: widenedPairRange },
  });

  console.log('[DB] Database initialized with collections:', Object.keys(db.collections));

  return db;
}