import { Section } from '../../shared/ui/Section';

export function AboutSection() {
  return (
    <Section title="О приложении">
      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          StudHub v1.0
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Студенческий хаб группы 81
        </p>
      </div>
    </Section>
  );
}