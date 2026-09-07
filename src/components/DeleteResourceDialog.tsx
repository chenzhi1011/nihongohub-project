import { X } from 'lucide-react';
import { useState } from 'react';
import type { ResourceRecord } from '../types/resource';

type Props = {
  open: boolean;
  resource: ResourceRecord | null;
  darkMode: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onDelete: (resourceId: number) => Promise<void>;
};

export function DeleteResourceDialog({ open, resource, darkMode, t, onClose, onDelete }: Props) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!open || !resource) return null;

  const close = () => {
    if (pending) return;
    setFailed(false);
    onClose();
  };

  const confirmDelete = async () => {
    if (pending) return;
    setPending(true);
    setFailed(false);
    try {
      await onDelete(resource.id);
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label={t('close')} onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-resource-title"
        className={`relative w-full max-w-md rounded-lg border p-5 shadow-xl ${
          darkMode ? 'border-[#4a3f33] bg-[#2a241d] text-[#f5ead8]' : 'border-[#d8c8ae] bg-[#fff8ec] text-[#2f2218]'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="delete-resource-title" className="text-xl font-bold">{t('deleteResourceTitle')}</h2>
          <button type="button" disabled={pending} onClick={close} aria-label={t('close')} className="rounded p-2 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-4">{t('deleteResourceQuestion')}</p>
        <p className="mt-2 font-semibold">{resource.name}</p>
        <div aria-live="polite">
          {failed && <p className="mt-3 text-sm text-red-600">{t('resourceDeleteFailed')}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" disabled={pending} onClick={close} className="rounded-md border border-current/20 px-4 py-2 disabled:opacity-50">
            {t('cancel')}
          </button>
          <button type="button" disabled={pending} onClick={() => void confirmDelete()} className="rounded-md bg-red-600 px-4 py-2 text-white disabled:opacity-50">
            {t(pending ? 'deletingResource' : 'confirmDeleteResource')}
          </button>
        </div>
      </div>
    </div>
  );
}
