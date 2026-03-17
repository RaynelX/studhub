import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Users, GraduationCap, Calendar, X } from 'lucide-react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { ENTRY_TYPE_LABELS } from '../../../shared/constants/admin-labels';
import { DAY_NAMES_SHORT } from '../../../shared/constants/days';

// ============================================================
// Types
// ============================================================

interface SearchResult {
  id: string;
  type: 'subject' | 'teacher' | 'student' | 'entry';
  label: string;
  detail?: string;
  route: string;
}

// ============================================================
// Component
// ============================================================

export function AdminSearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const db = useDatabase();
  const { data: subjects } = useRxCollection(db.subjects);
  const { data: teachers } = useRxCollection(db.teachers);
  const { data: students } = useRxCollection(db.students);
  const { data: entries } = useRxCollection(db.schedule);

  // Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setQuery('');
        setSelectedIdx(0);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Auto-focus input
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build search results
  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: SearchResult[] = [];

    // Subjects
    for (const s of subjects) {
      if (s.is_deleted) continue;
      if (s.name.toLowerCase().includes(q) || (s.short_name ?? '').toLowerCase().includes(q)) {
        items.push({
          id: s.id,
          type: 'subject',
          label: s.name,
          detail: s.short_name ?? undefined,
          route: '/admin/subjects',
        });
      }
    }

    // Teachers
    for (const t of teachers) {
      if (t.is_deleted) continue;
      if (
        t.full_name.toLowerCase().includes(q) ||
        (t.email ?? '').toLowerCase().includes(q)
      ) {
        items.push({
          id: t.id,
          type: 'teacher',
          label: t.full_name,
          detail: t.position ?? undefined,
          route: '/admin/teachers',
        });
      }
    }

    // Students
    for (const s of students) {
      if (s.is_deleted) continue;
      if (s.full_name.toLowerCase().includes(q)) {
        items.push({
          id: s.id,
          type: 'student',
          label: s.full_name,
          detail: `${s.language.toUpperCase()}${s.eng_subgroup ? ` / EN-${s.eng_subgroup.toUpperCase()}` : ''}`,
          route: '/admin/students',
        });
      }
    }

    // Schedule entries
    for (const e of entries) {
      if (e.is_deleted) continue;
      const subj = subjects.find((s) => s.id === e.subject_id);
      const subjName = subj?.name ?? subj?.short_name ?? '';
      if (subjName.toLowerCase().includes(q) || e.room?.toLowerCase().includes(q)) {
        items.push({
          id: e.id,
          type: 'entry',
          label: `${subjName} · ${ENTRY_TYPE_LABELS[e.entry_type] ?? e.entry_type}`,
          detail: `${DAY_NAMES_SHORT[e.day_of_week]} · ${e.pair_number} пара · ауд. ${e.room ?? '—'}`,
          route: '/admin/schedule',
        });
      }
    }

    return items.slice(0, 15);
  }, [query, subjects, teachers, students, entries]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      navigate(result.route);
    },
    [navigate],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      handleSelect(results[selectedIdx]);
    }
  }

  if (!open) return null;

  const TYPE_ICONS = {
    subject: BookOpen,
    teacher: Users,
    student: GraduationCap,
    entry: Calendar,
  } as const;

  const TYPE_LABELS = {
    subject: 'Предмет',
    teacher: 'Преподаватель',
    student: 'Студент',
    entry: 'Расписание',
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Поиск предметов, преподавателей, студентов…"
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            ESC
          </kbd>
          <button
            onClick={() => setOpen(false)}
            className="sm:hidden p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <div className="py-8 text-center text-sm text-neutral-400">
              Ничего не найдено
            </div>
          )}

          {results.map((result, idx) => {
            const Icon = TYPE_ICONS[result.type];
            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  idx === selectedIdx
                    ? 'bg-blue-50 dark:bg-blue-950/50'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {result.label}
                  </div>
                  {result.detail && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {result.detail}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
                  {TYPE_LABELS[result.type]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        {!query.trim() && (
          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 flex items-center gap-4">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium">↑↓</kbd> навигация
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium">Enter</kbd> перейти
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium">Esc</kbd> закрыть
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
