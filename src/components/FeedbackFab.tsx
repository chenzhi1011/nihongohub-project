import { MessageSquareText, Send, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DailyCheckinButton } from './DailyCheckinButton';

const FEEDBACK_EMAIL = 'chinnshi.c@qq.com';
const FEEDBACK_SITE_NAME = '日本語HUB';
const FEEDBACK_LAST_SENT_AT_KEY = 'nihongohub.feedbackLastSentAt.v1';
const FEEDBACK_MAX_CHARS = 1000;
// 防止恶意触发 mail client（localStorage 维持跨刷新）
const FEEDBACK_COOLDOWN_MS = 180_000; // 3 minutes

type Props = {
  darkMode: boolean;
  t: (key: string) => string;
  authenticated: boolean;
  checkedToday: boolean;
  checkinSubmitting: boolean;
  onCheckIn: () => void;
  onLoginRequired: () => void;
};

export function FeedbackFab({
  darkMode,
  t,
  authenticated,
  checkedToday,
  checkinSubmitting,
  onCheckIn,
  onLoginRequired,
}: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [resourcePref, setResourcePref] = useState('');
  const [resourcePrefOther, setResourcePrefOther] = useState('');
  const [featurePref, setFeaturePref] = useState('');
  const [featurePrefOther, setFeaturePrefOther] = useState('');

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

  const subject = useMemo(() => '日本語HUB - 发送意见', []);

  const mailtoHref = useMemo(() => {
    const resourceAnswer = resourcePref === '其他（填写）' ? `其他：${resourcePrefOther.trim()}` : resourcePref;
    const featureAnswer = featurePref === '其他（填写）' ? `其他：${featurePrefOther.trim()}` : featurePref;

    const bodyLines = [
      '【问卷】',
      `1. 你喜欢添加哪一类资源/工具：${resourceAnswer || '未选择'}`,
      `2. 你希望网站增加什么功能：${featureAnswer || '未选择'}`,
      '',
      '【意见】',
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
  }, [featurePref, featurePrefOther, resourcePref, resourcePrefOther, subject, text]);

  const close = () => {
    setOpen(false);
    setText('');
    setSendError('');
    setResourcePref('');
    setResourcePrefOther('');
    setFeaturePref('');
    setFeaturePrefOther('');
  };

  const onSubmit = () => {
    const trimmed = text.trim();
    if (trimmed.length > FEEDBACK_MAX_CHARS) {
      setSendError('意见过长，请控制在 1000 字符以内。');
      return;
    }

    const now = Date.now();
    if (lastSentAt !== null && now - lastSentAt < FEEDBACK_COOLDOWN_MS) {
      setSendError('发送太频繁，请稍后再试。');
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
        {/* Daily check-in */}
        <div className="relative h-[52px] w-[52px]">
          <DailyCheckinButton
            checked={checkedToday}
            submitting={checkinSubmitting}
            compact
            darkMode={darkMode}
            t={t}
            onClick={onDailyClick}
          />
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
                    发送意见
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

            <div className="space-y-2 mt-5">
              <label className={`block text-sm font-medium ${darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'}`}>
                1. 你喜欢添加哪一类资源/工具
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['考级类', '听力练习类', '口语练习类', '写作类', '其他（填写）'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setResourcePref(item)}
                    className={`px-2 py-1.5 rounded border text-xs text-left transition-colors ${
                      resourcePref === item
                        ? darkMode
                          ? 'bg-[#7a4c2f] border-[#ca8958] text-[#ffe4c6]'
                          : 'bg-[#eac7a0] border-[#c88752] text-[#3a281a]'
                        : darkMode
                          ? 'border-[#4a3f33] text-[#d8c4ad] hover:bg-[#3a3128]'
                          : 'border-[#d7c7ae] text-[#6b5845] hover:bg-[#efe1ce]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {resourcePref === '其他（填写）' && (
                <input
                  value={resourcePrefOther}
                  onChange={(e) => setResourcePrefOther(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors text-sm ${
                    darkMode
                      ? 'bg-[#241f19] border-[#4a3f33] text-[#f5ead8] placeholder-[#8f7f69] focus:ring-2 focus:ring-[#c86b3c]'
                      : 'bg-[#fffaf0] border-[#d7c7ae] text-[#33261a] placeholder-[#8f7f69] focus:ring-2 focus:ring-[#c86b3c]'
                  }`}
                  placeholder="请填写其他资源类型"
                />
              )}
            </div>

            <div className="space-y-2 mt-5">
              <label className={`block text-sm font-medium ${darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'}`}>
                2. 你希望网站增加什么功能
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['每日打卡', '学习内容记录', '增加自己个性资源', '其他（填写）'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFeaturePref(item)}
                    className={`px-2 py-1.5 rounded border text-xs text-left transition-colors ${
                      featurePref === item
                        ? darkMode
                          ? 'bg-[#7a4c2f] border-[#ca8958] text-[#ffe4c6]'
                          : 'bg-[#eac7a0] border-[#c88752] text-[#3a281a]'
                        : darkMode
                          ? 'border-[#4a3f33] text-[#d8c4ad] hover:bg-[#3a3128]'
                          : 'border-[#d7c7ae] text-[#6b5845] hover:bg-[#efe1ce]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {featurePref === '其他（填写）' && (
                <input
                  value={featurePrefOther}
                  onChange={(e) => setFeaturePrefOther(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors text-sm ${
                    darkMode
                      ? 'bg-[#241f19] border-[#4a3f33] text-[#f5ead8] placeholder-[#8f7f69] focus:ring-2 focus:ring-[#c86b3c]'
                      : 'bg-[#fffaf0] border-[#d7c7ae] text-[#33261a] placeholder-[#8f7f69] focus:ring-2 focus:ring-[#c86b3c]'
                  }`}
                  placeholder="请填写你希望新增的功能"
                />
              )}
            </div>

            <div className="space-y-2 mt-7">
              <label className={`block text-sm font-medium ${darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'}`}>
                其他意见
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
                placeholder="请填写你的意见（选填，会通过邮件发送给开发者）"
              />
            </div>

            {sendError && <div className={`text-sm mt-3 ${darkMode ? 'text-red-300' : 'text-red-600'}`}>{sendError}</div>}

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
                取消
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={text.trim().length > FEEDBACK_MAX_CHARS || (lastSentAt !== null && Date.now() - lastSentAt < FEEDBACK_COOLDOWN_MS)}
                className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                  darkMode ? 'bg-[#b85f2f] hover:bg-[#cc7040] text-white' : 'bg-[#c86b3c] hover:bg-[#b85f2f] text-white'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
