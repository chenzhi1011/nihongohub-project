import { ArrowLeft, KeyRound, Mail, X } from 'lucide-react';
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
  onOpenPrivacy: () => void;
};

const RESEND_COOLDOWN_SECONDS = 60;

function GoogleIcon() {
  return (
    <svg data-google-icon aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.63.39 3.17 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}

export function AuthDialog({
  open,
  darkMode,
  error,
  t,
  onClose,
  onSendEmailOtp,
  onVerifyEmailOtp,
  onGoogleLogin,
  onOpenPrivacy,
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

  const fieldClass = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#c86b3c]/30 ${
    darkMode
      ? 'border-[#59493b] bg-[#211c17] text-[#f5ead8] placeholder:text-[#8b7f6f]'
      : 'border-[#d8c8ae] bg-[#fffcf7] text-[#2f2218] placeholder:text-[#a89a85]'
  }`;
  const primaryButtonClass = `flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-all disabled:cursor-wait disabled:opacity-60 ${
    darkMode ? 'border-[#74472e] bg-[#5d341f] text-[#ffe5cf] hover:bg-[#6e3e25]' : 'border-[#b85f2f] bg-[#c86b3c] text-white shadow-sm hover:bg-[#b85f2f]'
  }`;
  const secondaryButtonClass = `flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-all disabled:cursor-wait disabled:opacity-60 ${
    darkMode ? 'border-[#59493b] bg-[#2f2821] text-[#ead8c5] hover:border-[#735f4c] hover:bg-[#393028]' : 'border-[#d8c8ae] bg-[#fffcf7] text-[#594735] shadow-sm hover:border-[#c6ad8b] hover:bg-[#f8eddd]'
  }`;
  const textColor = darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]';
  const mutedColor = darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]';
  const title = step === 'methods' ? t('loginMethodTitle') : t('emailOtpTitle');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[#21170f]/55 backdrop-blur-[2px]" aria-label={t('close')} onClick={pending ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className={`relative flex aspect-[4/5] w-[min(420px,calc(80dvh-1.6rem),calc(100vw-2rem))] flex-col justify-center overflow-y-auto rounded-[28px] border px-6 pb-4 pt-20 shadow-2xl sm:px-8 ${darkMode ? 'border-[#4a3f33] bg-[#28221c]' : 'border-[#ddcdb6] bg-[#fffaf2]'}`}
      >
        <div className="text-center">
          <p className={`text-sm font-semibold tracking-[0.12em] ${darkMode ? 'text-[#d39a73]' : 'text-[#9a5a37]'}`}>{t('authBrand')}</p>
          <h2 id="auth-dialog-title" className={`mt-8 text-xl font-semibold tracking-tight ${textColor}`}>{title}</h2>
          {step === 'methods' && <p className={`mx-auto mt-2 max-w-xs text-sm leading-6 ${mutedColor}`}></p>}
          <button type="button" aria-label={t('close')} disabled={pending} onClick={onClose} className={`absolute right-4 top-4 rounded-full p-2 transition-colors ${darkMode ? 'text-[#a99784] hover:bg-[#3a3128] hover:text-[#f5ead8]' : 'text-[#8d7962] hover:bg-[#f0e2cf] hover:text-[#2f2218]'}`}>
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {error && <p role="alert" className={`mt-5 rounded-xl border px-4 py-3 text-sm ${darkMode ? 'border-[#684038] bg-[#402822] text-[#ffd2ca]' : 'border-[#edc8bf] bg-[#fbe8e3] text-[#8a3025]'}`}>{error}</p>}
        {resent && <p role="status" className={`mt-5 rounded-xl border px-4 py-3 text-sm ${darkMode ? 'border-[#3c5a4d] bg-[#263a31] text-[#ccebdc]' : 'border-[#bcdac8] bg-[#e7f4ec] text-[#285b40]'}`}>{t('emailOtpResent')}</p>}

        {step === 'methods' && (
          <div className="mt-16 space-y-3">
            <button type="button" disabled={pending} onClick={() => setStep('email')} className={primaryButtonClass}>
              <Mail aria-hidden="true" className="h-4 w-4" />{t('loginEmailOtp')}
            </button>
            <button type="button" disabled={pending} onClick={() => void handleGoogleLogin()} className={secondaryButtonClass}>
              <GoogleIcon />
              {pendingAction === 'google' ? t('loginPending') : t('loginGoogle')}
            </button>
            <p className={`pt-5 text-center text-xs leading-5 ${mutedColor}`}>
              {t('privacyConsentPrefix')}{' '}
              <a
                href="/privacy"
                onClick={(event) => { event.preventDefault(); onOpenPrivacy(); }}
                className={`font-medium underline underline-offset-4 ${darkMode ? 'hover:text-[#f5ead8]' : 'hover:text-[#2f2218]'}`}
              >
                {t('privacyPolicy')}
              </a>
            </p>
          </div>
        )}

        {step === 'email' && (
          <form className="mt-7 space-y-3" onSubmit={(event) => void handleSendOtp(event)}>
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
          <form className="mt-7 space-y-3" onSubmit={(event) => void handleVerifyOtp(event)}>
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
