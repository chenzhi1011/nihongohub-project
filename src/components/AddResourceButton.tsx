import { Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Resource } from '../data/types';

type Props = {
  darkMode: boolean;
  t: (key: string) => string;
  onSubmit: (resource: Resource) => void;
};

export function AddResourceButton({ darkMode, t, onSubmit }: Props) {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const cardClassName = useMemo(
    () =>
      `rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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

  const resetForm = () => {
    setName('');
    setDescription('');
    setUrl('');
    setTagsInput('');
  };

  const close = () => {
    setOpen(false);
    resetForm();
  };

  const parseTags = (raw: string): string[] => {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedUrl = url.trim();
    const tags = parseTags(tagsInput);

    if (!trimmedName || !trimmedDescription || !trimmedUrl) {
      // 简单校验：避免提交空字段
      return;
    }

    onSubmit({
      name: trimmedName,
      description: trimmedDescription,
      url: trimmedUrl,
      tags,
    });

    close();
  };

  return (
    <>
      <button type="button" className={cardClassName} onClick={() => setOpen(true)}>
        <div className="flex items-start gap-3">
          <Plus
            className={`w-5 h-5 mt-0.5 ${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            }`}
          />
          <div className="text-left">
            <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('addResource')}
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('addResourceTitle')}
            </div>
          </div>
        </div>
      </button>

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
              darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('addResourceTitle')}
              </h3>
              <button
                type="button"
                onClick={close}
                className={`p-2 rounded-md transition-colors ${
                  darkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('addResourceName')}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500'
                  }`}
                  placeholder="e.g. 日本語の教材"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('addResourceDescription')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500'
                  }`}
                  rows={3}
                  placeholder="e.g. 简短说明（你添加的资源用途）"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('addResourceUrl')}
                </label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500'
                  }`}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('addResourceTags')}
                </label>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500'
                  }`}
                  placeholder="beginner,grammar,pronunciation"
                />
              </div>

              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} `}>
                {t('addResourceHint')}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    darkMode
                      ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t('addResourceCancel')}
                </button>
                <button
                  type="submit"
                  className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {t('addResourceSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

