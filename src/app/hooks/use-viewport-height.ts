import { useEffect } from 'react';

/**
 * Устанавливает CSS-переменную --vh на основе реальной высоты viewport.
 * Решает баг iOS Safari с нижней адресной строкой,
 * где 100vh/100dvh/100svh могут работать некорректно.
 */
export function useViewportHeight() {
  useEffect(() => {
    function update() {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
    }

    update();

    // visualViewport.resize срабатывает при показе/скрытии адресной строки
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', update);
      viewport.addEventListener('scroll', update);
    } else {
      window.addEventListener('resize', update);
    }

    // Также обновляем при смене ориентации
    window.addEventListener('orientationchange', () => {
      setTimeout(update, 100);
    });

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', update);
        viewport.removeEventListener('scroll', update);
      } else {
        window.removeEventListener('resize', update);
      }
    };
  }, []);
}