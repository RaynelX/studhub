import { AlertTriangle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  SubjectDoc,
  TeacherDoc,
  SemesterConfigDoc,
  ScheduleEntryDoc,
} from '../../../../database/types';
import { AdminModal } from '../ui/admin-modal';
import { useSchedulePlanner } from '../../hooks/use-schedule-planner';
import type { WizardStep1, WizardStep2 } from '../../hooks/use-schedule-planner';
import { DAY_NAMES } from '../../../../shared/constants/days';
import { BELL_SCHEDULE } from '../../../../shared/constants/bell-schedule';

// ============================================================
// Types
// ============================================================

interface CourseWizardProps {
  open: boolean;
  onClose: () => void;
  subjects: SubjectDoc[];
  teachers: TeacherDoc[];
  entries: ScheduleEntryDoc[];
  semesterConfig: SemesterConfigDoc | null;
  onSubmit: (data: ReturnType<ReturnType<typeof useSchedulePlanner>['getData']>) => void;
}

const STEP_LABELS = ['Что?', 'Когда?', 'Проверка'];

const ENTRY_TYPE_OPTIONS = [
  { value: 'lecture', label: 'Лекция' },
  { value: 'seminar', label: 'Семинар' },
  { value: 'practice', label: 'Практика' },
  { value: 'other', label: 'Другое' },
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'Все языки' },
  { value: 'en', label: 'Английский' },
  { value: 'de', label: 'Немецкий' },
  { value: 'fr', label: 'Французский' },
  { value: 'es', label: 'Испанский' },
] as const;

const PARITY_OPTIONS = [
  { value: 'all', label: 'Каждую неделю' },
  { value: 'odd', label: 'Нечётные' },
  { value: 'even', label: 'Чётные' },
] as const;

// ============================================================
// Component
// ============================================================

export function CourseWizard({
  open,
  onClose,
  subjects,
  teachers,
  entries,
  semesterConfig,
  onSubmit,
}: CourseWizardProps) {
  const planner = useSchedulePlanner(entries, semesterConfig);

  function handleClose() {
    planner.reset();
    onClose();
  }

  function handleSubmit() {
    onSubmit(planner.getData());
    handleClose();
  }

  const canProceed =
    (planner.step === 0 && planner.isStep1Valid) ||
    (planner.step === 1 && planner.isStep2Valid) ||
    planner.step === 2;

  return (
    <AdminModal
      open={open}
      onClose={handleClose}
      title="Добавить курс в расписание"
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {planner.step > 0 && (
              <button
                onClick={planner.goBack}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Отмена
            </button>
            {planner.step < 2 ? (
              <button
                onClick={planner.goNext}
                disabled={!canProceed}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Далее
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Check className="w-4 h-4" />
                Создать
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-neutral-200 dark:bg-neutral-700" />}
            <button
              onClick={() => {
                if (i < planner.step) planner.setStep(i);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === planner.step
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : i < planner.step
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer'
                    : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center bg-current/10 text-[10px]">
                {i + 1}
              </span>
              {label}
            </button>
          </div>
        ))}
      </div>

      {/* Step content */}
      {planner.step === 0 && (
        <Step1
          data={planner.step1}
          onChange={planner.setStep1}
          subjects={subjects}
          teachers={teachers}
        />
      )}
      {planner.step === 1 && (
        <Step2
          data={planner.step2}
          onChange={planner.setStep2}
          computedDateTo={planner.computedDateTo}
          computedPairCount={planner.computedPairCount}
        />
      )}
      {planner.step === 2 && (
        <StepReview
          planner={planner}
          subjects={subjects}
          teachers={teachers}
        />
      )}
    </AdminModal>
  );
}

// ============================================================
// Step 1: «Что?» — Subject, type, teacher, room, subgroups
// ============================================================

function Step1({
  data,
  onChange,
  subjects,
  teachers,
}: {
  data: WizardStep1;
  onChange: (d: WizardStep1) => void;
  subjects: SubjectDoc[];
  teachers: TeacherDoc[];
}) {
  function update<K extends keyof WizardStep1>(key: K, value: WizardStep1[K]) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-4">
      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Предмет *</label>
        <select
          value={data.subjectId}
          onChange={(e) => update('subjectId', e.target.value)}
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Выберите предмет</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Тип занятия</label>
        <div className="flex gap-2">
          {ENTRY_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update('entryType', opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                data.entryType === opt.value
                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Teacher */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Преподаватель *</label>
        <select
          value={data.teacherId}
          onChange={(e) => update('teacherId', e.target.value)}
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Выберите преподавателя</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Room */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Аудитория</label>
        <input
          type="text"
          value={data.room}
          onChange={(e) => update('room', e.target.value)}
          placeholder="Напр.: 305"
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Subgroup targeting */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Язык</label>
          <select
            value={data.targetLanguage}
            onChange={(e) => update('targetLanguage', e.target.value as WizardStep1['targetLanguage'])}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">EN подгруппа</label>
          <select
            value={data.targetEngSubgroup}
            onChange={(e) => update('targetEngSubgroup', e.target.value as WizardStep1['targetEngSubgroup'])}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все</option>
            <option value="a">A</option>
            <option value="b">B</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">ОИТ подгруппа</label>
          <select
            value={data.targetOitSubgroup}
            onChange={(e) => update('targetOitSubgroup', e.target.value as WizardStep1['targetOitSubgroup'])}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все</option>
            <option value="a">A</option>
            <option value="b">B</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 2: «Когда?» — Day, pair, parity, dates, smart count
// ============================================================

function Step2({
  data,
  onChange,
  computedDateTo,
  computedPairCount,
}: {
  data: WizardStep2;
  onChange: (d: WizardStep2) => void;
  computedDateTo: string;
  computedPairCount: number;
}) {
  function update<K extends keyof WizardStep2>(key: K, value: WizardStep2[K]) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-4">
      {/* Day of week */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">День недели</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <button
              key={d}
              onClick={() => update('dayOfWeek', d)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                data.dayOfWeek === d
                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {DAY_NAMES[d]?.slice(0, 2)}
            </button>
          ))}
        </div>
      </div>

      {/* Pair number */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Номер пары</label>
        <div className="flex gap-1.5">
          {BELL_SCHEDULE.map((bell) => (
            <button
              key={bell.pairNumber}
              onClick={() => update('pairNumber', bell.pairNumber)}
              className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                data.pairNumber === bell.pairNumber
                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <div className="font-medium">{bell.pairNumber}</div>
              <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{bell.startTime}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Week parity */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Чётность недели</label>
        <div className="flex gap-2">
          {PARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update('weekParity', opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                data.weekParity === opt.value
                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date from */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Дата начала</label>
        <input
          type="date"
          value={data.dateFrom}
          onChange={(e) => update('dateFrom', e.target.value)}
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Smart end date */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 bg-neutral-50 dark:bg-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Дата окончания</label>
          <label className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <input
              type="checkbox"
              checked={data.useAutoEndDate}
              onChange={(e) => update('useAutoEndDate', e.target.checked)}
              className="rounded border-neutral-300 dark:border-neutral-600"
            />
            Авто (по количеству пар)
          </label>
        </div>

        {data.useAutoEndDate ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Количество занятий</label>
              <input
                type="number"
                min={1}
                max={100}
                value={data.pairCount}
                onChange={(e) => update('pairCount', Number(e.target.value))}
                className="w-32 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {computedDateTo && (
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Последнее занятие: <span className="font-medium">{computedDateTo}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="date"
              value={data.dateTo}
              onChange={(e) => update('dateTo', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {computedPairCount > 0 && (
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Кол-во занятий: <span className="font-medium">{computedPairCount}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Step 3: Review
// ============================================================

function StepReview({
  planner,
  subjects,
  teachers,
}: {
  planner: ReturnType<typeof useSchedulePlanner>;
  subjects: SubjectDoc[];
  teachers: TeacherDoc[];
}) {
  const data = planner.getData();
  const subject = subjects.find((s) => s.id === data.subjectId);
  const teacher = teachers.find((t) => t.id === data.teacherId);
  const hasConflicts = planner.conflicts.length > 0;

  const entryTypeLabel =
    ENTRY_TYPE_OPTIONS.find((o) => o.value === data.entryType)?.label ?? data.entryType;

  return (
    <div className="space-y-4">
      {/* Conflicts warning */}
      {hasConflicts && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium mb-1">
              Обнаружены конфликты ({planner.conflicts.length})
            </div>
            {planner.conflicts.map((c, i) => (
              <div key={i} className="text-xs mt-1">{c.reason}</div>
            ))}
          </div>
        </div>
      )}

      {/* Summary table */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            <SummaryRow label="Предмет" value={subject?.name ?? data.subjectId} />
            <SummaryRow label="Тип" value={entryTypeLabel} />
            <SummaryRow label="Преподаватель" value={teacher?.full_name ?? data.teacherId} />
            <SummaryRow label="Аудитория" value={data.room || '—'} />
            <SummaryRow label="День" value={DAY_NAMES[data.dayOfWeek] ?? String(data.dayOfWeek)} />
            <SummaryRow label="Пара" value={`${data.pairNumber} пара`} />
            <SummaryRow
              label="Чётность"
              value={
                data.weekParity === 'all'
                  ? 'Каждую неделю'
                  : data.weekParity === 'odd'
                    ? 'Нечётные'
                    : 'Чётные'
              }
            />
            <SummaryRow label="Начало" value={data.dateFrom} />
            <SummaryRow label="Конец" value={data.dateTo} />
            <SummaryRow label="Кол-во занятий" value={String(data.pairCount)} />
            <SummaryRow
              label="Подгруппы"
              value={buildSubgroupSummary(data)}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
      <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400 font-medium w-40">{label}</td>
      <td className="px-4 py-2.5 text-neutral-900 dark:text-neutral-100">{value}</td>
    </tr>
  );
}

function buildSubgroupSummary(data: {
  targetLanguage: string;
  targetEngSubgroup: string;
  targetOitSubgroup: string;
}): string {
  const parts: string[] = [];
  if (data.targetLanguage !== 'all') {
    parts.push(`Язык: ${data.targetLanguage.toUpperCase()}`);
  }
  if (data.targetEngSubgroup !== 'all') {
    parts.push(`EN: ${data.targetEngSubgroup.toUpperCase()}`);
  }
  if (data.targetOitSubgroup !== 'all') {
    parts.push(`ОИТ: ${data.targetOitSubgroup.toUpperCase()}`);
  }
  return parts.length > 0 ? parts.join(', ') : 'Вся группа';
}
