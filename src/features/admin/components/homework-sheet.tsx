import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { useHomeworkForm } from '../hooks/use-homework-form';
import type { HomeworkDoc } from '../../../database/types';
import { TargetPicker } from './targeting/target-picker';

// ============================================================
// Types
// ============================================================

interface HomeworkSheetProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  pairNumber: number;
  subjectId: string;
  subjectName: string;
  existing?: HomeworkDoc | null;
}

const DAY_NAMES: Record<number, string> = {
  0: 'вс', 1: 'пн', 2: 'вт', 3: 'ср', 4: 'чт', 5: 'пт', 6: 'сб',
};

function formatDateLabel(date: Date): string {
  const day = DAY_NAMES[date.getDay()] ?? '';
  return `${day}, ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============================================================
// Component
// ============================================================

export function HomeworkSheet({
  open,
  onClose,
  date,
  pairNumber,
  subjectId,
  subjectName,
  existing,
}: HomeworkSheetProps) {
  const { fields, setField, submit, remove, isValid, loading, isEditMode, error } = useHomeworkForm({
    subjectId,
    date: toISODate(date),
    pairNumber,
    existing,
    onSuccess: onClose,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (open) {
      // Delay to allow animation
      requestAnimationFrame(autoResize);
    }
  }, [open, autoResize]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Редактировать ДЗ' : 'Домашнее задание'}
      maxHeight="92dvh"
      footer={
        <div className="flex flex-col gap-2">
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 leading-snug">
              {error}
            </p>
          )}
          <button
            onClick={submit}
            disabled={!isValid || loading}
            className="w-full p-3 rounded-xl bg-blue-500 text-white font-medium text-sm disabled:opacity-40 active:opacity-80 transition-opacity"
          >
            {loading ? 'Сохранение…' : 'Сохранить'}
          </button>
          {isEditMode && (
            confirmDelete ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 p-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 active:opacity-70 transition-opacity"
                >
                  Отмена
                </button>
                <button
                  onClick={remove}
                  disabled={loading}
                  className="flex-1 p-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 active:opacity-70 transition-opacity disabled:opacity-40"
                >
                  Подтвердить
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full p-2.5 rounded-xl text-sm font-medium text-red-500 active:opacity-70 transition-opacity"
              >
                Удалить задание
              </button>
            )
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Context */}
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatDateLabel(date)} · {pairNumber} пара
          </p>
          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
            {subjectName}
          </p>
        </div>

        {/* Content */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
            Задание
          </label>
          <textarea
            ref={textareaRef}
            className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 resize-none leading-relaxed"
            placeholder="Введите домашнее задание…"
            rows={4}
            value={fields.content}
            onChange={(e) => {
              setField('content', e.target.value);
              autoResize();
            }}
          />
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            Markdown: **жирный**, *курсив*, - списки, [ссылка](url)
          </p>
        </div>

        {/* Advanced settings */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 active:opacity-70 transition-opacity"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
          Расширенные настройки
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-3 pl-2 border-l-2 border-neutral-200 dark:border-neutral-700">
            <TargetPicker
              dense
              value={fields.targetSubgroupIds}
              onChange={(ids) => setField('targetSubgroupIds', ids)}
            />
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
