import { useState } from 'react';
import type { PrivateResourceInput, ResourceRecord, SavePrivateResourceResult, SpaceSnapshot } from '../types/resource';
import { categories } from '../data/categories';
import { AddResourceButton } from '../components/AddResourceButton';
import { DeleteResourceDialog } from '../components/DeleteResourceDialog';
import { HistoryRail } from '../components/HistoryRail';
import { PrivateResourceDialog } from '../components/PrivateResourceDialog';
import { ResourceCard } from '../components/ResourceCard';

type Props = {
  authenticated: boolean;
  loading: boolean;
  error: unknown;
  data: SpaceSnapshot | null;
  darkMode: boolean;
  t: (key: string) => string;
  onLoginRequired: () => void;
  onRetry: () => void;
  resolveMarked: (resourceId: number, serverMarked: boolean) => boolean;
  markPendingIds: number[];
  onToggleMark: (resourceId: number, marked: boolean) => void;
  onVisit: (resourceId: number) => void;
  onCreateResource: (input: PrivateResourceInput, reviewed: boolean) => Promise<SavePrivateResourceResult>;
  onUpdateResource: (resourceId: number, input: PrivateResourceInput, reviewed: boolean) => Promise<SavePrivateResourceResult>;
  onDeleteResource: (resourceId: number) => Promise<void>;
};

export function SpacePage({
  authenticated,
  loading,
  error,
  data,
  darkMode,
  t,
  onLoginRequired,
  onRetry,
  resolveMarked,
  markPendingIds,
  onToggleMark,
  onVisit,
  onCreateResource,
  onUpdateResource,
  onDeleteResource,
}: Props) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceRecord | null>(null);
  const [deletingResource, setDeletingResource] = useState<ResourceRecord | null>(null);
  const textColor = darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]';
  const mutedColor = darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]';

  if (!authenticated) {
    return (
      <section className="py-12 text-center">
        <h1 className={`text-3xl font-bold ${textColor}`}>{t('space')}</h1>
        <p className={`mt-3 ${mutedColor}`}>{t('loginRequired')}</p>
        <button
          type="button"
          onClick={onLoginRequired}
          className="mt-5 rounded-lg bg-[#c86b3c] px-5 py-2.5 font-medium text-white hover:bg-[#b85f2f]"
        >
          {t('login')}
        </button>
      </section>
    );
  }

  if (loading) {
    return <p role="status" className={mutedColor}>{t('spaceLoading')}</p>;
  }

  if (error || !data) {
    return (
      <div role="alert" className={`rounded-lg border p-5 text-center ${darkMode ? 'border-[#70453e] bg-[#3b2925] text-[#ffd2ca]' : 'border-[#dfb7ae] bg-[#fff0ed] text-[#7d3027]'}`}>
        <p>{t('spaceLoadFailed')}</p>
        <button type="button" className="mt-3 underline" onClick={onRetry}>{t('retry')}</button>
      </div>
    );
  }

  const empty = data.recentHistory.length === 0 && data.sections.length === 0;

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <h1 className={`text-3xl font-bold ${textColor}`}>{t('space')}</h1>
        <div className="w-48">
          <AddResourceButton darkMode={darkMode} t={t} onClick={() => setCreateDialogOpen(true)} />
        </div>
      </div>
      {empty ? (
        <p className={`mt-4 ${mutedColor}`}>{t('spaceEmpty')}</p>
      ) : (
        <div className="mt-6 space-y-10">
          {data.recentHistory.length > 0 && (
            <div>
              <p className={`mb-3 text-lg font-semibold ${textColor}`}>{t('recentHistory')}</p>
              <HistoryRail items={data.recentHistory} darkMode={darkMode} t={t} onVisit={onVisit} />
            </div>
          )}

          {data.sections.map((section) => {
            const metadata = categories.find((category) => category.id === section.category);
            if (!metadata) return null;
            const visibleResources = section.resources.filter((resource) => (
              resource.source === 'private' || resolveMarked(resource.id, resource.marked)
            ));
            if (visibleResources.length === 0) return null;
            const Icon = metadata.icon;

            return (
              <section key={section.category} aria-labelledby={`space-section-${section.category}`}>
                <div className="mb-4 flex items-center gap-3">
                  <Icon className={`h-6 w-6 ${darkMode ? 'text-[#f0a36b]' : 'text-[#b3572a]'}`} />
                  <h2 id={`space-section-${section.category}`} className={`text-2xl font-semibold ${textColor}`}>
                    {t(metadata.nameKey)}
                  </h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {visibleResources.map((resource) => {
                    const marked = resource.source === 'public'
                      ? resolveMarked(resource.id, resource.marked)
                      : false;
                    return (
                      <ResourceCard
                        key={`${resource.id}-${resource.category}`}
                        resource={resource}
                        authenticated
                        marked={marked}
                        markPending={markPendingIds.includes(resource.id)}
                        darkMode={darkMode}
                        t={t}
                        variant="category"
                        onToggleMark={onToggleMark}
                        onLoginRequired={onLoginRequired}
                        onVisit={onVisit}
                        onEditPrivate={setEditingResource}
                        onDeletePrivate={setDeletingResource}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <PrivateResourceDialog
        open={createDialogOpen}
        darkMode={darkMode}
        t={t}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={onCreateResource}
        onMarkRecommendation={onToggleMark}
      />
      <PrivateResourceDialog
        open={editingResource !== null}
        mode="edit"
        initialResource={editingResource}
        darkMode={darkMode}
        t={t}
        onClose={() => setEditingResource(null)}
        onSubmit={(input, reviewed) => {
          if (!editingResource) return Promise.resolve({ status: 'invalid_input' });
          return onUpdateResource(editingResource.id, input, reviewed);
        }}
        onMarkRecommendation={onToggleMark}
      />
      <DeleteResourceDialog
        open={deletingResource !== null}
        resource={deletingResource}
        darkMode={darkMode}
        t={t}
        onClose={() => setDeletingResource(null)}
        onDelete={onDeleteResource}
      />
    </section>
  );
}
