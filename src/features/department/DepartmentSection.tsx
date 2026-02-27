import { useState } from 'react';
import { ChevronDown, Mail, Phone, Send, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDatabase } from '../../app/providers/DatabaseProvider';
import { useRxCollection } from '../../database/hooks/use-rx-collection';
import { Section } from '../../shared/ui/Section';
import { EXPAND_VARIANTS, SPRING_SNAPPY } from '../../shared/constants/motion';
import type { TeacherDoc } from '../../database/types';

// ID преподавателей кафедры — захардкожены
const DEPARTMENT_TEACHER_IDS: string[] = [
  '0687bb06-2591-48d5-b275-53cb4ba7740c',
  '0c075306-437a-421d-a16b-41bc40cccef3',
  '17270609-48f8-4460-8790-9ce7fc278dba',
  '2c32af13-4d50-4821-9ffe-3e313ef336bc',
  '2c470e9d-1986-4a78-b424-49629eeec54d',
  '536b57c7-6777-4b83-ae4d-28fe07518d5f',
  '87f92d70-2ab1-4b35-80f0-7f742d43380b',
  'a7722f2a-6780-4ed3-96c5-c632c415b32d',
  'cc7e312c-d5e8-44f6-a084-06f43dd27b03',
  'e81c5b81-134b-41e8-878f-d41e644292ff',
  'f12a3a4f-8fc4-402a-8629-f51de03c34b4',
  'fe664717-59d8-44d0-8377-e51c9b6ec4f7',
  '37c31871-3c0f-493b-a7a8-4db75ecf551f'
];

export function DepartmentSection() {
  const db = useDatabase();
  const { data: allTeachers, loading } = useRxCollection(db.teachers);

  // Если список ID пустой — показываем всех преподавателей
  const teachers = DEPARTMENT_TEACHER_IDS.length > 0
    ? allTeachers.filter((t) => DEPARTMENT_TEACHER_IDS.includes(t.id))
    : allTeachers;

  const sorted = [...teachers].sort((a, b) =>
    a.full_name.localeCompare(b.full_name, 'ru'),
  );

  return (
    <Section title="Кафедра социальной коммуникации">
      <div className="space-y-4">
        {/* Информация о кафедре */}
        <div className="space-y-1 text-sm text-neutral-500 dark:text-neutral-400">
          <p>Ауд. 433</p>
          <p>Email: sociocom@bsu.by</p>
          <p>Тел: +375 хх ххх хх хх</p>
        </div>

        {/* Список преподавателей */}
        {!loading && sorted.length > 0 && (
          <div className="border-t border-gray-100 dark:border-neutral-800 pt-2">
            <div>
              {sorted.map((teacher) => (
                <TeacherRow key={teacher.id} teacher={teacher} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

function TeacherRow({ teacher }: { teacher: TeacherDoc }) {
    const [expanded, setExpanded] = useState(false);
    const hasContacts = !!(teacher.email || teacher.phone || teacher.telegram || teacher.consultation_info);
  
    return (
      <div
        className={`rounded-xl transition-colors ${
          expanded
            ? 'bg-neutral-50 dark:bg-neutral-800/50'
            : ''
        }`}
      >
        <button
          onClick={() => hasContacts && setExpanded((v) => !v)}
          className="w-full flex items-center justify-between p-3 text-left active:opacity-70 transition-opacity"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {teacher.full_name}
            </span>
            {teacher.position && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                {teacher.position}
              </span>
            )}
          </div>
          {hasContacts && (
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={SPRING_SNAPPY}
              className="shrink-0"
            >
              <ChevronDown
                size={16}
                className="text-neutral-400 dark:text-neutral-500"
              />
            </motion.div>
          )}
        </button>
  
        <AnimatePresence initial={false}>
          {expanded && hasContacts && (
            <motion.div
              variants={EXPAND_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={SPRING_SNAPPY}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2">
            {teacher.email && (
              <a
                href={`mailto:${teacher.email}`}
                className="flex items-center gap-2.5 text-sm text-blue-600 dark:text-blue-400 active:opacity-70 transition-opacity"
              >
                <Mail size={15} className="shrink-0" />
                <span>{teacher.email}</span>
              </a>
            )}
            {teacher.phone && (
              <a
                href={`tel:${teacher.phone}`}
                className="flex items-center gap-2.5 text-sm text-blue-600 dark:text-blue-400 active:opacity-70 transition-opacity"
              >
                <Phone size={15} className="shrink-0" />
                <span>{teacher.phone}</span>
              </a>
            )}
            {teacher.telegram && (
              <a
                href={`https://t.me/${teacher.telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-blue-600 dark:text-blue-400 active:opacity-70 transition-opacity"
              >
                <Send size={15} className="shrink-0" />
                <span>{teacher.telegram}</span>
              </a>
            )}
            {teacher.consultation_info && (
              <div className="flex items-start gap-2.5 text-sm text-neutral-500 dark:text-neutral-400">
                <Clock size={15} className="shrink-0 mt-0.5" />
                <span>{teacher.consultation_info}</span>
              </div>
            )}
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
}