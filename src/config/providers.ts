export type ProviderSlug = 'netflix' | 'max' | 'disney' | 'prime';

export interface StreamProvider {
  slug: ProviderSlug;
  name: string;
  tmdbId: number;
  color: string;
  bgColor: string;
}

export const PROVIDERS: StreamProvider[] = [
  { slug: 'netflix', name: 'Netflix',      tmdbId: 8,    color: '#E50914', bgColor: 'rgba(229,9,20,0.26)' },
  { slug: 'max',     name: 'Max',          tmdbId: 1899, color: '#002BE7', bgColor: 'rgba(0,43,231,0.26)' },
  { slug: 'disney',  name: 'Disney+',      tmdbId: 337,  color: '#0C56D0', bgColor: 'rgba(12,86,208,0.26)' },
  { slug: 'prime',   name: 'Prime Video',  tmdbId: 9,    color: '#00A8E0', bgColor: 'rgba(0,168,224,0.26)' },
];

export function getProvider(slug: string): StreamProvider | undefined {
  return PROVIDERS.find((p) => p.slug === slug);
}
