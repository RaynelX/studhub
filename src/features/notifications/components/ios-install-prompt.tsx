import { useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';

// ============================================================
// Helpers
// ============================================================

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    // iPad on iOS 13+ reports MacIntel with touch support
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isStandalonePWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari-specific standalone indicator
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

// ============================================================
// Компонент
// ============================================================

/**
 * Shown on iOS/iPadOS when the app is not installed as a PWA.
 * iOS requires the user to add the site to their home screen before
 * push notifications can be granted.
 */
export function IosInstallPrompt() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !isIOS() || isStandalonePWA()) {
    return null;
  }

  return (
    <InstallBanner onDismiss={() => setDismissed(true)} />
  );
}

function InstallBanner({ onDismiss }: { onDismiss: () => void }) {
  const dismissRef = useTouchRipple<HTMLButtonElement>({ stopPropagation: true });

  return (
    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/50">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mt-0.5">
        <Smartphone size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          Добавьте приложение на экран «Домой»
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
          На iPhone и iPad push-уведомления работают только из установленного
          приложения. Нажмите{' '}
          <ShareIcon />{' '}
          → «На экран «Домой»» → «Добавить», затем откройте StudHub из иконки
          на рабочем столе.
        </p>
      </div>
      <button
        ref={dismissRef}
        onClick={onDismiss}
        aria-label="Закрыть"
        className="flex-shrink-0 p-1 -m-1 text-amber-500 dark:text-amber-500 rounded-lg"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/** Inline SVG of the Safari/iOS share icon */
function ShareIcon() {
  return (
    <span
      className="inline-block align-middle"
      aria-hidden="true"
      style={{ lineHeight: 0 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    </span>
  );
}
