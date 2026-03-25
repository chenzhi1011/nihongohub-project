import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Language } from '../data/types';

const STORAGE_KEY = 'nihongohub.updateNoticeDismissed.v1';

type Props = {
  darkMode: boolean;
  language: Language;
};

export function UpdateNotice({ darkMode, language }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY) === '1';
      setVisible(!dismissed);
    } catch {
      setVisible(true);
    }
  }, []);

  const close = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore write failure
    }
  };

  if (!visible) return null;

  const title = language === 'zh' ? '功能更新' : '機能アップデート';
  const lines = language === 'zh'
    ? [
        '已更新 UI 视觉风格',
        '意见箱已开放',
        '每日打卡功能（开发中）',
        '私人学习资源功能（开发中）',
      ]
    : [
        'UI デザインを更新しました',
        'ご意見ボックスを公開しました',
        '毎日チェック機能（開発中）',
        '個人学習リソース機能（開発中）',
      ];

  return (
    <div
      className={`w-full rounded-lg border px-4 py-3 transition-colors ${
        darkMode
          ? 'bg-[#2a241d]/65 border-[#4a3f33] text-[#cfbda7]'
          : 'bg-[#fff8ec]/82 border-[#dcccb1] text-[#705d4a]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold tracking-[0.14em] ${darkMode ? 'text-[#e3cfb8]' : 'text-[#7e684f]'}`}>
            {title}
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1.5 text-xs leading-5 md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-1.5 md:space-y-0">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          aria-label="Dismiss update notice"
          onClick={close}
          className={`rounded p-1 transition-colors ${
            darkMode ? 'text-[#bba894] hover:bg-[#3a3128] hover:text-[#f0e0cc]' : 'text-[#8a765f] hover:bg-[#efe1ce] hover:text-[#5d4b38]'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
