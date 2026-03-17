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

/* ────────────────────────────── platform helpers ─────────────────── */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getIsIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function getIsStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as unknown as { standalone: boolean }).standalone === true)
  );
}

/* ────────────────────────────── useInstallPrompt ─────────────────── */

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isIos = getIsIos();

  useEffect(() => {
    if (getIsStandalone()) {
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
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
      return;
    }
    if (isIos) {
      setShowIosGuide(true);
    }
  }, [deferredPrompt, isIos]);

  const canInstall =
    (!isInstalled && !!deferredPrompt) || (!isInstalled && isIos && !getIsStandalone());

  return {
    canInstall,
    install,
    isInstalled,
    showIosGuide,
    closeIosGuide: () => setShowIosGuide(false),
  };
}

/* ────────────────────────────── main component ──────────────────── */

export function SettingsSetup({ onComplete }: Props) {
  const [language, setLanguage] = useState<Language | null>(null);
  const [engSubgroup, setEngSubgroup] = useState<Subgroup | null>(null);
  const [oitSubgroup, setOitSubgroup] = useState<Subgroup | null>(null);

  // Install prompt — lifted to top level so modal renders outside transform
  const { canInstall, install, showIosGuide, closeIosGuide } = useInstallPrompt();

  const needsEngSubgroup = language === 'en';

  const steps = buildSteps(needsEngSubgroup);
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex];

  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const DURATION = 400;

  useEffect(() => {
    if (language !== 'en') setEngSubgroup(null);
  }, [language]);

  const prevStepsRef = useRef(steps);
  useEffect(() => {
    const prev = prevStepsRef.current;
    const next = steps;
    if (prev.length !== next.length && stepIndex > 0) {
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

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const handleNext = () => {
    if (!canGoNext) return;
    if (currentStep === 'features') {
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

  const slideClass = animating
    ? direction === 'forward'
      ? 'onb-slide-out-left'
      : 'onb-slide-out-right'
    : 'onb-slide-in';

  return (
    <>
      <OnboardingStyles />

      <div
        className="min-h-screen flex flex-col bg-gray-50 dark:bg-black text-neutral-900 dark:text-neutral-100 overflow-hidden"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* header */}
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

        {/* content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className={`w-full max-w-sm ${slideClass}`} key={`${currentStep}-${stepIndex}`}>
            {currentStep === 'welcome' && (
              <StepWelcome canInstall={canInstall} onInstall={install} />
            )}
            {currentStep === 'language' && (
              <StepLanguage value={language} onChange={setLanguage} />
            )}
            {currentStep === 'engSubgroup' && (
              <StepEngSubgroup value={engSubgroup} onChange={setEngSubgroup} />
            )}
            {currentStep === 'oit' && <StepOit value={oitSubgroup} onChange={setOitSubgroup} />}
            {currentStep === 'features' && <StepFeatures />}
          </div>
        </div>

        {/* footer */}
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

      {/* iOS guide — rendered OUTSIDE the transform container */}
      {showIosGuide && <IosInstallGuide onClose={closeIosGuide} />}
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

/* ────────────────────────────── step: welcome ───────────────────── */

function StepWelcome({
  canInstall,
  onInstall,
}: {
  canInstall: boolean;
  onInstall: () => void;
}) {
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
          onClick={onInstall}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-2.5 active:bg-blue-50 dark:active:bg-blue-950 transition-colors"
        >
          <Download size={16} />
          Добавить на экран «Домой»
        </button>
      )}
    </div>
  );
}

/* ────────────────────────────── iOS install guide ────────────────── */

function IosInstallGuide({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 ios-guide-backdrop"
      style={{ height: '100dvh' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="absolute left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-2xl shadow-xl ios-guide-sheet"
        style={{
          bottom: 0,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        <div className="flex items-center justify-between px-5 pb-4 pt-2">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Установка на iPhone
          </h3>
          <button
            onClick={onClose}
            className="text-sm text-neutral-400 dark:text-neutral-500 active:text-neutral-600 transition-colors px-2 py-1"
          >
            Закрыть
          </button>
        </div>

        <div className="px-5 space-y-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
              1
            </div>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 pt-1.5 leading-relaxed">
              Нажмите{' '}
              <span className="inline-flex items-center align-middle">
                <IosShareIcon />
              </span>{' '}
              <span className="font-semibold">«Поделиться»</span> в нижней панели Safari
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
              2
            </div>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 pt-1.5 leading-relaxed">
              Прокрутите список вниз и нажмите{' '}
              <span className="font-semibold">«На экран «Домой»»</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
              3
            </div>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 pt-1.5 leading-relaxed">
              Нажмите <span className="font-semibold">«Добавить»</span> в правом верхнем углу
            </div>
          </div>
        </div>

        <div className="px-5 pt-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold bg-blue-600 text-white active:bg-blue-700 transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}

function IosShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-600 dark:text-blue-400"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

/* ────────────────────────────── step: language ───────────────────── */

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

/* ────────────────────────────── step: eng subgroup ──────────────── */

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

/* ────────────────────────────── step: oit ────────────────────────── */

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

/* ────────────────────────────── step: features ──────────────────── */

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

      .ios-guide-backdrop {
        animation: ios-fade-in .25s ease-out both;
      }
      .ios-guide-sheet {
        animation: ios-slide-up .35s cubic-bezier(.32, .72, 0, 1) both;
      }

      @keyframes ios-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes ios-slide-up {
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
      }
    `}</style>
  );
}