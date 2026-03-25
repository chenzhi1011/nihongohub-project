type Props = {
  darkMode: boolean;
  t: (key: string) => string;
};

export function Footer({ darkMode, t }: Props) {
  return (
    <footer
      className={`border-t mt-12 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <p>{t('footerText')}</p>
          <p className="mt-2 text-sm">{t('footerEncouragement')}</p>
        </div>
      </div>
    </footer>
  );
}
