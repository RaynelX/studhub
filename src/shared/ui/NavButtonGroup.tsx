import { Link } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTouchRipple } from '../hooks/use-touch-ripple';

interface NavButtonProps {
  to: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  label: string;
}

export function NavButton({
  to,
  icon: Icon,
  iconBg = 'bg-gray-500',
  iconColor = 'text-white',
  label,
}: NavButtonProps) {
  const rippleRef = useTouchRipple<HTMLAnchorElement>();

  return (
    <Link
      ref={rippleRef}
      to={to}
      className="relative flex items-center gap-3 px-4 py-3"
    >
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-lg ${iconBg} ${iconColor}`}
      >
        <Icon size={16} strokeWidth={2} />
      </span>
      <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {label}
      </span>
      <ChevronRight size={18} className="text-neutral-400 dark:text-neutral-500" />
    </Link>
  );
}

export function NavButtonGroup({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent overflow-hidden divide-y divide-gray-100 dark:divide-neutral-800">
      {children}
    </div>
  );
}
