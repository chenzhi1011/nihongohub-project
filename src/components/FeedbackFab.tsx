import { MessageSquareText, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DailyCheckinButton } from './DailyCheckinButton';

const FEEDBACK_MAX_CHARS = 1000;
const SUCCESS_VISIBLE_MS = 3000;

type Props = {
  darkMode: boolean;
  t: (key: string) => string;
  authenticated: boolean;
  checkedToday: boolean;
  checkinSubmitting: boolean;
  feedbackSubmitting: boolean;
  feedbackError: string | null;
  onCheckIn: () => void;
  onLoginRequired: () => void;
  onSubmitFeedback: (content: string) => Promise<boolean>;
  onClearFeedbackState: () => void;
};

export function FeedbackFab({
  darkMode, t, authenticated, checkedToday, checkinSubmitting,
  feedbackSubmitting, feedbackError, onCheckIn, onLoginRequired,
  onSubmitFeedback, onClearFeedbackState,
}: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const successTimer = useRef<number | null>(null);

  const clearSuccessTimer = useCallback(() => {
    if (successTimer.current !== null) {
      window.clearTimeout(successTimer.current);
      successTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    if (feedbackSubmitting) return;
    setOpen(false);
    setText('');
    onClearFeedbackState();
  }, [feedbackSubmitting, onClearFeedbackState]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !feedbackSubmitting) close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, feedbackSubmitting, open]);

  useEffect(() => () => clearSuccessTimer(), [clearSuccessTimer]);

  const openFeedback = () => {
    if (!authenticated) {
      onLoginRequired();
      return;
    }
    onClearFeedbackState();
    setOpen(true);
  };

  const submit = async () => {
    const content = text.trim();
    if (!content || feedbackSubmitting) return;
    const succeeded = await onSubmitFeedback(content);
    if (!succeeded) return;

    setText('');
    setOpen(false);
    setSuccessVisible(true);
    clearSuccessTimer();
    successTimer.current = window.setTimeout(() => {
      setSuccessVisible(false);
      successTimer.current = null;
    }, SUCCESS_VISIBLE_MS);
  };

  const onDailyClick = () => {
    window.umami?.track('click_daily_checkin_button', { link: '/track/daily-checkin-button' });
    if (!authenticated) {
      onLoginRequired();
      return;
    }
    onCheckIn();
  };

  return (
    <>
      <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end gap-3">
        <div className="relative h-[52px] w-[52px]">
          <DailyCheckinButton checked={checkedToday} submitting={checkinSubmitting} compact darkMode={darkMode} t={t} onClick={onDailyClick} />
        </div>

        <div className="group relative h-[52px] w-[52px]">
          <button
            type="button"
            aria-label={t('feedbackTitle')}
            onClick={openFeedback}
            className={`absolute right-0 top-0 flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full text-white shadow-lg transition-all duration-300 group-hover:w-[190px] group-hover:justify-start group-hover:rounded-2xl group-hover:pl-4 ${darkMode ? 'bg-[#b85f2f] hover:bg-[#cc7040]' : 'bg-[#c86b3c] hover:bg-[#b85f2f]'}`}
          >
            <Send className="h-5 w-5 flex-shrink-0" />
            <span className="ml-0 max-w-0 whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:max-w-[140px] group-hover:opacity-100">{t('feedbackTitle')}</span>
          </button>
        </div>
      </div>

      {successVisible && (
        <div role="status" className={`fixed bottom-8 right-6 z-[60] rounded-lg border px-4 py-3 text-sm shadow-lg ${darkMode ? 'border-[#5f503f] bg-[#2a241d] text-[#f5ead8]' : 'border-[#d8c8ae] bg-[#fff8ec] text-[#4f3b2b]'}`}>
          {t('feedbackSuccess')}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45" role="presentation" onClick={close} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            className={`relative w-full max-w-lg rounded-2xl border p-5 shadow-2xl sm:p-6 ${darkMode ? 'border-[#4a3f33] bg-[#2a241d]' : 'border-[#d8c8ae] bg-[#fff8ec]'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <MessageSquareText className={`h-5 w-5 ${darkMode ? 'text-[#f0a36b]' : 'text-[#b3572a]'}`} />
                <h2 id="feedback-dialog-title" className={`text-lg font-bold ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>{t('feedbackTitle')}</h2>
              </div>
              <button type="button" onClick={close} disabled={feedbackSubmitting} aria-label={t('close')} className={`rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${darkMode ? 'text-[#d8c4ad] hover:bg-[#3a3128]' : 'text-[#6b5845] hover:bg-[#efe1ce]'}`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <label htmlFor="feedback-content" className={`mb-2 block text-sm font-medium ${darkMode ? 'text-[#d8c4ad]' : 'text-[#594635]'}`}>{t('feedbackContentLabel')}</label>
            <textarea
              id="feedback-content"
              rows={6}
              maxLength={FEEDBACK_MAX_CHARS}
              value={text}
              disabled={feedbackSubmitting}
              placeholder={t('feedbackPlaceholder')}
              onChange={(event) => setText(event.target.value.slice(0, FEEDBACK_MAX_CHARS))}
              className={`w-full resize-none rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#c86b3c] disabled:cursor-not-allowed disabled:opacity-60 ${darkMode ? 'border-[#4a3f33] bg-[#241f19] text-[#f5ead8] placeholder:text-[#8f7f69]' : 'border-[#d7c7ae] bg-[#fffaf0] text-[#33261a] placeholder:text-[#8f7f69]'}`}
            />
            <div className="mt-1 flex min-h-6 items-start justify-between gap-4">
              {feedbackError ? <p role="alert" className="text-sm text-[#b14335]">{feedbackError}</p> : <span />}
              <span className={`shrink-0 text-xs ${darkMode ? 'text-[#a89881]' : 'text-[#8f7f69]'}`}>{text.length} / {FEEDBACK_MAX_CHARS}</span>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={close} disabled={feedbackSubmitting} className={`rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${darkMode ? 'text-[#d8c4ad] hover:bg-[#3a3128]' : 'text-[#6b5845] hover:bg-[#efe1ce]'}`}>{t('feedbackCancel')}</button>
              <button type="button" onClick={() => void submit()} disabled={feedbackSubmitting || text.trim().length === 0} className="rounded-lg bg-[#c86b3c] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#b85f2f] disabled:cursor-not-allowed disabled:opacity-50">{t('feedbackSend')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
