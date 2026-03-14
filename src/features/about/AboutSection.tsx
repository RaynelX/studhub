import { useState } from 'react';
import { Github, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Section } from '../../shared/ui/Section';

const GITHUB_URL = 'https://github.com/RaynelX/studhub';

const CHANGELOG: { version: string; date: string; changes: string[] }[] = [
  {
    version: '1.0.0',
    date: '15.03.2026',
    changes: [
      'Полная переработка приложения с нуля',
      'Тёмная тема',
      'Оффлайн-режим',
      'Краткая сводка по сегодняшнему дню на главной странице',
      'Фильтрация расписания по подгруппам',
      'Просмотр предметов и преподавателей',
      'Календарь событий и дедлайнов',
      'Домашние задания',
      'Push-уведомления',
      'Управление жестами',
      '...и многое другое!',
    ],
  },
];

export function AboutSection() {
  const [changelogOpen, setChangelogOpen] = useState(false);

  const buildDate = formatBuildDate(__BUILD_DATE__);

  return (
    <Section title="О приложении">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            StudHub
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Студенческий хаб — расписание, события, домашние задания и всё, что нужно студенту 81-й группы, в одном приложении.
          </p>
        </div>

        {/* Version & build */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-950 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
            v{__APP_VERSION__}
          </span>
          <span className="inline-flex items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-400">
            Сборка {buildDate}
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 active:opacity-70 transition-opacity"
          >
            <Github size={16} />
            <span>GitHub</span>
            <ExternalLink size={12} className="opacity-50" />
          </a>
          <a
            href={`${GITHUB_URL}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 active:opacity-70 transition-opacity"
          >
            <ExternalLink size={16} />
            <span>Сообщить об ошибке</span>
          </a>
        </div>

        {/* Changelog */}
        <div>
          <button
            onClick={() => setChangelogOpen((v) => !v)}
            className="flex items-center gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300 active:opacity-70 transition-opacity"
          >
            <span>Что нового</span>
            {changelogOpen
              ? <ChevronUp size={16} />
              : <ChevronDown size={16} />}
          </button>

          {changelogOpen && (
            <div className="mt-2 space-y-3">
              {CHANGELOG.map((entry) => (
                <div key={entry.version}>
                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    v{entry.version}{' '}
                    <span className="font-normal text-neutral-400 dark:text-neutral-500">
                      — {entry.date}
                    </span>
                  </p>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    {entry.changes.map((c) => (
                      <li
                        key={c}
                        className="text-xs text-neutral-600 dark:text-neutral-400"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function formatBuildDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}