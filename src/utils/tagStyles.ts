export function getTagColor(tag: string, darkMode: boolean): string {
  if (darkMode) {
    if (tag === 'beginner') return 'bg-green-900 text-green-200';
    if (tag === 'intermediate') return 'bg-yellow-900 text-yellow-200';
    if (tag === 'advanced') return 'bg-red-900 text-red-200';
    if (tag === 'free') return 'bg-blue-900 text-blue-200';
    if (tag === 'premium') return 'bg-purple-900 text-purple-200';
    if (tag === 'grammar') return 'bg-pink-900 text-pink-200';
    if (tag === 'pronunciation') return 'bg-indigo-900 text-indigo-200';
    if (tag === 'phrase') return 'bg-teal-900 text-teal-200';
    if (tag === 'all levels') return 'bg-gray-800 text-gray-100';
    if (tag === 'structured') return 'bg-amber-900 text-amber-200';
    if (tag === 'news') return 'bg-cyan-900 text-cyan-200';
    if (tag === 'video') return 'bg-orange-900 text-orange-200';
    if (tag === 'podcast') return 'bg-rose-900 text-rose-200';
    if (tag === 'lecture') return 'bg-lime-900 text-lime-200';
    if (tag === 'paper') return 'bg-sky-900 text-sky-200';
    if (tag === 'dictionary') return 'bg-stone-900 text-stone-200';
    if (tag === 'writing') return 'bg-fuchsia-900 text-fuchsia-200';
    return 'bg-gray-700 text-gray-200';
  }

  if (tag === 'beginner') return 'bg-green-100 text-green-800';
  if (tag === 'intermediate') return 'bg-yellow-100 text-yellow-800';
  if (tag === 'advanced') return 'bg-red-100 text-red-800';
  if (tag === 'free') return 'bg-blue-100 text-blue-800';
  if (tag === 'premium') return 'bg-purple-100 text-purple-800';
  if (tag === 'grammar') return 'bg-pink-100 text-pink-800';
  if (tag === 'pronunciation') return 'bg-indigo-100 text-indigo-800';
  if (tag === 'phrase') return 'bg-teal-100 text-teal-800';
  if (tag === 'all levels') return 'bg-gray-100 text-gray-800';
  if (tag === 'structured') return 'bg-amber-100 text-amber-800';
  if (tag === 'news') return 'bg-cyan-100 text-cyan-800';
  if (tag === 'video') return 'bg-orange-100 text-orange-800';
  if (tag === 'podcast') return 'bg-rose-100 text-rose-800';
  if (tag === 'lecture') return 'bg-lime-100 text-lime-800';
  if (tag === 'paper') return 'bg-sky-100 text-sky-800';
  if (tag === 'dictionary') return 'bg-stone-100 text-stone-800';
  if (tag === 'writing') return 'bg-fuchsia-100 text-fuchsia-800';
  return 'bg-gray-100 text-gray-800';
}
