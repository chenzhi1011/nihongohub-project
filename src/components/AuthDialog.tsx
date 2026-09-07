import { LogIn, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  darkMode: boolean;
  error: string | null;
  t: (key: string) => string;
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
};

export function AuthDialog({ open, darkMode, error, t, onClose, onGoogleLogin }: Props) {
  const [pending, setPending] = useState(false);

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
    setPending(true);
    try {
      await onGoogleLogin();
    } finally {
      setPending(false);
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

        <button
          type="button"
          disabled={pending}
          onClick={() => void handleGoogleLogin()}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
            darkMode
              ? 'bg-[#5d341f] text-[#ffd7b6] hover:bg-[#6e3e25]'
              : 'bg-[#f6d9bf] text-[#8f4621] hover:bg-[#f1c8a3]'
          }`}
        >
          <LogIn className="h-4 w-4" />
          {pending ? t('loginPending') : t('loginGoogle')}
        </button>
      </div>
    </div>
  );
}
