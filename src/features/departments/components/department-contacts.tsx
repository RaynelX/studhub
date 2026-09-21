import { MapPin, Mail, Phone, type LucideIcon } from 'lucide-react';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';
import { Section } from '../../../shared/ui/Section';
import type { DepartmentDoc } from '../../../database/types';

/** Телефон для tel:: только цифры и ведущий плюс */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function DepartmentContacts({ department }: { department: DepartmentDoc }) {
  const { room, email, phone } = department;

  if (!room && !email && !phone) return null;

  return (
    <Section title="Контакты" noPadding>
      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
        {room && (
          <ContactRow icon={MapPin} iconBg="bg-orange-500" label="Аудитория" value={room} />
        )}
        {email && (
          <ContactRow
            icon={Mail}
            iconBg="bg-blue-500"
            label="Email"
            value={email}
            href={`mailto:${email}`}
          />
        )}
        {phone && (
          <ContactRow
            icon={Phone}
            iconBg="bg-green-500"
            label="Телефон"
            value={phone}
            href={telHref(phone)}
          />
        )}
      </div>
    </Section>
  );
}

interface ContactRowProps {
  icon: LucideIcon;
  iconBg: string;
  label: string;
  value: string;
  href?: string;
}

function ContactRow({ icon: Icon, iconBg, label, value, href }: ContactRowProps) {
  const rippleRef = useTouchRipple<HTMLAnchorElement>({ stopPropagation: true });

  const content = (
    <>
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-lg ${iconBg} text-white shrink-0`}
      >
        <Icon size={16} strokeWidth={2} />
      </span>
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {label}
      </span>
      <span
        className={`ml-auto pl-3 text-sm text-right ${
          href
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-neutral-400 dark:text-neutral-500'
        }`}
      >
        {value}
      </span>
    </>
  );

  if (!href) {
    return <div className="flex items-center gap-3 px-4 py-3">{content}</div>;
  }

  return (
    <a
      ref={rippleRef}
      href={href}
      className="relative flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity"
    >
      {content}
    </a>
  );
}
