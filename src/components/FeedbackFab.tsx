import { MessageSquareText, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';

const FEEDBACK_EMAIL = 'chinnshi.c@qq.com';
const FEEDBACK_SITE_NAME = '日本語HUB';
const FEEDBACK_LAST_SENT_AT_KEY = 'nihongohub.feedbackLastSentAt.v1';
const FEEDBACK_MAX_CHARS = 1000;
// 防止恶意触发 mail client（localStorage 维持跨刷新）
const FEEDBACK_COOLDOWN_MS = 180_000; // 3 minutes

type Props = {
  darkMode: boolean;
  t: (key: string) => string;
};

export function FeedbackFab({ darkMode, t }: Props) {
  const [open, setOpen] = useState(false);
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [text, setText] = useState('');

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

  const onDailyClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.umami?.track('click_daily_checkin_button', { link: '/track/daily-checkin-button' });
    setDevModalOpen(true);
  };

  return (
    <>
      <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end gap-3">
        {/* Daily check-in */}
        <div className="relative w-[52px] h-[52px] group">
          <a
            href="/track/daily-checkin-button"
            aria-label="Daily check-in"
            onClick={onDailyClick}
            className={`absolute right-0 top-0 flex items-center justify-center gap-2 h-[52px] w-[52px] rounded-full overflow-hidden transition-all duration-300 shadow-lg text-white ${
              darkMode ? 'bg-[#2f6f5a] hover:bg-[#3a846c]' : 'bg-[#3b7d67] hover:bg-[#2f6f5a]'
            } group-hover:w-[180px] group-hover:rounded-2xl group-hover:justify-start group-hover:pl-4`}
          >
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <span
              className={`whitespace-nowrap font-semibold text-sm max-w-0 opacity-0 transition-all duration-300 ${
                darkMode ? 'text-white' : 'text-white'
              } group-hover:max-w-[120px] group-hover:opacity-100 ml-0`}
            >
              {t('dailyCheckInButton')}
            </span>
          </a>
        </div>

        {/* Feedback */}
        <div className="relative w-[52px] h-[52px] group">
          <button
            type="button"
            aria-label="Feedback"
            onClick={() => setOpen(true)}
            className={`absolute right-0 top-0 flex items-center justify-center h-[52px] w-[52px] rounded-full overflow-hidden transition-all duration-300 shadow-lg text-white ${
              darkMode ? 'bg-[#b85f2f] hover:bg-[#cc7040]' : 'bg-[#c86b3c] hover:bg-[#b85f2f]'
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
              darkMode ? 'bg-[#2a241d] border-[#4a3f33]' : 'bg-[#fff8ec] border-[#d8c8ae]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-2">
                <MessageSquareText className={darkMode ? 'text-[#f0a36b]' : 'text-[#b3572a]'} />
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>
                    {t('feedbackTitle')}
                  </h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-[#a89881]' : 'text-[#8f7f69]'}`}>
                    {FEEDBACK_SITE_NAME}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={close}
                className={`p-2 rounded-md transition-colors ${
                  darkMode ? 'text-[#d8c4ad] hover:bg-[#3a3128]' : 'text-[#6b5845] hover:bg-[#efe1ce]'
                }`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'}`}>
                {t('feedbackTitle')}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
                  darkMode
                    ? 'bg-[#241f19] border-[#4a3f33] text-[#f5ead8] placeholder-[#8f7f69] focus:ring-2 focus:ring-[#c86b3c]'
                    : 'bg-[#fffaf0] border-[#d7c7ae] text-[#33261a] placeholder-[#8f7f69] focus:ring-2 focus:ring-[#c86b3c]'
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
                    ? 'border-[#4a3f33] text-[#d8c4ad] hover:bg-[#3a3128]'
                    : 'border-[#d7c7ae] text-[#6b5845] hover:bg-[#efe1ce]'
                }`}
              >
                {t('feedbackCancel')}
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={!text.trim() || text.trim().length > FEEDBACK_MAX_CHARS || (lastSentAt !== null && Date.now() - lastSentAt < FEEDBACK_COOLDOWN_MS)}
                className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                  darkMode ? 'bg-[#b85f2f] hover:bg-[#cc7040] text-white' : 'bg-[#c86b3c] hover:bg-[#b85f2f] text-white'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {t('feedbackSend')}
              </button>
            </div>
          </div>
        </div>
      )}

      {devModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            role="presentation"
            onClick={() => setDevModalOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            className={`relative w-full max-w-sm rounded-lg shadow-lg border p-4 ${
              darkMode ? 'bg-[#2a241d] border-[#4a3f33]' : 'bg-[#fff8ec] border-[#d8c8ae]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-bold ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>
                {t('devInProgressTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setDevModalOpen(false)}
                className={`p-2 rounded-md transition-colors ${
                  darkMode ? 'text-[#d8c4ad] hover:bg-[#3a3128]' : 'text-[#6b5845] hover:bg-[#efe1ce]'
                }`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`${darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'} text-sm`}>{t('devInProgressDesc')}</p>
            <button
              type="button"
              onClick={() => setDevModalOpen(false)}
              className={`mt-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-[#3a3128] text-[#d8c4ad] hover:bg-[#4a3e31] hover:text-[#fff0dc]'
                  : 'bg-[#efe1ce] text-[#6b5845] hover:bg-[#e7d5bd] hover:text-[#3f3022]'
              }`}
            >
              {t('devInProgressOk')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
