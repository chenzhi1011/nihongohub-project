type Props = {
  darkMode: boolean;
  t: (key: string) => string;
};

export function Footer({ darkMode, t }: Props) {
  return (
    <footer
      className={`border-t mt-12 transition-colors duration-300 ${
        darkMode ? 'bg-[#2a241d] border-[#4a3f33]' : 'bg-[#fff8ec] border-[#d8c8ae]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`text-center ${darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'}`}>
          <p>{t('footerText')}</p>
          <p className="mt-2 text-sm">{t('footerEncouragement')}</p>
        </div>
      </div>
    </footer>
  );
}
