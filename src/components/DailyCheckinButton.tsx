import { Check, Circle } from 'lucide-react';

type Props = {
  checked: boolean;
  submitting: boolean;
  compact: boolean;
  darkMode: boolean;
  t: (key: string) => string;
  onClick: () => void;
};

export function DailyCheckinButton({ checked, submitting, compact, darkMode, t, onClick }: Props) {
  const label = checked
    ? t('dailyCheckInDone')
    : submitting
      ? t('dailyCheckInSubmitting')
      : t('dailyCheckInButton');
  const disabled = checked || submitting;

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={compact
        ? `group absolute right-0 top-0 flex h-[52px] w-[52px] items-center justify-center gap-0 overflow-hidden rounded-full text-white shadow-lg transition-all duration-300 hover:w-[180px] hover:justify-start hover:gap-2 hover:rounded-2xl hover:pl-4 disabled:cursor-default ${
          checked
            ? darkMode ? 'bg-[#466b5e]' : 'bg-[#568372]'
            : darkMode ? 'bg-[#2f6f5a] hover:bg-[#3a846c]' : 'bg-[#3b7d67] hover:bg-[#2f6f5a]'
        }`
        : `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-default ${
          checked
            ? darkMode ? 'bg-[#466b5e]' : 'bg-[#568372]'
            : darkMode ? 'bg-[#2f6f5a] hover:bg-[#3a846c]' : 'bg-[#3b7d67] hover:bg-[#2f6f5a]'
        }`
      }
    >
      <span className="relative flex h-5 w-5 flex-shrink-0">
        <Circle className="h-5 w-5" />
        {(checked || !submitting) && (
          <Check className="absolute inset-0 m-auto h-6 w-6" strokeWidth={2.75} />
        )}
      </span>
      <span className={compact
        ? 'ml-0 max-w-0 whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:max-w-[120px] group-hover:opacity-100'
        : 'whitespace-nowrap'}
      >
        {label}
      </span>
    </button>
  );
}
