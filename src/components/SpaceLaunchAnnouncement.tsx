import { BookOpenCheck, CalendarCheck, Link2, Sparkles, Star, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'nihongohub.announcement.spaceLaunch.v1';

type Props = {
  authenticated: boolean;
  authLoading: boolean;
  darkMode: boolean;
  t: (key: string) => string;
  onLogin: () => void;
};

export function SpaceLaunchAnnouncement({ authenticated, authLoading, darkMode, t, onLogin }: Props) {
  const evaluated = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (authLoading || evaluated.current) return;
    evaluated.current = true;
    if (authenticated) return;
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== '1');
    } catch {
      setVisible(true);
    }
  }, [authenticated, authLoading]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // The current page can still dismiss the notice when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismiss, visible]);

  if (!visible) return null;

  const capabilities = [
    { icon: Star, label: t('spaceLaunchMark') },
    { icon: Link2, label: t('spaceLaunchPrivateResource') },
    { icon: BookOpenCheck, label: t('spaceLaunchPath') },
    { icon: CalendarCheck, label: t('spaceLaunchCheckin') },
  ];

  const handleLogin = () => {
    dismiss();
    onLogin();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div role="presentation" className="absolute inset-0 bg-[#21170f]/55 backdrop-blur-[2px]" onClick={dismiss} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="space-launch-title"
        className={`relative w-full max-w-md rounded-[28px] border px-6 py-8 shadow-2xl sm:px-8 ${darkMode ? 'border-[#4a3f33] bg-[#28221c]' : 'border-[#ddcdb6] bg-[#fffaf2]'}`}
      >
        <button
          type="button"
          aria-label={t('close')}
          onClick={dismiss}
          className={`absolute right-4 top-4 rounded-full p-2 transition-colors ${darkMode ? 'text-[#a99784] hover:bg-[#3a3128] hover:text-[#f5ead8]' : 'text-[#8d7962] hover:bg-[#f0e2cf] hover:text-[#2f2218]'}`}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>

        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${darkMode ? 'bg-[#493225] text-[#f0ad78]' : 'bg-[#f5dfca] text-[#a8512c]'}`}>
          <Sparkles aria-hidden="true" className="h-5 w-5" />
        </div>
        <p className={`mt-5 text-xs font-semibold tracking-[0.14em] ${darkMode ? 'text-[#d39a73]' : 'text-[#9a5a37]'}`}>NIHONGO HUB</p>
        <h2 id="space-launch-title" className={`mt-2 pr-8 text-2xl font-bold tracking-tight ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>
          {t('spaceLaunchTitle')}
        </h2>
        <p className={`mt-3 text-sm leading-6 ${darkMode ? 'text-[#c7b5a1]' : 'text-[#6b5845]'}`}>{t('spaceLaunchDescription')}</p>

        <ul className="mt-6 grid grid-cols-2 gap-3">
          {capabilities.map(({ icon: Icon, label }) => (
            <li key={label} className={`flex min-h-20 flex-col justify-between rounded-2xl border p-3 ${darkMode ? 'border-[#4a3f33] bg-[#312a23] text-[#ead8c5]' : 'border-[#e3d4bf] bg-[#fffcf7] text-[#594735]'}`}>
              <Icon aria-hidden="true" className={darkMode ? 'h-4 w-4 text-[#e19a69]' : 'h-4 w-4 text-[#b85f2f]'} />
              <span className="mt-3 text-sm font-medium leading-5">{label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button type="button" onClick={dismiss} className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${darkMode ? 'border-[#59493b] text-[#d8c4ad] hover:bg-[#393028]' : 'border-[#d8c8ae] text-[#6b5845] hover:bg-[#f3e7d6]'}`}>
            {t('spaceLaunchLater')}
          </button>
          <button type="button" onClick={handleLogin} className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${darkMode ? 'border-[#74472e] bg-[#5d341f] text-[#ffe5cf] hover:bg-[#6e3e25]' : 'border-[#b85f2f] bg-[#c86b3c] text-white hover:bg-[#b85f2f]'}`}>
            {t('spaceLaunchLogin')}
          </button>
        </div>
      </section>
    </div>
  );
}
