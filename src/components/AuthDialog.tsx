import { ArrowLeft, KeyRound, LogIn, Mail, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type AuthDialogStep = 'methods' | 'email' | 'otp';
type PendingAuthAction = 'google' | 'send-otp' | 'verify-otp' | 'resend-otp' | null;

type Props = {
  open: boolean;
  darkMode: boolean;
  error: string | null;
  t: (key: string) => string;
  onClose: () => void;
  onSendEmailOtp: (email: string) => Promise<void>;
  onVerifyEmailOtp: (email: string, token: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
};

const RESEND_COOLDOWN_SECONDS = 60;

export function AuthDialog({
  open,
  darkMode,
  error,
  t,
  onClose,
  onSendEmailOtp,
  onVerifyEmailOtp,
  onGoogleLogin,
}: Props) {
  const [step, setStep] = useState<AuthDialogStep>('methods');
  const [pendingAction, setPendingAction] = useState<PendingAuthAction>(null);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [resent, setResent] = useState(false);
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const pending = pendingAction !== null;
  const cooldownActive = resendSeconds > 0;

  useEffect(() => {
    if (!open) return;
    setStep('methods');
    setPendingAction(null);
    setEmail('');
    setToken('');
    setResendSeconds(0);
    setResent(false);
  }, [open]);

  useEffect(() => {
    if (!open || step !== 'otp' || !cooldownActive) return;
    const timer = window.setInterval(() => {
      setResendSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownActive, open, step]);

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
    setPendingAction('google');
    try {
      await onGoogleLogin();
    } finally {
      setPendingAction(null);
    }
  };

  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    setPendingAction('send-otp');
    setResent(false);
    try {
      await onSendEmailOtp(normalizedEmail);
      setEmail(normalizedEmail);
      setToken('');
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      setStep('otp');
    } catch {
      // The auth hook exposes the user-facing error; remain on the email step.
    } finally {
      setPendingAction(null);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (token.length !== 6) return;
    setPendingAction('verify-otp');
    try {
      await onVerifyEmailOtp(email, token);
    } catch {
      setToken('');
      window.setTimeout(() => tokenInputRef.current?.focus(), 0);
    } finally {
      setPendingAction(null);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0) return;
    setPendingAction('resend-otp');
    setResent(false);
    try {
      await onSendEmailOtp(email);
      setToken('');
      setResent(true);
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
    } catch {
      // The auth hook exposes the user-facing error; keep the existing cooldown state.
    } finally {
      setPendingAction(null);
    }
  };

  const goToMethods = () => {
    setStep('methods');
    setToken('');
    setResendSeconds(0);
    setResent(false);
  };

  const fieldClass = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#c86b3c]/35 ${
    darkMode
      ? 'border-[#59493b] bg-[#1f1b16] text-[#f5ead8] placeholder:text-[#8b7f6f]'
      : 'border-[#d8c8ae] bg-white text-[#2f2218] placeholder:text-[#a89a85]'
  }`;
  const primaryButtonClass = `flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
    darkMode ? 'bg-[#5d341f] text-[#ffd7b6] hover:bg-[#6e3e25]' : 'bg-[#c86b3c] text-white hover:bg-[#b85f2f]'
  }`;
  const secondaryButtonClass = `flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
    darkMode ? 'bg-[#3a3128] text-[#d8c4ad] hover:bg-[#4a3e31]' : 'bg-[#efe1ce] text-[#6b5845] hover:bg-[#e7d5bd]'
  }`;
  const textColor = darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]';
  const mutedColor = darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]';
  const title = step === 'methods' ? t('loginMethodTitle') : t('emailOtpTitle');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label={t('close')} onClick={pending ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className={`relative w-full max-w-sm rounded-2xl border p-5 shadow-xl ${darkMode ? 'border-[#4a3f33] bg-[#2a241d]' : 'border-[#d8c8ae] bg-[#fff8ec]'}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="auth-dialog-title" className={`text-lg font-semibold ${textColor}`}>{title}</h2>
            {step === 'methods' && <p className={`mt-1 text-sm ${mutedColor}`}>{t('loginMethodDesc')}</p>}
          </div>
          <button type="button" aria-label={t('close')} disabled={pending} onClick={onClose} className={`rounded-md p-2 ${darkMode ? 'text-[#d8c4ad] hover:bg-[#3a3128]' : 'text-[#6b5845] hover:bg-[#efe1ce]'}`}>
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {error && <p role="alert" className={`mt-4 rounded-lg px-3 py-2 text-sm ${darkMode ? 'bg-[#4a2925] text-[#ffd2ca]' : 'bg-[#fbe2dd] text-[#8a3025]'}`}>{error}</p>}
        {resent && <p role="status" className={`mt-4 rounded-lg px-3 py-2 text-sm ${darkMode ? 'bg-[#294036] text-[#ccebdc]' : 'bg-[#e1f2e8] text-[#285b40]'}`}>{t('emailOtpResent')}</p>}

        {step === 'methods' && (
          <div className="mt-5 space-y-3">
            <button type="button" disabled={pending} onClick={() => setStep('email')} className={primaryButtonClass}>
              <Mail aria-hidden="true" className="h-4 w-4" />{t('loginEmailOtp')}
            </button>
            <button type="button" disabled={pending} onClick={() => void handleGoogleLogin()} className={secondaryButtonClass}>
              <LogIn aria-hidden="true" className="h-4 w-4" />
              {pendingAction === 'google' ? t('loginPending') : t('loginGoogle')}
            </button>
          </div>
        )}

        {step === 'email' && (
          <form className="mt-5 space-y-3" onSubmit={(event) => void handleSendOtp(event)}>
            <label htmlFor="auth-email" className={`block text-sm font-medium ${textColor}`}>{t('emailAddress')}</label>
            <input id="auth-email" type="email" required autoComplete="email" value={email} placeholder={t('emailPlaceholder')} disabled={pending} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
            <button type="submit" disabled={pending} className={primaryButtonClass}>
              <Mail aria-hidden="true" className="h-4 w-4" />
              {pendingAction === 'send-otp' ? t('emailOtpSending') : t('sendEmailOtp')}
            </button>
            <button type="button" disabled={pending} onClick={goToMethods} className={secondaryButtonClass}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />{t('backToLoginMethods')}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="mt-5 space-y-3" onSubmit={(event) => void handleVerifyOtp(event)}>
            <p className={`text-sm ${mutedColor}`}>{t('emailOtpSentTo').replace('{email}', email)}</p>
            <label htmlFor="auth-email-otp" className={`block text-sm font-medium ${textColor}`}>{t('emailOtpCode')}</label>
            <input
              ref={tokenInputRef}
              id="auth-email-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={token}
              placeholder={t('emailOtpCodePlaceholder')}
              disabled={pending}
              onChange={(event) => setToken(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`${fieldClass} text-center text-lg tracking-[0.35em]`}
            />
            <button type="submit" disabled={pending || token.length !== 6} className={primaryButtonClass}>
              <KeyRound aria-hidden="true" className="h-4 w-4" />
              {pendingAction === 'verify-otp' ? t('emailOtpVerifying') : t('verifyEmailOtp')}
            </button>
            <button type="button" disabled={pending || resendSeconds > 0} onClick={() => void handleResend()} className={secondaryButtonClass}>
              {resendSeconds > 0
                ? t('resendEmailOtpIn').replace('{seconds}', String(resendSeconds))
                : t('resendEmailOtp')}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={pending} onClick={() => { setStep('email'); setToken(''); setResendSeconds(0); setResent(false); }} className={`rounded-lg px-3 py-2 text-sm underline ${mutedColor}`}>{t('changeEmail')}</button>
              <button type="button" disabled={pending} onClick={goToMethods} className={`rounded-lg px-3 py-2 text-sm underline ${mutedColor}`}>{t('backToLoginMethods')}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
