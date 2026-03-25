import { Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';

type Props = {
  darkMode: boolean;
  t: (key: string) => string;
};

export function AddResourceButton({ darkMode, t }: Props) {
  const [open, setOpen] = useState(false);

  const cardClassName = useMemo(
    () =>
      `rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 ${
        darkMode ? 'bg-[#2a241d] border-[#4a3f33]' : 'bg-[#fff8ec] border-[#d8c8ae]'
      }`,
    [darkMode],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.umami?.track('click_add_resource_button', { link: '/track/add-resource-button' });
    setOpen(true);
  };

  return (
    <>
      <a
        href="/track/add-resource-button"
        onClick={handleClick}
        className={cardClassName}
      >
        <div className="flex items-start gap-3">
          <Plus
            className={`w-5 h-5 mt-0.5 ${
              darkMode ? 'text-[#f0a36b]' : 'text-[#b3572a]'
            }`}
          />
          <div className="text-left">
            <div className={`text-sm font-semibold ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>
              {t('addResource')}
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'}`}>
              {t('addResourceTitle')}
            </div>
          </div>
        </div>
      </a>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            role="presentation"
            onClick={() => setOpen(false)}
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
                onClick={() => setOpen(false)}
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
              onClick={() => setOpen(false)}
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
