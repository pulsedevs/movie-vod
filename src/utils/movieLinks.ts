// src/utils/movieLinks.ts

/**
 * Creates a URL-friendly slug from a title
 * @param title The title to convert to a slug
 * @returns A URL-friendly slug
 */
export function createSlug(title: string): string {
    // Handle undefined, null, or empty title
    if (!title || typeof title !== 'string') {
      return 'untitled';
    }
    
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Remove consecutive hyphens
      .trim();                  // Trim leading/trailing spaces or hyphens

    // `\w` is ASCII-only, so a fully non-Latin title (Japanese/Chinese/Korean/Cyrillic) collapses
    // to '' or '-'. That produced links like `/tv/37854/`, which redirect back to the bare-ID route
    // and loop — every hop being an indexable thin page. Only these degenerate outputs change;
    // every ASCII slug stays byte-identical, so no already-indexed URL moves.
    return slug.length < 2 ? 'untitled' : slug;
  }
  
  /**
   * Creates a movie URL with proper slug format
   * @param id The movie ID
   * @param title The movie title
   * @returns A properly formatted URL for SEO
   */
  export function getMovieUrl(id: number | string, title: string): string {
    const slug = createSlug(title);
    return `/movie/${id}/${slug}`;
  }
  
  /**
   * Use this in Link components for consistent movie URL generation
   * Example: <Link href={getMovieUrlObject(movie.id, movie.title)}>
   */
  export function getMovieUrlObject(id: number | string, title: string) {
    return {
      pathname: '/movie/[movieId]/[movieSlug]',
      params: {
        movieId: id.toString(),
        movieSlug: createSlug(title)
      }
    };
  }

  /**
   * Creates a TV show URL with proper slug format
   * @param id The TV show ID
   * @param title The TV show name
   * @returns A properly formatted URL for SEO
   */
  export function getTvShowUrl(id: number | string, title: string): string {
    const slug = createSlug(title);
    return `/tv/${id}/${slug}`;
  }
  
  /**
   * Use this in Link components for consistent TV show URL generation
   * Example: <Link href={getTvShowUrlObject(show.id, show.name)}>
   */
  export function getTvShowUrlObject(id: number | string, title: string) {
    return {
      pathname: '/tv/[tvId]/[tvSlug]',
      params: {
        tvId: id.toString(),
        tvSlug: createSlug(title)
      }
    };
  }