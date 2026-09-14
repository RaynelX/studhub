import { useCallback, useEffect, useState } from 'react';
import { SETTINGS_STORAGE_KEY } from '../../settings/storage';
import { findChangelogEntry, type ChangelogEntry } from '../changelog';

const STORAGE_KEY = 'student_hub_seen_version-01';

function readKey(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSeenVersion(version: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, version);
  } catch {
    // localStorage недоступен (приватный режим) — просто покажем шторку снова
  }
}

// Снимки снимаются при импорте модуля, т.е. на старте приложения — до того как
// SettingsSetup успеет записать настройки. Иначе на свежей установке мы бы приняли
// новичка за вернувшегося пользователя и показали ему шторку.
const SEEN_VERSION_AT_BOOT = readKey(STORAGE_KEY);
const HAD_SETTINGS_AT_BOOT = readKey(SETTINGS_STORAGE_KEY) !== null;

const CURRENT_ENTRY = findChangelogEntry(__APP_VERSION__);

/** Первый запуск после установки: показывать «что нового» новичку незачем */
const IS_FRESH_INSTALL = SEEN_VERSION_AT_BOOT === null && !HAD_SETTINGS_AT_BOOT;

const ALREADY_SEEN = SEEN_VERSION_AT_BOOT === __APP_VERSION__;

// Все входные данные константны, поэтому решение принимается один раз на старте.
// `!CURRENT_ENTRY` — версию подняли, а запись в CHANGELOG забыли добавить.
const SHOULD_OPEN = !ALREADY_SEEN && !IS_FRESH_INSTALL && CURRENT_ENTRY !== undefined;

/** Версию нужно отметить как просмотренную, хотя шторку мы не показываем */
const NEEDS_SILENT_RECORD = !ALREADY_SEEN && !SHOULD_OPEN;

interface WhatsNew {
  /** Запись changelog для текущей версии, если она есть */
  entry: ChangelogEntry | undefined;
  open: boolean;
  dismiss: () => void;
}

export function useWhatsNew(): WhatsNew {
  const [open, setOpen] = useState(SHOULD_OPEN);

  useEffect(() => {
    if (NEEDS_SILENT_RECORD) writeSeenVersion(__APP_VERSION__);
  }, []);

  // Версию запоминаем при закрытии, а не при показе: если пользователь закрыл
  // вкладку, не дочитав, шторка вернётся при следующем запуске.
  const dismiss = useCallback(() => {
    writeSeenVersion(__APP_VERSION__);
    setOpen(false);
  }, []);

  return { entry: CURRENT_ENTRY, open, dismiss };
}
