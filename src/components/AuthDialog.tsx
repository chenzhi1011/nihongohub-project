import { LogIn, Mail, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  darkMode: boolean;
  error: string | null;
  t: (key: string) => string;
  onClose: () => void;
  onEmailLogin: (email: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
};

export function AuthDialog({ open, darkMode, error, t, onClose, onEmailLogin, onGoogleLogin }: Props) {
  const [pendingMethod, setPendingMethod] = useState<'email' | 'google' | null>(null);
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const pending = pendingMethod !== null;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open, pending]);

  if (!open) return null;

  const handleGoogleLogin = async () => {
    setPendingMethod('google');
    try {
      await onGoogleLogin();
    } finally {
      setPendingMethod(null);
    }
  };

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPendingMethod('email');
    setMagicLinkSent(false);
    try {
      await onEmailLogin(email.trim());
      setMagicLinkSent(true);
    } catch {
      // The auth hook exposes the localized error above the form.
    } finally {
      setPendingMethod(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label={t('close')}
        onClick={pending ? undefined : onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className={`relative w-full max-w-sm rounded-2xl border p-5 shadow-xl ${
          darkMode ? 'bg-[#2a241d] border-[#4a3f33]' : 'bg-[#fff8ec] border-[#d8c8ae]'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="auth-dialog-title" className={`text-lg font-semibold ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>
              {t('loginMethodTitle')}
            </h2>
            <p className={`mt-1 text-sm ${darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'}`}>
              {t('loginMethodDesc')}
            </p>
          </div>
          <button
            type="button"
            aria-label={t('close')}
            disabled={pending}
            onClick={onClose}
            className={`rounded-md p-2 ${darkMode ? 'text-[#d8c4ad] hover:bg-[#3a3128]' : 'text-[#6b5845] hover:bg-[#efe1ce]'}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p role="alert" className={`mt-4 rounded-lg px-3 py-2 text-sm ${darkMode ? 'bg-[#4a2925] text-[#ffd2ca]' : 'bg-[#fbe2dd] text-[#8a3025]'}`}>
            {error}
          </p>
        )}

        {magicLinkSent && (
          <p role="status" className={`mt-4 rounded-lg px-3 py-2 text-sm ${darkMode ? 'bg-[#294036] text-[#ccebdc]' : 'bg-[#e1f2e8] text-[#285b40]'}`}>
            {t('magicLinkSent')}
          </p>
        )}

        <form className="mt-4 space-y-2" onSubmit={(event) => void handleEmailLogin(event)}>
          <label htmlFor="auth-email" className={`block text-sm font-medium ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>
            {t('emailAddress')}
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            placeholder={t('emailPlaceholder')}
            disabled={pending}
            onChange={(event) => setEmail(event.target.value)}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#c86b3c]/35 ${
              darkMode
                ? 'border-[#59493b] bg-[#1f1b16] text-[#f5ead8] placeholder:text-[#8b7f6f]'
                : 'border-[#d8c8ae] bg-white text-[#2f2218] placeholder:text-[#a89a85]'
            }`}
          />
          <button
            type="submit"
            disabled={pending}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
              darkMode
                ? 'bg-[#5d341f] text-[#ffd7b6] hover:bg-[#6e3e25]'
                : 'bg-[#c86b3c] text-white hover:bg-[#b85f2f]'
            }`}
          >
            <Mail className="h-4 w-4" />
            {pendingMethod === 'email' ? t('emailSending') : t('loginEmail')}
          </button>
        </form>

        <div className={`my-4 flex items-center gap-3 text-xs ${darkMode ? 'text-[#8b7f6f]' : 'text-[#a89a85]'}`}>
          <span className={`h-px flex-1 ${darkMode ? 'bg-[#4a3f33]' : 'bg-[#d8c8ae]'}`} />
          <span>{t('authOr')}</span>
          <span className={`h-px flex-1 ${darkMode ? 'bg-[#4a3f33]' : 'bg-[#d8c8ae]'}`} />
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={() => void handleGoogleLogin()}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
            darkMode
              ? 'bg-[#5d341f] text-[#ffd7b6] hover:bg-[#6e3e25]'
              : 'bg-[#f6d9bf] text-[#8f4621] hover:bg-[#f1c8a3]'
          }`}
        >
          <LogIn className="h-4 w-4" />
          {pendingMethod === 'google' ? t('loginPending') : t('loginGoogle')}
        </button>
      </div>
    </div>
  );
}
