import { useMemo } from 'react';
import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { useSessionSchedule } from '../../features/session/hooks/use-session-schedule';
import { useSessionResults } from '../../features/session/hooks/use-session-results';
import { SessionStatusBanner } from '../../features/session/components/SessionStatusBanner';
import { SessionSummary } from '../../features/session/components/SessionSummary';
import { SessionScheduleSection } from '../../features/session/components/SessionScheduleSection';

export function SessionPage() {
  useSetPageHeader({ title: 'Сессия', backTo: '/more' });

  const { events, byDate, loading } = useSessionSchedule();

  const sessionEventIds = useMemo(
    () => events.map((e) => ({ id: e.id, eventType: e.eventType })),
    [events],
  );

  const { results, setResult, clearResult, summary } =
    useSessionResults(sessionEventIds);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-5">
      <SessionStatusBanner events={events} summary={summary} />
      <SessionSummary summary={summary} />
      <SessionScheduleSection
        byDate={byDate}
        results={results}
        onSetResult={setResult}
        onClearResult={clearResult}
      />
    </div>
  );
}
