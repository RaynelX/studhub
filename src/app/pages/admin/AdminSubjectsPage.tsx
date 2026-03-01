import { useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { AdminPageHeader } from '../../../features/admin/components/ui/admin-page-header';
import { AdminCard } from '../../../features/admin/components/ui/admin-card';
import { AdminConfirmDialog } from '../../../features/admin/components/ui/admin-confirm-dialog';
import { useAdminToast } from '../../../features/admin/components/ui/admin-toast';
import { SubjectForm } from '../../../features/admin/components/subjects/subject-form';
import type { SubjectFormData } from '../../../features/admin/components/subjects/subject-form';
import type { SubjectDoc } from '../../../database/types';
import { useDatabase } from '../../providers/DatabaseProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { useAdminWrite } from '../../../features/admin/hooks/use-admin-write';

export function AdminSubjectsPage() {
  const db = useDatabase();
  const { data: subjects, loading: dataLoading } = useRxCollection(db.subjects);
  const { insert, update, remove, loading: writeLoading } = useAdminWrite();
  const { showToast } = useAdminToast();

  const activeSubjects = subjects.filter((s) => !s.is_deleted);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<SubjectDoc | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  function handleCreate() {
    setEditSubject(null);
    setFormOpen(true);
  }

  function handleEdit(subject: SubjectDoc) {
    setEditSubject(subject);
    setFormOpen(true);
  }

  async function handleSubmit(data: SubjectFormData) {
    try {
      if (editSubject) {
        await update('subjects', editSubject.id, {
          name: data.name,
          short_name: data.shortName || null,
          sdo_url: data.sdoUrl || null,
          additional_links: data.additionalLinks.length > 0 ? data.additionalLinks : null,
          notes: data.notes || null,
        });
        showToast('success', 'Предмет обновлён');
      } else {
        await insert('subjects', {
          name: data.name,
          short_name: data.shortName || null,
          sdo_url: data.sdoUrl || null,
          additional_links: data.additionalLinks.length > 0 ? data.additionalLinks : null,
          notes: data.notes || null,
        });
        showToast('success', 'Предмет создан');
      }
    } catch {
      showToast('error', editSubject ? 'Не удалось обновить' : 'Не удалось создать');
    }
  }

  function requestDelete(subject: SubjectDoc) {
    setConfirmState({
      title: 'Удалить предмет?',
      message: `«${subject.name}» будет удалён. Записи расписания, ссылающиеся на этот предмет, сохранятся.`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await remove('subjects', subject.id);
          showToast('success', 'Предмет удалён');
        } catch {
          showToast('error', 'Не удалось удалить');
        }
      },
    });
  }

  return (
    <>
      <AdminPageHeader
        title="Предметы"
        description="Управление учебными дисциплинами"
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить предмет
          </button>
        }
      />

      <AdminCard noPadding>
        {dataLoading ? (
          <div className="py-12 text-center text-neutral-400 text-sm">Загрузка…</div>
        ) : activeSubjects.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 text-sm">
            Нет предметов. Нажмите «Добавить предмет» чтобы начать.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="px-5 py-3">Название</th>
                  <th className="px-5 py-3">Сокращение</th>
                  <th className="px-5 py-3">СДО</th>
                  <th className="px-5 py-3">Ссылки</th>
                  <th className="px-5 py-3">Заметки</th>
                  <th className="px-5 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {activeSubjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {subject.name}
                    </td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">
                      {subject.short_name || '—'}
                    </td>
                    <td className="px-5 py-3">
                      {subject.sdo_url ? (
                        <a
                          href={subject.sdo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Открыть
                        </a>
                      ) : (
                        <span className="text-neutral-400 dark:text-neutral-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">
                      {subject.additional_links?.length
                        ? `${subject.additional_links.length} шт.`
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400 max-w-[200px] truncate">
                      {subject.notes || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => requestDelete(subject)}
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

      <SubjectForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditSubject(null); }}
        onSubmit={handleSubmit}
        editSubject={editSubject}
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
