import { Plus } from 'lucide-react';

type Props = {
  darkMode: boolean;
  t: (key: string) => string;
  onClick: () => void;
};

export function AddResourceButton({ darkMode, t, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors duration-200 ${
        darkMode
          ? 'border-[#6e4b35] bg-[#3a2d24] text-[#ffd7b6] hover:bg-[#49372a]'
          : 'border-[#d7ad87] bg-[#fff8ec] text-[#8f4621] hover:bg-[#f6e5d3]'
      }`}
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      <span>{t('addResource')}</span>
    </button>
  );
}
