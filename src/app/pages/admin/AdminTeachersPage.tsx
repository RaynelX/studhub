import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '../../../features/admin/components/ui/admin-page-header';
import { AdminCard } from '../../../features/admin/components/ui/admin-card';
import { AdminConfirmDialog } from '../../../features/admin/components/ui/admin-confirm-dialog';
import { useAdminToast } from '../../../features/admin/components/ui/admin-toast';
import { TeacherForm } from '../../../features/admin/components/teachers/teacher-form';
import type { TeacherFormData } from '../../../features/admin/components/teachers/teacher-form';
import type { TeacherDoc } from '../../../database/types';
import { useDatabase } from '../../providers/DatabaseProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { useAdminWrite } from '../../../features/admin/hooks/use-admin-write';

export function AdminTeachersPage() {
  const db = useDatabase();
  const { data: teachers } = useRxCollection(db.teachers);
  const { insert, update, remove, loading: writeLoading } = useAdminWrite();
  const { showToast } = useAdminToast();

  const activeTeachers = teachers.filter((t) => !t.is_deleted);

  const [formOpen, setFormOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<TeacherDoc | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  function handleCreate() {
    setEditTeacher(null);
    setFormOpen(true);
  }

  function handleEdit(teacher: TeacherDoc) {
    setEditTeacher(teacher);
    setFormOpen(true);
  }

  async function handleSubmit(data: TeacherFormData) {
    try {
      const payload = {
        full_name: data.fullName,
        position: data.position || null,
        email: data.email || null,
        phone: data.phone || null,
        telegram: data.telegram || null,
        preferred_contact: data.preferredContact || null,
        consultation_info: data.consultationInfo || null,
      };

      if (editTeacher) {
        await update('teachers', editTeacher.id, payload);
        showToast('success', 'Преподаватель обновлён');
      } else {
        await insert('teachers', payload);
        showToast('success', 'Преподаватель добавлен');
      }
    } catch {
      showToast('error', editTeacher ? 'Не удалось обновить' : 'Не удалось добавить');
    }
  }

  function requestDelete(teacher: TeacherDoc) {
    setConfirmState({
      title: 'Удалить преподавателя?',
      message: `«${teacher.full_name}» будет удалён. Записи расписания сохранятся.`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await remove('teachers', teacher.id);
          showToast('success', 'Преподаватель удалён');
        } catch {
          showToast('error', 'Не удалось удалить');
        }
      },
    });
  }

  return (
    <>
      <AdminPageHeader
        title="Преподаватели"
        description="Контактная информация преподавателей"
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить преподавателя
          </button>
        }
      />

      <AdminCard noPadding>
        {activeTeachers.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 text-sm">
            Нет преподавателей. Нажмите «Добавить преподавателя» чтобы начать.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="px-5 py-3 whitespace-nowrap">ФИО</th>
                  <th className="px-5 py-3 whitespace-nowrap">Должность</th>
                  <th className="px-5 py-3 whitespace-nowrap">Email</th>
                  <th className="px-5 py-3 whitespace-nowrap">Telegram</th>
                  <th className="px-5 py-3 whitespace-nowrap">Консультации</th>
                  <th className="px-5 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {activeTeachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                      {teacher.full_name}
                    </td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {teacher.position || '—'}
                    </td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {teacher.email ? (
                        <a href={`mailto:${teacher.email}`} className="text-blue-500 hover:text-blue-600 transition-colors">
                          {teacher.email}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {teacher.telegram || '—'}
                    </td>
                    <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400 max-w-[200px] truncate">
                      {teacher.consultation_info || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => requestDelete(teacher)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <TeacherForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTeacher(null); }}
        onSubmit={handleSubmit}
        editTeacher={editTeacher}
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
