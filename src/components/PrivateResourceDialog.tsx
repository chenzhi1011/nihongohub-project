import { X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { categories } from '../data/categories';
import { buildPrivateResourceInput, type PrivateResourceDraft } from '../service/privateResourceService';
import type { PrivateResourceInput, ResourceRecord, SavePrivateResourceResult, SimilarResourceMatch } from '../types/resource';

type Props = {
  open: boolean;
  darkMode: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onSubmit: (input: PrivateResourceInput, reviewed: boolean) => Promise<SavePrivateResourceResult>;
  onMarkRecommendation: (resourceId: number, currentMarked: boolean) => void | Promise<void>;
  mode?: 'create' | 'edit';
  initialResource?: ResourceRecord | null;
};

const emptyDraft: PrivateResourceDraft = { category: '', name: '', description: '', url: '', tags: '' };
type FieldErrors = Partial<Record<keyof PrivateResourceDraft, string>>;

function draftFromResource(resource?: ResourceRecord | null): PrivateResourceDraft {
  if (!resource) return emptyDraft;
  return {
    category: resource.category,
    name: resource.name,
    description: resource.description,
    url: resource.url,
    tags: resource.tags.join(', '),
  };
}

export function PrivateResourceDialog({ open, darkMode, t, onClose, onSubmit, onMarkRecommendation, mode = 'create', initialResource = null }: Props) {
  const [draft, setDraft] = useState<PrivateResourceDraft>(() => draftFromResource(initialResource));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<SavePrivateResourceResult | null>(null);
  const [pending, setPending] = useState(false);
  const [requestFailed, setRequestFailed] = useState(false);
  const [validatedInput, setValidatedInput] = useState<PrivateResourceInput | null>(null);

  useEffect(() => {
    setDraft(draftFromResource(initialResource));
    setErrors({});
    setResult(null);
    setRequestFailed(false);
    setValidatedInput(null);
  }, [initialResource, mode, open]);

  if (!open) return null;

  const resetAndClose = () => {
    setDraft(draftFromResource(initialResource));
    setErrors({});
    setResult(null);
    setRequestFailed(false);
    setValidatedInput(null);
    onClose();
  };

  const runSubmit = async (input: PrivateResourceInput, reviewed: boolean) => {
    setPending(true);
    setRequestFailed(false);
    try {
      const nextResult = await onSubmit(input, reviewed);
      if (nextResult.status === 'saved') {
        resetAndClose();
        return;
      }
      setResult(nextResult);
    } catch {
      setRequestFailed(true);
    } finally {
      setPending(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const built = buildPrivateResourceInput(draft);
    if (!built.valid) {
      setErrors(built.errors);
      return;
    }
    setErrors({});
    setResult(null);
    setValidatedInput(built.input);
    void runSubmit(built.input, false);
  };

  const update = (field: keyof PrivateResourceDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const recommendations = result && 'recommendations' in result ? result.recommendations : [];
  const resultMessage = getResultMessage(result, requestFailed, t);
  const inputClass = `w-full rounded-md border px-3 py-2 ${
    darkMode ? 'border-[#4a3f33] bg-[#211c17] text-[#f5ead8]' : 'border-[#d8c8ae] bg-white text-[#2f2218]'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label={t('close')} onClick={resetAndClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="private-resource-title" className={`relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border p-5 shadow-xl ${darkMode ? 'border-[#4a3f33] bg-[#2a241d] text-[#f5ead8]' : 'border-[#d8c8ae] bg-[#fff8ec] text-[#2f2218]'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 id="private-resource-title" className="text-xl font-bold">{t(mode === 'edit' ? 'editResourceTitle' : 'addResource')}</h2>
          <button type="button" onClick={resetAndClose} aria-label={t('close')} className="rounded p-2"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('resourceCategory')} error={errors.category && t(errors.category)}>
            <select value={draft.category} onChange={(event) => update('category', event.target.value)} className={inputClass}>
              <option value="">—</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{t(category.nameKey)}</option>)}
            </select>
          </Field>
          <Field label={t('resourceName')} error={errors.name && t(errors.name)}><input value={draft.name} onChange={(event) => update('name', event.target.value)} className={inputClass} /></Field>
          <Field label={t('resourceDescription')} error={errors.description && t(errors.description)}><textarea value={draft.description} onChange={(event) => update('description', event.target.value)} className={inputClass} rows={3} /></Field>
          <Field label={t('resourceUrl')} error={errors.url && t(errors.url)}><input value={draft.url} onChange={(event) => update('url', event.target.value)} className={inputClass} inputMode="url" /></Field>
          <Field label={t('resourceTags')} error={errors.tags && t(errors.tags)}><input value={draft.tags} onChange={(event) => update('tags', event.target.value)} className={inputClass} /></Field>

          <div aria-live="polite">
            {resultMessage && <p className="text-sm text-[#b3572a]">{resultMessage}</p>}
            {recommendations.length > 0 && <ul className="mt-2 space-y-2">{recommendations.map((match) => <Recommendation key={match.resource.id} match={match} t={t} onMark={onMarkRecommendation} />)}</ul>}
          </div>

          <div className="flex justify-end gap-2">
            {result?.status === 'similar_review_required' && validatedInput && (
              <button type="button" disabled={pending} onClick={() => void runSubmit(validatedInput, true)} className="rounded-md bg-[#b3572a] px-4 py-2 text-white disabled:opacity-50">{t('continueSave')}</button>
            )}
            <button type="submit" disabled={pending} className="rounded-md bg-[#b3572a] px-4 py-2 text-white disabled:opacity-50">{t(mode === 'edit' ? 'updateResource' : 'saveResource')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactElement }) {
  return <label className="block space-y-1 text-sm font-medium"><span>{label}</span>{children}{error && <span role="alert" className="block text-xs text-red-600">{error}</span>}</label>;
}

function Recommendation({ match, t, onMark }: { match: SimilarResourceMatch; t: Props['t']; onMark: Props['onMarkRecommendation'] }) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-md border border-current/20 p-2 text-sm">
      <a href={match.resource.url} target="_blank" rel="noopener noreferrer" className="underline">{match.resource.name} · {t('visitResource')}</a>
      {match.resource.source === 'public' && <button type="button" onClick={() => void onMark(match.resource.id, match.resource.marked)}>{t(match.resource.marked ? 'unmarkResource' : 'markResource')}</button>}
    </li>
  );
}

function getResultMessage(result: SavePrivateResourceResult | null, requestFailed: boolean, t: Props['t']): string | null {
  if (requestFailed) return t('resourceSaveFailed');
  switch (result?.status) {
    case 'exact_url_exists': return t('exactResourceExists');
    case 'similar_review_required': return t('similarResourcesFound');
    case 'similar_limit_reached': return t('similarResourceLimitReached');
    case 'private_limit_reached': return t('privateResourceLimitReached');
    case 'invalid_input': return t('resourceInputInvalid');
    default: return null;
  }
}
