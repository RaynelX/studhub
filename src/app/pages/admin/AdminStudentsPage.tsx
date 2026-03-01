import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '../../../features/admin/components/ui/admin-page-header';
import { AdminCard } from '../../../features/admin/components/ui/admin-card';
import { AdminConfirmDialog } from '../../../features/admin/components/ui/admin-confirm-dialog';
import { useAdminToast } from '../../../features/admin/components/ui/admin-toast';
import { StudentForm } from '../../../features/admin/components/students/student-form';
import type { StudentFormData } from '../../../features/admin/components/students/student-form';
import type { StudentDoc } from '../../../database/types';
import { useDatabase } from '../../providers/DatabaseProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { useAdminWrite } from '../../../features/admin/hooks/use-admin-write';

const LANG_LABELS: Record<string, string> = {
  en: 'EN',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
};

export function AdminStudentsPage() {
  const db = useDatabase();
  const { data: students } = useRxCollection(db.students);
  const { insert, update, remove, loading: writeLoading } = useAdminWrite();
  const { showToast } = useAdminToast();

  const activeStudents = students
    .filter((s) => !s.is_deleted)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  const [formOpen, setFormOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentDoc | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  function handleCreate() {
    setEditStudent(null);
    setFormOpen(true);
  }

  function handleEdit(student: StudentDoc) {
    setEditStudent(student);
    setFormOpen(true);
  }

  async function handleSubmit(data: StudentFormData) {
    try {
      const payload: Record<string, unknown> = {
        full_name: data.fullName,
        language: data.language,
        oit_subgroup: data.oitSubgroup,
        eng_subgroup: data.language === 'en' && data.engSubgroup ? data.engSubgroup : null,
      };

      if (editStudent) {
        await update('students', editStudent.id, payload);
        showToast('success', 'Студент обновлён');
      } else {
        await insert('students', payload);
        showToast('success', 'Студент добавлен');
      }
    } catch {
      showToast('error', editStudent ? 'Не удалось обновить' : 'Не удалось добавить');
    }
  }

  function requestDelete(student: StudentDoc) {
    setConfirmState({
      title: 'Удалить студента?',
      message: `«${student.full_name}» будет удалён из списка группы.`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await remove('students', student.id);
          showToast('success', 'Студент удалён');
        } catch {
          showToast('error', 'Не удалось удалить');
        }
      },
    });
  }

  return (
    <>
      <AdminPageHeader
        title="Студенты"
        description={`Список студентов группы · ${activeStudents.length} чел.`}
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить студента
          </button>
        }
      />

      <AdminCard noPadding>
        {activeStudents.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 text-sm">
            Список пуст. Нажмите «Добавить студента» чтобы начать.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="px-5 py-3 w-10">#</th>
                  <th className="px-5 py-3">ФИО</th>
                  <th className="px-5 py-3">Язык</th>
                  <th className="px-5 py-3">EN</th>
                  <th className="px-5 py-3">ОИТ</th>
                  <th className="px-5 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {activeStudents.map((student, idx) => (
                  <tr
                    key={student.id}
                    className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-5 py-3 text-neutral-400 dark:text-neutral-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {student.full_name}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        {LANG_LABELS[student.language] ?? student.language}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">
                      {student.eng_subgroup ? student.eng_subgroup.toUpperCase() : '—'}
                    </td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">
                      {student.oit_subgroup.toUpperCase()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => requestDelete(student)}
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

      <StudentForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditStudent(null); }}
        onSubmit={handleSubmit}
        editStudent={editStudent}
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
