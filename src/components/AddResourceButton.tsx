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
      className={`w-full rounded-lg border p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
        darkMode ? 'border-[#4a3f33] bg-[#2a241d]' : 'border-[#d8c8ae] bg-[#fff8ec]'
      }`}
    >
      <span className="flex min-h-[124px] flex-col items-center justify-center gap-2 text-center">
        <Plus className={`h-5 w-5 ${darkMode ? 'text-[#f0a36b]' : 'text-[#b3572a]'}`} />
        <span className={`text-[1.05rem] font-semibold ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>
          {t('addResource')}
        </span>
      </span>
    </button>
  );
}
