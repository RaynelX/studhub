import { useState, useRef, useEffect } from 'react';
import { Plus, CalendarPlus } from 'lucide-react';

type FabAction = 'add' | 'event';

interface AdminFabProps {
  onAction: (action: FabAction) => void;
}

/**
 * Floating Action Button for the schedule page (admin only).
 *
 * Tapping the FAB opens a mini-menu with two options:
 *  - «Доп. пара» — add an extra pair
 *  - «Событие» — add an event
 *
 * The menu closes on backdrop tap or action selection.
 */
export function AdminFab({ onAction }: AdminFabProps) {
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside tap
  useEffect(() => {
    if (!expanded) return;
    function handleTap(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener('pointerdown', handleTap, { passive: true });
    return () => document.removeEventListener('pointerdown', handleTap);
  }, [expanded]);

  function handle(action: FabAction) {
    setExpanded(false);
    onAction(action);
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-40"
      style={{
        right: 16,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
      }}
    >
      {/* Mini-menu */}
      {expanded && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2 items-end mb-2 anim-fade-slide-enter">
          <FabMenuItem
            icon={<Plus className="w-4.5 h-4.5 text-emerald-600" />}
            label="Доп. пара"
            onClick={() => handle('add')}
          />
          <FabMenuItem
            icon={<CalendarPlus className="w-4.5 h-4.5 text-blue-600" />}
            label="Событие"
            onClick={() => handle('event')}
          />
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform ${
          expanded ? 'rotate-45' : ''
        } transition-all duration-200`}
        aria-label="Добавить"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

// ============================================================
// Internal: menu item
// ============================================================

function FabMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 shadow-md active:scale-95 transition-transform"
    >
      {icon}
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
