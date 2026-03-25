import { CheckCircle2, MessageSquareText, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const FEEDBACK_EMAIL = 'chinnshi.c@qq.com';
const FEEDBACK_SITE_NAME = '日本語HUB';
const DAILY_STORAGE_KEY = 'nihongohub.dailyCheckInDate.v1';
const FEEDBACK_LAST_SENT_AT_KEY = 'nihongohub.feedbackLastSentAt.v1';
const FEEDBACK_MAX_CHARS = 1000;
// 防止恶意触发 mail client（localStorage 维持跨刷新）
const FEEDBACK_COOLDOWN_MS = 180_000; // 3 minutes

function getLocalISODate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type Props = {
  darkMode: boolean;
  t: (key: string) => string;
};

export function FeedbackFab({ darkMode, t }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const today = useMemo(() => getLocalISODate(), []);
  const [dailyCheckedIn, setDailyCheckedIn] = useState(false);
  const [dailyCelebrating, setDailyCelebrating] = useState(false);
  const [sendError, setSendError] = useState<string>('');
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DAILY_STORAGE_KEY);
      setDailyCheckedIn(saved === today);
    } catch {
      setDailyCheckedIn(false);
    }
  }, [today]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FEEDBACK_LAST_SENT_AT_KEY);
      const n = raw ? Number(raw) : null;
      setLastSentAt(typeof n === 'number' && Number.isFinite(n) ? n : null);
    } catch {
      setLastSentAt(null);
    }
  }, []);

  const subject = useMemo(() => t('feedbackSubmitSubject'), [t]);

  const mailtoHref = useMemo(() => {
    const bodyLines = [
      text.trim(),
      '',
      '---',
      `页面：${typeof window !== 'undefined' ? window.location.href : ''}`,
    ];
    const body = bodyLines.filter(Boolean).join('\n');

    const params = new URLSearchParams({
      subject,
      body,
    });

    return `mailto:${FEEDBACK_EMAIL}?${params.toString()}`;
  }, [subject, text]);

  const close = () => {
    setOpen(false);
    setText('');
    setSendError('');
  };

  const onSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > FEEDBACK_MAX_CHARS) {
      setSendError(t('feedbackTooLongError'));
      return;
    }

    const now = Date.now();
    if (lastSentAt !== null && now - lastSentAt < FEEDBACK_COOLDOWN_MS) {
      setSendError(t('feedbackCooldownError'));
      return;
    }

    // 固定当前 mailtoHref，避免 close() 清空 text 后正文变空
    const href = mailtoHref;

    setLastSentAt(now);
    try {
      window.localStorage.setItem(FEEDBACK_LAST_SENT_AT_KEY, String(now));
    } catch {
      // ignore
    }

    close();
    // 允许浏览器处理 mailto:，打开系统邮件客户端
    window.location.href = href;
  };

  const onDailyClick = () => {
    if (!dailyCheckedIn) {
      try {
        window.localStorage.setItem(DAILY_STORAGE_KEY, today);
      } catch {
        // ignore
      }
      setDailyCheckedIn(true);
    }

    setDailyCelebrating(true);
    window.setTimeout(() => setDailyCelebrating(false), 1200);
  };

  return (
    <>
      <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end gap-3">
        {/* Daily check-in */}
        <div className="relative w-[52px] h-[52px] group">
          <button
            type="button"
            aria-label="Daily check-in"
            onClick={onDailyClick}
            className={`absolute right-0 top-0 flex items-center justify-center gap-2 h-[52px] w-[52px] rounded-full overflow-hidden transition-all duration-300 shadow-lg text-white ${
              darkMode
                ? dailyCheckedIn
                  ? 'bg-emerald-700 hover:bg-emerald-600'
                  : 'bg-emerald-600 hover:bg-emerald-500'
                : dailyCheckedIn
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
            } group-hover:w-[180px] group-hover:rounded-2xl group-hover:justify-start group-hover:pl-4`}
          >
            {dailyCelebrating && (
              <span
                className={`pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/50 animate-ping`}
              />
            )}
            {dailyCheckedIn ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <Sparkles className="w-5 h-5 flex-shrink-0" />}
            <span
              className={`whitespace-nowrap font-semibold text-sm max-w-0 opacity-0 transition-all duration-300 ${
                darkMode ? 'text-white' : 'text-white'
              } group-hover:max-w-[120px] group-hover:opacity-100 ml-0`}
            >
              {dailyCheckedIn ? t('dailyCheckInDone') : t('dailyCheckInButton')}
            </span>
          </button>
        </div>

        {/* Feedback */}
        <div className="relative w-[52px] h-[52px] group">
          <button
            type="button"
            aria-label="Feedback"
            onClick={() => setOpen(true)}
            className={`absolute right-0 top-0 flex items-center justify-center h-[52px] w-[52px] rounded-full overflow-hidden transition-all duration-300 shadow-lg text-white ${
              darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'
            } group-hover:w-[190px] group-hover:rounded-2xl group-hover:justify-start group-hover:pl-4`}
          >
            <Send className="w-5 h-5 flex-shrink-0" />
            <span
              className="whitespace-nowrap font-semibold text-sm max-w-0 opacity-0 transition-all duration-300 group-hover:max-w-[140px] group-hover:opacity-100 ml-0"
            >
              {t('feedbackTitle')}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            role="presentation"
            onClick={close}
          />

          <div
            role="dialog"
            aria-modal="true"
            className={`relative w-full max-w-lg rounded-lg shadow-lg border p-4 ${
              darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-2">
                <MessageSquareText className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('feedbackTitle')}
                  </h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {FEEDBACK_SITE_NAME}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={close}
                className={`p-2 rounded-md transition-colors ${
                  darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {t('feedbackTitle')}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500'
                }`}
                rows={5}
                placeholder={t('feedbackPlaceholder')}
              />
            </div>

            {sendError && (
              <div className={`text-sm mt-3 ${darkMode ? 'text-red-300' : 'text-red-600'}`}>{sendError}</div>
            )}

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={close}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('feedbackCancel')}
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={!text.trim() || text.trim().length > FEEDBACK_MAX_CHARS || (lastSentAt !== null && Date.now() - lastSentAt < FEEDBACK_COOLDOWN_MS)}
                className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {t('feedbackSend')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

