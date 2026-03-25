import { Send, MessageSquareText, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const FEEDBACK_EMAIL = 'chinnshi.c@qq.com';
const FEEDBACK_SITE_NAME = '日本語HUB';

type Props = {
  darkMode: boolean;
  t: (key: string) => string;
};

export function FeedbackFab({ darkMode, t }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

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
  };

  const onSubmit = () => {
    if (!text.trim()) return;
    close();
    // 允许浏览器处理 mailto:，打开系统邮件客户端
    window.location.href = mailtoHref;
  };

  return (
    <>
      <button
        type="button"
        aria-label="Feedback"
        onClick={() => setOpen(true)}
        className={`fixed bottom-20 right-6 z-50 p-4 rounded-full shadow-lg transition-colors ${
          darkMode
            ? 'bg-blue-600 text-white hover:bg-blue-500'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <Send className="w-5 h-5" />
      </button>

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
              <a
                href={mailtoHref}
                onClick={(e) => {
                  if (!text.trim()) {
                    e.preventDefault();
                    return;
                  }
                  close();
                }}
                className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <span onClick={(e) => e.stopPropagation()}>{t('feedbackSend')}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

