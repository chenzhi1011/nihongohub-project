import { LockKeyhole } from 'lucide-react';

type Props = {
  lockedCount: number;
  darkMode: boolean;
  t: (key: string) => string;
  onLoginRequired: () => void;
};

export function LockedResourcesCard({ lockedCount, darkMode, t, onLoginRequired }: Props) {
  const countText = t('lockedResources').replace('{count}', String(lockedCount));

  return (
    <div className={`flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center ${
      darkMode ? 'border-[#6a5948] bg-[#2a241d]/70' : 'border-[#c9b79d] bg-[#fff8ec]/70'
    }`}>
      <LockKeyhole className={`h-6 w-6 ${darkMode ? 'text-[#b9a58d]' : 'text-[#8f7f69]'}`} />
      <p className={`mt-3 font-medium ${darkMode ? 'text-[#e5d4c0]' : 'text-[#4f3d2c]'}`}>{countText}</p>
      <button
        type="button"
        onClick={onLoginRequired}
        className={`mt-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          darkMode
            ? 'bg-[#5d341f] text-[#ffd7b6] hover:bg-[#6e3e25]'
            : 'bg-[#f6d9bf] text-[#8f4621] hover:bg-[#f1c8a3]'
        }`}
      >
        {t('loginToViewMore')}
      </button>
    </div>
  );
}
