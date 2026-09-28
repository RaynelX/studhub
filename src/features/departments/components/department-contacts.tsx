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
        {room && <ContactRow label="Аудитория" value={room} />}
        {email && <ContactRow label="Email" value={email} href={`mailto:${email}`} />}
        {phone && <ContactRow label="Телефон" value={phone} href={telHref(phone)} />}
      </div>
    </Section>
  );
}

interface ContactRowProps {
  label: string;
  value: string;
  href?: string;
}

function ContactRow({ label, value, href }: ContactRowProps) {
  const rippleRef = useTouchRipple<HTMLAnchorElement>({ stopPropagation: true });

  const content = (
    <>
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
    return <div className="flex items-center px-4 py-3">{content}</div>;
  }

  return (
    <a
      ref={rippleRef}
      href={href}
      className="relative flex items-center px-4 py-3 active:opacity-70 transition-opacity"
    >
      {content}
    </a>
  );
}
