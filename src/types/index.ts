// src/types/index.ts
export interface Genre {
  id: number;
  name: string;
}

// Type for the genre list API response
export interface GenreApiResponse {
  genres: Genre[];
}


// --- Basic Media Types ---
export interface BaseMediaItem {
  id: number;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  vote_count?: number;
  backdrop_path?: string | null;
  logo_path?: string | null; // Path to official logo image from TMDB
  genres?: Genre[];
  genre_ids?: number[]; // For list responses
}

// --- Movie Related Types ---
export interface Movie extends BaseMediaItem {
  title: string;
  release_date: string;
  runtime?: number; // Optional runtime in minutes
  adult?: boolean; // Optional flag for adult content
  imdb_id?: string | null;
  media_type: 'movie'; // Literal type 'movie'
  trailerId?: string; // Optional trailer ID for YouTube or other platforms
}

export interface MovieApiResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

// --- TV Show Related Types ---
export interface Season {
  air_date: string | null;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  air_date: string | null;
  episode_number: number;
  production_code: string;
  runtime: number | null;
  season_number: number;
  show_id: number; // Belongs to which show
  still_path: string | null; // Backdrop for episode
}

export interface Network {
  id: number;
  name: string;
  logo_path?: string | null;
  origin_country?: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path?: string | null;
  origin_country?: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface ContentRating {
  iso_3166_1: string;
  rating: string;
}

export interface ContentRatings {
  results: ContentRating[];
}

export interface Creator {
  id: number;
  name: string;
  profile_path?: string | null;
  credit_id?: string;
  gender?: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  credit_id: string;
  order: number;
  gender?: number;
  known_for_department?: string;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
  credit_id: string;
  gender?: number;
}

export interface Credits {
  cast?: CastMember[];
  crew?: CrewMember[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface Videos {
  results: Video[];
}

export interface Keyword {
  id: number;
  name: string;
}

export interface Keywords {
  results: Keyword[];
}

export interface ExternalIds {
  imdb_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
}

export interface RelatedShow extends BaseMediaItem {
  name: string;
  first_air_date: string;
  original_language: string;
  popularity: number;
  media_type: 'tv';
}

export interface WatchProviderData {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProvidersResult {
  link: string;
  flatrate?: WatchProviderData[];
  rent?: WatchProviderData[];
  buy?: WatchProviderData[];
}

export interface WatchProviders {
  results: {
    [countryCode: string]: WatchProvidersResult;
  };
}

export interface TVShow extends BaseMediaItem {
  name: string;
  first_air_date: string;
  last_air_date?: string;
  number_of_episodes?: number;
  number_of_seasons?: number;
  seasons?: Season[];
  status?: string;
  networks?: Network[];
  episode_run_time?: number[];
  runtime?: number; // Optional runtime in minutes (calculated from episode_run_time)
  adult?: boolean; // Optional flag for adult content
  created_by?: Creator[];
  production_companies?: ProductionCompany[];
  production_countries?: ProductionCountry[];
  original_language?: string;
  popularity?: number;
  tagline?: string;
  type?: string;
  original_name?: string;
  origin_country?: string[];
  spoken_languages?: { iso_639_1: string; name: string; english_name?: string }[];
  homepage?: string;
  in_production?: boolean;
  languages?: string[];
  last_episode_to_air?: Episode;
  next_episode_to_air?: Episode | null;
  content_ratings?: ContentRatings;
  credits?: Credits;
  videos?: Videos;
  keywords?: Keywords;
  external_ids?: ExternalIds;
  similar?: { results: RelatedShow[] };
  recommendations?: { results: RelatedShow[] };
  'watch/providers'?: WatchProviders;
  media_type: 'tv'; // Literal type 'tv'
  trailerId?: string; // Optional trailer ID for YouTube or other platforms
}

export interface TvApiResponse {
  page: number;
  results: TVShow[];
  total_pages: number;
  total_results: number;
}

// Type for the API response when fetching details for a specific season
export interface TvSeasonDetailsResponse {
  _id: string; // Sometimes included by API
  air_date: string | null;
  episodes: Episode[];
  name: string;
  overview: string;
  id: number; // Season ID
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

// Type for combined Movie/TV lists (e.g., Trending 'all')
export type MediaItem = Movie | TVShow;

// --- UI Component Props ---
export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
}

// --- Player Related Types ---
export interface StreamSource {
  name: string;       // Display name (e.g., "Source 1", "VidFast")
  baseUrls: {         // Object containing base URLs for this provider
    movie: string;
    tv: string;
  };
  hasAds?: boolean;   // Controlled via NEXT_PUBLIC_SOURCE_XX_ADS env var
}

// --- User Preferences ---
export interface UserPreferences {
  darkMode: boolean;
  preferredTab: 'movie' | 'tv';
  showRatings: boolean;
  showNewBadges: boolean;
}

// --- Component Props Types ---
export interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

export interface RatingStarsProps {
  rating: number;
  maxRating: number;
}

export interface SocialShareButtonsProps {
  title: string;
  url: string;
  hashtags: string;
}

export interface CastSectionProps {
  cast: CastMember[];
}

export interface RelatedContentProps {
  shows: RelatedShow[];
  contentType: 'tv' | 'movie';
}

export interface UserReviewsProps {
  mediaId: string;
  mediaType: 'tv' | 'movie';
}

export interface PopularEpisodesProps {
  tvId: string;
  showName: string;
}

export interface SeasonEpisodeBrowserProps {
  tvId: string;
  showTitle: string;
  initialSeasons: Season[];
  sources: StreamSource[];
  initialSeason?: number;
  initialEpisode?: number;
}