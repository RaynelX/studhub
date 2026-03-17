import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe,
  Users,
  Monitor,
  CalendarDays,
  CheckCircle2,
  Wifi,
  Bell,
  BookOpen,
  ClipboardList,
  ChevronLeft,
  Download,
  ArrowRight,
  Rocket,
  LayoutDashboard,
} from 'lucide-react';
import type { StudentSettings } from './SettingsProvider';

/* ────────────────────────────── types ────────────────────────────── */

interface Props {
  onComplete: (settings: StudentSettings) => void;
}

type Language = 'en' | 'de' | 'fr' | 'es';
type Subgroup = 'a' | 'b';

/* ────────────────────────────── data ─────────────────────────────── */

const LANGUAGES: { value: Language; label: string; emoji: string }[] = [
  { value: 'en', label: 'Английский', emoji: '🇬🇧' },
  { value: 'de', label: 'Немецкий', emoji: '🇩🇪' },
  { value: 'fr', label: 'Французский', emoji: '🇫🇷' },
  { value: 'es', label: 'Испанский', emoji: '🇪🇸' },
];

const FEATURES = [
  { icon: CalendarDays, title: 'Расписание', desc: 'Актуальные занятия на каждый день' },
  { icon: CheckCircle2, title: 'Посещаемость', desc: 'Трекер пропусков и посещений' },
  { icon: Wifi, title: 'Оффлайн', desc: 'Работает без интернета' },
  { icon: ClipboardList, title: 'Календарь', desc: 'События и дедлайны' },
  { icon: BookOpen, title: 'Домашние задания', desc: 'Всё в одном месте' },
  { icon: Bell, title: 'Уведомления', desc: 'Push-напоминания о парах' },
];

/* ────────────────────────────── helpers ──────────────────────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => setIsInstalled(true);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
    return outcome === 'accepted';
  }, [deferredPrompt]);

  return { canInstall: !!deferredPrompt && !isInstalled, install, isInstalled };
}

/* ────────────────────────────── main ─────────────────────────────── */

export function SettingsSetup({ onComplete }: Props) {
  const [language, setLanguage] = useState<Language | null>(null);
  const [engSubgroup, setEngSubgroup] = useState<Subgroup | null>(null);
  const [oitSubgroup, setOitSubgroup] = useState<Subgroup | null>(null);

  const needsEngSubgroup = language === 'en';

  // Steps: welcome → language → (engSub?) → oit → features
  const steps = buildSteps(needsEngSubgroup);
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex];

  // Slide direction for animation
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const DURATION = 400; // ms — match CSS

  // When language changes away from 'en', clear eng subgroup
  useEffect(() => {
    if (language !== 'en') setEngSubgroup(null);
  }, [language]);

  // Rebuild steps when needsEngSubgroup changes — if we're past the eng step, adjust index
  const prevStepsRef = useRef(steps);
  useEffect(() => {
    const prev = prevStepsRef.current;
    const next = steps;
    if (prev.length !== next.length && stepIndex > 0) {
      // find current step id in new array
      const curId = prev[stepIndex];
      const newIdx = next.indexOf(curId);
      if (newIdx >= 0 && newIdx !== stepIndex) {
        setStepIndex(newIdx);
      }
    }
    prevStepsRef.current = next;
  }, [steps, stepIndex]);

  const canGoNext = (() => {
    switch (currentStep) {
      case 'welcome':
        return true;
      case 'language':
        return language !== null;
      case 'engSubgroup':
        return engSubgroup !== null;
      case 'oit':
        return oitSubgroup !== null;
      case 'features':
        return true;
      default:
        return false;
    }
  })();

  const navigate = useCallback(
    (dir: 'forward' | 'back') => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      timeoutRef.current = setTimeout(() => {
        setStepIndex((i) => i + (dir === 'forward' ? 1 : -1));
        setAnimating(false);
      }, DURATION);
    },
    [animating],
  );

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleNext = () => {
    if (!canGoNext) return;
    if (currentStep === 'features') {
      // Final — submit
      if (!language || !oitSubgroup) return;
      onComplete({
        language,
        eng_subgroup: needsEngSubgroup ? engSubgroup : null,
        oit_subgroup: oitSubgroup,
      });
      return;
    }
    navigate('forward');
  };

  const handleBack = () => {
    if (stepIndex > 0) navigate('back');
  };

  /* ──────────── render helpers ──────────── */

  const slideClass = animating
    ? direction === 'forward'
      ? 'onb-slide-out-left'
      : 'onb-slide-out-right'
    : 'onb-slide-in';

  return (
    <>
      {/* CSS — injected once */}
      <OnboardingStyles />

      <div
        className="min-h-screen flex flex-col bg-gray-50 dark:bg-black text-neutral-900 dark:text-neutral-100 overflow-hidden"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* ── header ── */}
        <div className="h-12 flex items-center px-4 shrink-0">
          {stepIndex > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium active:opacity-60 transition-opacity"
              aria-label="Назад"
            >
              <ChevronLeft size={20} />
              <span>Назад</span>
            </button>
          )}
        </div>

        {/* ── content ── */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className={`w-full max-w-sm ${slideClass}`} key={`${currentStep}-${stepIndex}`}>
            {currentStep === 'welcome' && <StepWelcome />}
            {currentStep === 'language' && (
              <StepLanguage value={language} onChange={setLanguage} />
            )}
            {currentStep === 'engSubgroup' && (
              <StepEngSubgroup value={engSubgroup} onChange={setEngSubgroup} />
            )}
            {currentStep === 'oit' && (
              <StepOit value={oitSubgroup} onChange={setOitSubgroup} />
            )}
            {currentStep === 'features' && <StepFeatures />}
          </div>
        </div>

        {/* ── footer: button + dots ── */}
        <div className="shrink-0 px-6 pb-6 space-y-5">
          <button
            disabled={!canGoNext || animating}
            onClick={handleNext}
            className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              canGoNext && !animating
                ? 'bg-blue-600 text-white active:bg-blue-700'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {currentStep === 'features' ? (
              <>
                <Rocket size={16} />
                Поехали!
              </>
            ) : (
              <>
                Далее
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* dots */}
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`block rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? 'w-6 h-2 bg-blue-600 dark:bg-blue-400'
                    : 'w-2 h-2 bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────── steps builder ────────────────────── */

type StepId = 'welcome' | 'language' | 'engSubgroup' | 'oit' | 'features';

function buildSteps(needsEng: boolean): StepId[] {
  const s: StepId[] = ['welcome', 'language'];
  if (needsEng) s.push('engSubgroup');
  s.push('oit', 'features');
  return s;
}

/* ────────────────────────────── step components ──────────────────── */

function StepWelcome() {
  const { canInstall, install } = useInstallPrompt();

  return (
    <div className="text-center space-y-6">
      <div className="text-5xl animate-wave inline-block">👋</div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">StudHub</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed max-w-xs mx-auto">
          Студенческий хаб — расписание, события, домашние задания и всё, что нужно студенту
          81&#8209;й группы, в одном приложении.
        </p>
      </div>

      {canInstall && (
        <button
          onClick={install}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-2.5 active:bg-blue-50 dark:active:bg-blue-950 transition-colors"
        >
          <Download size={16} />
          Добавить на экран «Домой»
        </button>
      )}
    </div>
  );
}

function StepLanguage({
  value,
  onChange,
}: {
  value: Language | null;
  onChange: (v: Language) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mb-4">
          <Globe className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <h2 className="text-xl font-bold">Иностранный язык</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Выберите язык, который вы изучаете
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {LANGUAGES.map(({ value: v, label, emoji }) => (
          <OptionCard key={v} selected={value === v} onClick={() => onChange(v)}>
            <span className="text-2xl">{emoji}</span>
            <span className="text-sm font-medium mt-1">{label}</span>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

function StepEngSubgroup({
  value,
  onChange,
}: {
  value: Subgroup | null;
  onChange: (v: Subgroup) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mb-4">
          <Users className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <h2 className="text-xl font-bold">Подгруппа по английскому</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Выберите вашего преподавателя
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <OptionCard selected={value === 'a'} onClick={() => onChange('a')}>
          <span className="text-sm font-medium">Ильюшенко</span>
        </OptionCard>
        <OptionCard selected={value === 'b'} onClick={() => onChange('b')}>
          <span className="text-sm font-medium">Гилевич</span>
        </OptionCard>
      </div>
    </div>
  );
}

function StepOit({
  value,
  onChange,
}: {
  value: Subgroup | null;
  onChange: (v: Subgroup) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mb-4">
          <Monitor className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <h2 className="text-xl font-bold">Подгруппа по ОИТ</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Основы информационных технологий
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <OptionCard selected={value === 'a'} onClick={() => onChange('a')}>
          <span className="text-sm font-medium">Войтешенко</span>
        </OptionCard>
        <OptionCard selected={value === 'b'} onClick={() => onChange('b')}>
          <span className="text-sm font-medium">Левчук</span>
        </OptionCard>
      </div>
    </div>
  );
}

function StepFeatures() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mb-4">
          <LayoutDashboard className="text-blue-600 dark:text-blue-400" size={28} />
        </div>
        <h2 className="text-xl font-bold">Всё готово!</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Вот что вас ждёт в StudHub
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-2">
              <Icon size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-semibold leading-tight">{title}</span>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 leading-tight">
              {desc}
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
        …и многое другое ✨
      </p>
    </div>
  );
}

/* ────────────────────────────── shared UI ─────────────────────────── */

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 py-4 px-4 rounded-2xl border-2 transition-all duration-200 ${
        selected
          ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 scale-[1.02]'
          : 'border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 active:scale-[0.97]'
      }`}
    >
      {children}
    </button>
  );
}

/* ────────────────────────────── CSS ──────────────────────────────── */

function OnboardingStyles() {
  return (
    <style>{`
      /* ── slide animations ── */
      .onb-slide-in {
        animation: onb-enter .4s cubic-bezier(.36, .07, .19, .97) both;
      }
      .onb-slide-out-left {
        animation: onb-exit-left .4s cubic-bezier(.36, .07, .19, .97) both;
      }
      .onb-slide-out-right {
        animation: onb-exit-right .4s cubic-bezier(.36, .07, .19, .97) both;
      }

      @keyframes onb-enter {
        from { opacity: 0; transform: translateX(0); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes onb-exit-left {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(-30%); }
      }
      @keyframes onb-exit-right {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(30%); }
      }

      /* wave hand */
      .animate-wave {
        display: inline-block;
        animation: wave-hand 1.8s ease-in-out infinite;
        transform-origin: 70% 70%;
      }
      @keyframes wave-hand {
        0%   { transform: rotate(0deg); }
        10%  { transform: rotate(14deg); }
        20%  { transform: rotate(-8deg); }
        30%  { transform: rotate(14deg); }
        40%  { transform: rotate(-4deg); }
        50%  { transform: rotate(10deg); }
        60%  { transform: rotate(0deg); }
        100% { transform: rotate(0deg); }
      }
    `}</style>
  );
}