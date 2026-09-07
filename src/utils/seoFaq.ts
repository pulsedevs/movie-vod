/**
 * Shared FAQ builder for movie/TV detail pages.
 *
 * ONE source for both the visible <DetailV2Faq> list and the FAQPage JSON-LD. Previously the
 * FAQ was written inline in four places (MovieDetailV2, TvDetailV2, and each page's JSON-LD),
 * which lets the rendered text and the structured data drift apart — Google treats markup that
 * doesn't match visible content as spam.
 *
 * Why this matters for ranking: queries like "where can I watch X" rank because the page
 * literally contains that question and answers it. Each extra question is another long-tail
 * query we can match — and, as a side effect, several hundred words of unique indexable text
 * on pages that were otherwise thin.
 *
 * RULE: never invent an answer. A question is emitted only when the data backing it exists.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

interface CommonInput {
  title: string;
  year?: string;
  overview?: string | null;
  genres?: string[];
  /** Top-billed cast, in order. */
  cast?: Array<{ name?: string }>;
  /** TMDB vote average (0-10). */
  rating?: number | null;
  voteCount?: number | null;
}

export interface MovieFaqInput extends CommonInput {
  kind: 'movie';
  runtime?: number | null;
  directors?: string[];
  /** Certification such as "PG-13" / "R". */
  certification?: string | null;
}

export interface TvFaqInput extends CommonInput {
  kind: 'tv';
  seasons?: number | null;
  episodes?: number | null;
  /** TMDB status, e.g. "Returning Series" / "Ended". */
  status?: string | null;
  creators?: string[];
}

export type FaqInput = MovieFaqInput | TvFaqInput;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function runtimeText(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${plural(h, 'hour')} and ${plural(m, 'minute')}`;
  if (h) return plural(h, 'hour');
  return plural(m, 'minute');
}

function namesOf(people?: Array<{ name?: string }>, limit = 5): string[] {
  return (people ?? [])
    .map((p) => p?.name)
    .filter((n): n is string => !!n && n.trim().length > 0)
    .slice(0, limit);
}

/** Join names as "A, B, C and D". */
function listSentence(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function buildFaqItems(input: FaqInput): FaqItem[] {
  const { title, year, overview, genres, rating, voteCount } = input;
  const kindNoun = input.kind === 'tv' ? 'series' : 'movie';
  const genreText = genres?.length ? listSentence(genres.slice(0, 3)).toLowerCase() : '';
  const items: FaqItem[] = [];

  // 1. The query that already ranks — keep it first and keep the wording.
  items.push({
    question: `Where can I watch ${title} online for free?`,
    answer:
      `You can watch ${title} online for free on BoredFlix. We offer high-quality streaming in HD ` +
      `with no registration required, on desktop, mobile and TV.`,
  });

  // 2. Synopsis — full text (was cut at 200 chars, throwing away indexable content).
  if (overview?.trim()) {
    items.push({ question: `What is ${title} about?`, answer: overview.trim() });
  } else if (genreText) {
    items.push({
      question: `What is ${title} about?`,
      answer: `${title} is a ${genreText} ${kindNoun}${year ? ` released in ${year}` : ''}, available to stream free on BoredFlix.`,
    });
  }

  if (input.kind === 'movie') {
    if (input.runtime) {
      items.push({
        question: `How long is ${title}?`,
        answer: `${title} has a runtime of ${runtimeText(input.runtime)}.`,
      });
    }
    const directors = input.directors?.filter(Boolean) ?? [];
    if (directors.length) {
      items.push({
        question: `Who directed ${title}?`,
        answer: `${title} was directed by ${listSentence(directors.slice(0, 3))}.`,
      });
    }
    if (year && year !== 'N/A') {
      items.push({
        question: `When did ${title} come out?`,
        answer: `${title} was released in ${year}. You can stream it free on BoredFlix.`,
      });
    }
    if (input.certification) {
      items.push({
        question: `What is the age rating of ${title}?`,
        answer: `${title} is rated ${input.certification}.`,
      });
    }
  } else {
    const seasons = input.seasons ?? 0;
    if (seasons > 0) {
      const eps = input.episodes ?? 0;
      items.push({
        question: `How many seasons does ${title} have?`,
        answer:
          `${title} has ${plural(seasons, 'season')}` +
          `${eps > 0 ? ` and ${plural(eps, 'episode')}` : ''} available to stream on BoredFlix.`,
      });
    }
    if (input.status) {
      const ended = /ended|canceled|cancelled/i.test(input.status);
      items.push({
        question: `Is ${title} still ongoing?`,
        answer: ended
          ? `${title} has finished airing — its status is "${input.status}". All available episodes can be streamed on BoredFlix.`
          : `${title} is currently listed as "${input.status}". New episodes are added to BoredFlix as they air.`,
      });
    }
    const creators = input.creators?.filter(Boolean) ?? [];
    if (creators.length) {
      items.push({
        question: `Who created ${title}?`,
        answer: `${title} was created by ${listSentence(creators.slice(0, 3))}.`,
      });
    }
    if (year && year !== 'N/A') {
      items.push({
        question: `When did ${title} premiere?`,
        answer: `${title} first aired in ${year}. You can stream it free on BoredFlix.`,
      });
    }
  }

  // Cast — puts actor names into indexable text (people search actor + title).
  const cast = namesOf(input.cast, 5);
  if (cast.length) {
    items.push({
      question: `Who stars in ${title}?`,
      answer: `${title} stars ${listSentence(cast)}.`,
    });
  }

  // Rating — stated as a fact, no editorialising beyond the number.
  if (typeof rating === 'number' && rating > 0) {
    const score = rating.toFixed(1);
    items.push({
      question: `Is ${title} worth watching?`,
      answer:
        `${title} holds an average viewer rating of ${score}/10` +
        `${voteCount ? ` from ${voteCount.toLocaleString('en-US')} votes` : ''} on TMDB. ` +
        `You can watch it free on BoredFlix and decide for yourself.`,
    });
  }

  items.push({
    question: `Do I need an account to watch ${title}?`,
    answer:
      `No. ${title} can be streamed on BoredFlix without an account, a subscription or a credit card. ` +
      `Creating a free account only adds a watchlist and continue-watching across devices.`,
  });

  return items;
}

/** Same items as the visible FAQ, shaped as schema.org FAQPage. */
export function buildFaqJsonLd(input: FaqInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: buildFaqItems(input).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** Episode-page FAQ. Same rule as above: a question is emitted only when its data exists. */
export interface EpisodeFaqInput {
  showTitle: string;
  episodeName?: string | null;
  seasonNumber: number;
  episodeNumber: number;
  overview?: string | null;
  airDate?: string | null;
  runtime?: number | null;
  rating?: number | null;
}

export function buildEpisodeFaqItems({
  showTitle,
  episodeName,
  seasonNumber,
  episodeNumber,
  overview,
  airDate,
  runtime,
  rating,
}: EpisodeFaqInput): FaqItem[] {
  const se = `season ${seasonNumber} episode ${episodeNumber}`;
  const label = episodeName ? `"${episodeName}"` : `episode ${episodeNumber}`;
  const items: FaqItem[] = [];

  // The query this page exists to answer.
  items.push({
    question: `Where can I watch ${showTitle} ${se} online for free?`,
    answer:
      `You can watch ${showTitle} ${se} ${label} online for free on BoredFlix, in HD ` +
      `with no account or registration required.`,
  });

  if (overview?.trim()) {
    items.push({
      question: `What happens in ${showTitle} ${se}?`,
      answer: overview.trim(),
    });
  }

  if (airDate) {
    const d = new Date(airDate);
    const pretty = Number.isNaN(d.getTime())
      ? airDate
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    items.push({
      question: `When did ${showTitle} ${se} air?`,
      answer: `${showTitle} ${se} ${label} originally aired on ${pretty}.`,
    });
  }

  if (runtime && runtime > 0) {
    items.push({
      question: `How long is ${showTitle} ${se}?`,
      answer: `This episode runs for about ${runtime} minutes.`,
    });
  }

  if (typeof rating === 'number' && rating > 0) {
    items.push({
      question: `Is ${showTitle} ${se} any good?`,
      answer:
        `${showTitle} ${se} holds an average viewer rating of ${rating.toFixed(1)}/10 on TMDB. ` +
        `You can watch it free on BoredFlix and judge for yourself.`,
    });
  }

  return items;
}

/** FAQPage JSON-LD for an episode — same items as the visible list. */
export function buildEpisodeFaqJsonLd(input: EpisodeFaqInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: buildEpisodeFaqItems(input).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
