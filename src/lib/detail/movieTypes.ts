import type { Genre, Movie } from '@/types';

export interface MovieWithCredits extends Movie {
  credits?: {
    cast?: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew?: Array<{ id: number; name: string; job: string; department: string }>;
  };
  genres?: Genre[];
  external_ids?: {
    imdb_id?: string;
    facebook_id?: string;
    instagram_id?: string;
    twitter_id?: string;
  };
  production_companies?: Array<{
    id: number;
    name: string;
    origin_country?: string;
  }>;
  keywords?: { results?: Array<{ id: number; name: string }> };
  videos?: { results?: Array<{ site: string; type: string; key: string }> };
  release_dates?: {
    results?: Array<{
      iso_3166_1: string;
      release_dates: Array<{ certification?: string }>;
    }>;
  };
  created_by?: Array<{ id: number; name: string }>;
}
