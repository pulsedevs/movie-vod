import {
  Baby,
  Clapperboard,
  Drama,
  Ghost,
  Heart,
  Laugh,
  Map,
  Music,
  Rocket,
  Search,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Tv,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/** TMDB genre ids (movie + TV share most of them; these ids are fixed by TMDB). */
const NAMES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

const ICONS: Record<number, LucideIcon> = {
  28: Zap,
  12: Map,
  16: Sparkles,
  35: Laugh,
  80: Shield,
  99: Search,
  18: Drama,
  10751: Users,
  14: Sparkles,
  27: Ghost,
  10402: Music,
  9648: Search,
  10749: Heart,
  878: Rocket,
  53: Skull,
  10752: Swords,
  10759: Zap,
  10762: Baby,
  10765: Rocket,
  10768: Swords,
};

export function genreName(id: number | undefined): string | null {
  return id != null ? NAMES[id] ?? null : null;
}

export function genreIcon(id: number | undefined, mediaType: 'movie' | 'tv' = 'movie'): LucideIcon {
  return (id != null && ICONS[id]) || (mediaType === 'tv' ? Tv : Clapperboard);
}
