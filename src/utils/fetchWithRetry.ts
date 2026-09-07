export async function fetchWithRetry<T>(
  url: string,
  section: string,
  retries = 3,
  onError?: (section: string, error: Error) => void
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        let errorDetails = `API returned status code ${response.status}`;
        try {
          const errorJson = await response.json();
          errorDetails = errorJson.error || errorJson.details || errorDetails;
        } catch {
          // Ignore if response is not JSON
        }
        throw new Error(errorDetails);
      }

      const data = await response.json();
      if (data && Array.isArray(data)) {
        return data as T;
      }
      if (data && data.results && Array.isArray(data.results)) {
        return data.results as T;
      }
      throw new Error('Unexpected API response format');
    } catch (error) {
      console.error(`Fetch error for ${section} (attempt ${i + 1}):`, error);
      if (i === retries - 1) {
        onError?.(section, error as Error);
        return [] as unknown as T;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  return [] as unknown as T;
}
