import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../../../features/admin/AdminProvider';

/**
 * Standalone login page at /admin/login.
 * Centered card with email + password fields.
 */
export function AdminLoginPage() {
  const { signIn, isAdmin, loading: authLoading } = useAdmin();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated → redirect (in an effect, not during render)
  useEffect(() => {
    if (isAdmin && !authLoading) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const success = await signIn(email.trim(), password);
    if (success) {
      navigate('/admin', { replace: true });
    } else {
      setError('Неверный email или пароль');
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">StudHub</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Панель старосты</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
            >
              Пароль
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || authLoading}
            className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-medium text-sm disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            {submitting ? 'Вход…' : 'Войти'}
          </button>
        </form>

        {/* Back link */}
        <div className="text-center mt-4">
          <Link
            to="/"
            className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            ← В приложение
          </Link>
        </div>
      </div>
    </div>
  );
}
