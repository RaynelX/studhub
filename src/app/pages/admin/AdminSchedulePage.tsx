import { useState } from 'react';
import { Plus, CalendarPlus, Clock } from 'lucide-react';
import { AdminPageHeader } from '../../../features/admin/components/ui/admin-page-header';
import { AdminCard } from '../../../features/admin/components/ui/admin-card';
import { WeekGrid } from '../../../features/admin/components/schedule/week-grid';
import { SemesterTimeline } from '../../../features/admin/components/schedule/semester-timeline';
import { CourseTable } from '../../../features/admin/components/schedule/course-table';
import { OverrideEventTable } from '../../../features/admin/components/schedule/override-event-table';
import { CourseWizard } from '../../../features/admin/components/schedule/course-wizard';
import { OverrideFormDesktop } from '../../../features/admin/components/schedule/override-form-desktop';
import type { OverrideFormData } from '../../../features/admin/components/schedule/override-form-desktop';
import { EventFormDesktop } from '../../../features/admin/components/schedule/event-form-desktop';
import type { EventFormData } from '../../../features/admin/components/schedule/event-form-desktop';
import { DeadlineFormDesktop } from '../../../features/admin/components/schedule/deadline-form-desktop';
import type { DeadlineFormData } from '../../../features/admin/components/schedule/deadline-form-desktop';
import type { WizardData } from '../../../features/admin/hooks/use-schedule-planner';
import { AdminConfirmDialog } from '../../../features/admin/components/ui/admin-confirm-dialog';
import { useAdminToast } from '../../../features/admin/components/ui/admin-toast';
import { useDatabase } from '../../providers/DatabaseProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { useAdminWrite } from '../../../features/admin/hooks/use-admin-write';

// ============================================================
// Tabs
// ============================================================

type TabId = 'grid' | 'timeline' | 'courses';

const TABS: { id: TabId; label: string }[] = [
  { id: 'grid', label: 'Сетка недели' },
  { id: 'timeline', label: 'Timeline семестра' },
  { id: 'courses', label: 'Все курсы' },
];

// ============================================================
// Component
// ============================================================

export function AdminSchedulePage() {
  const [activeTab, setActiveTab] = useState<TabId>('grid');
  const { showToast } = useAdminToast();

  // Modals
  const [wizardOpen, setWizardOpen] = useState(false);
  const [overrideFormOpen, setOverrideFormOpen] = useState(false);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [deadlineFormOpen, setDeadlineFormOpen] = useState(false);

  // Pre-fill state for override form opened from popover
  const [overridePreFill, setOverridePreFill] = useState<{ date: string; pairNumber: number } | null>(null);

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Data from RxDB
  const db = useDatabase();
  const { data: entries } = useRxCollection(db.schedule);
  const { data: overrides } = useRxCollection(db.overrides);
  const { data: events } = useRxCollection(db.events);
  const { data: subjects } = useRxCollection(db.subjects);
  const { data: teachers } = useRxCollection(db.teachers);
  const { data: semesters } = useRxCollection(db.semester);

  const semesterConfig = semesters[0] ?? null;
  const { insert, remove, loading: writeLoading } = useAdminWrite();

  const activeEntries = entries.filter((e) => !e.is_deleted);
  const activeOverrides = overrides.filter((o) => !o.is_deleted);
  const activeEvents = events.filter((e) => !e.is_deleted);
  const activeSubjects = subjects.filter((s) => !s.is_deleted);
  const activeTeachers = teachers.filter((t) => !t.is_deleted);

  // ========== Handlers ==========

  async function handleCreateCourse(data: WizardData) {
    try {
      await insert('schedule_entries', {
        day_of_week: data.dayOfWeek,
        pair_number: data.pairNumber,
        subject_id: data.subjectId,
        entry_type: data.entryType,
        teacher_id: data.teacherId,
        room: data.room,
        target_language: data.targetLanguage,
        target_eng_subgroup: data.targetEngSubgroup,
        target_oit_subgroup: data.targetOitSubgroup,
        date_from: data.dateFrom,
        date_to: data.dateTo,
        week_parity: data.weekParity,
      });
      showToast('success', 'Курс добавлен в расписание');
    } catch {
      showToast('error', 'Не удалось добавить курс');
    }
  }

  async function handleCreateOverride(data: OverrideFormData) {
    try {
      await insert('schedule_overrides', {
        date: data.date,
        pair_number: data.pairNumber,
        override_type: data.overrideType,
        target_language: data.targetLanguage,
        target_eng_subgroup: data.targetEngSubgroup,
        target_oit_subgroup: data.targetOitSubgroup,
        subject_id: data.subjectId || null,
        entry_type: data.entryType || null,
        teacher_id: data.teacherId || null,
        room: data.room || null,
        comment: data.comment || null,
      });
      showToast('success', 'Изменение создано');
    } catch {
      showToast('error', 'Не удалось создать изменение');
    }
  }

  async function handleCreateEvent(data: EventFormData) {
    try {
      await insert('events', {
        title: data.title,
        description: data.description || null,
        event_type: data.eventType,
        date: data.date,
        pair_number: data.pairNumber,
        event_time: data.eventTime || null,
        subject_id: data.subjectId || null,
        teacher_id: data.teacherId || null,
        room: data.room || null,
        target_language: data.targetLanguage,
        target_eng_subgroup: data.targetEngSubgroup,
        target_oit_subgroup: data.targetOitSubgroup,
      });
      showToast('success', 'Событие создано');
    } catch {
      showToast('error', 'Не удалось создать событие');
    }
  }

  async function handleCreateDeadline(data: DeadlineFormData) {
    try {
      await insert('deadlines', {
        description: data.description || null,
        date: data.date,
        time: data.time || null,
        subject_id: data.subjectId || null,
        target_language: data.targetLanguage,
        target_eng_subgroup: data.targetEngSubgroup,
        target_oit_subgroup: data.targetOitSubgroup,
      });
      showToast('success', 'Дедлайн создан');
    } catch {
      showToast('error', 'Не удалось создать дедлайн');
    }
  }

  function requestDeleteOverride(id: string) {
    setConfirmState({
      title: 'Удалить изменение?',
      message: 'Это действие отменит данное изменение в расписании.',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await remove('schedule_overrides', id);
          showToast('success', 'Изменение удалено');
        } catch {
          showToast('error', 'Не удалось удалить');
        }
      },
    });
  }

  function requestDeleteEvent(id: string) {
    setConfirmState({
      title: 'Удалить событие?',
      message: 'Событие будет удалено из расписания.',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await remove('events', id);
          showToast('success', 'Событие удалено');
        } catch {
          showToast('error', 'Не удалось удалить');
        }
      },
    });
  }

  function requestDeleteEntry(id: string) {
    setConfirmState({
      title: 'Удалить курс?',
      message: 'Курс будет удалён из расписания. Это не затронет уже созданные изменения.',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await remove('schedule_entries', id);
          showToast('success', 'Курс удалён');
        } catch {
          showToast('error', 'Не удалось удалить');
        }
      },
    });
  }

  // Quick actions from popover
  function handleQuickCancel(date: string, pairNumber: number) {
    handleCreateOverride({
      date,
      pairNumber,
      overrideType: 'cancel',
      targetLanguage: 'all',
      targetEngSubgroup: 'all',
      targetOitSubgroup: 'all',
      subjectId: '',
      entryType: 'lecture',
      teacherId: '',
      room: '',
      comment: '',
    });
  }

  function handleQuickReplace(date: string, pairNumber: number) {
    setOverridePreFill({ date, pairNumber });
    setOverrideFormOpen(true);
  }

  function handleQuickAdd(date: string, pairNumber: number) {
    setOverridePreFill({ date, pairNumber });
    setOverrideFormOpen(true);
  }

  return (
    <>
      <AdminPageHeader
        title="Расписание"
        description="Управление расписанием, изменениями и событиями"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setOverrideFormOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Изменение
            </button>
            <button
              onClick={() => setEventFormOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Событие
            </button>
            <button
              onClick={() => setDeadlineFormOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
            >
              <Clock className="w-4 h-4" />
              Дедлайн
            </button>
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить курс
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AdminCard noPadding={activeTab === 'courses'}>
        {activeTab === 'grid' && (
          <div>
            <WeekGrid
              onDeleteEntry={requestDeleteEntry}
              onDeleteOverride={requestDeleteOverride}
              onDeleteEvent={requestDeleteEvent}
              onQuickCancel={handleQuickCancel}
              onQuickReplace={handleQuickReplace}
              onQuickAdd={handleQuickAdd}
            />
          </div>
        )}
        {activeTab === 'timeline' && (
          <SemesterTimeline
            entries={activeEntries}
            subjects={activeSubjects}
            semesterConfig={semesterConfig}
          />
        )}
        {activeTab === 'courses' && (
          <CourseTable
            entries={activeEntries}
            subjects={activeSubjects}
            teachers={activeTeachers}
            semesterConfig={semesterConfig}
            onDelete={requestDeleteEntry}
          />
        )}
      </AdminCard>

      {/* Overrides & Events table */}
      {activeTab === 'grid' && (activeOverrides.length > 0 || activeEvents.length > 0) && (
        <AdminCard title="Изменения и события" className="mt-4" noPadding>
          <OverrideEventTable
            overrides={activeOverrides}
            events={activeEvents}
            subjects={activeSubjects}
            teachers={activeTeachers}
            onDeleteOverride={requestDeleteOverride}
            onDeleteEvent={requestDeleteEvent}
          />
        </AdminCard>
      )}

      {/* Modals */}
      <CourseWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        subjects={activeSubjects}
        teachers={activeTeachers}
        entries={activeEntries}
        semesterConfig={semesterConfig}
        onSubmit={handleCreateCourse}
      />

      <OverrideFormDesktop
        open={overrideFormOpen}
        onClose={() => { setOverrideFormOpen(false); setOverridePreFill(null); }}
        subjects={activeSubjects}
        teachers={activeTeachers}
        onSubmit={handleCreateOverride}
        initialDate={overridePreFill?.date}
        initialPairNumber={overridePreFill?.pairNumber}
      />

      <EventFormDesktop
        open={eventFormOpen}
        onClose={() => setEventFormOpen(false)}
        subjects={activeSubjects}
        teachers={activeTeachers}
        onSubmit={handleCreateEvent}
      />

      <DeadlineFormDesktop
        open={deadlineFormOpen}
        onClose={() => setDeadlineFormOpen(false)}
        subjects={activeSubjects}
        onSubmit={handleCreateDeadline}
      />

      <AdminConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        variant="danger"
        confirmLabel="Удалить"
        loading={writeLoading}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />
    </>
  );
}
