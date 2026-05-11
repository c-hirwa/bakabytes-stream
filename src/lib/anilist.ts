const ANILIST_URL = "https://graphql.anilist.co";

export interface AnimeTitle {
  romaji: string;
  english: string | null;
  native?: string;
}

export interface AnimeCoverImage {
  large: string;
  extraLarge: string;
}

export interface AnimeMedia {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCoverImage;
  bannerImage: string | null;
  genres: string[];
  averageScore: number;
  episodes: number | null;
  description: string | null;
  status: string;
  season: string | null;
  seasonYear: number | null;
}

export interface AnimeStudio {
  name: string;
  isAnimationStudio: boolean;
}

export interface AnimeCharacter {
  name: { full: string };
  image: { medium: string };
}

export interface StreamingEpisode {
  title: string;
  thumbnail: string;
  url: string;
  site: string;
}

export interface AnimeTrailer {
  id: string;
  site: string;
}

export interface AnimeRecommendation {
  mediaRecommendation: {
    id: number;
    title: AnimeTitle;
    coverImage: { large: string };
    averageScore: number;
  } | null;
}

export interface AnimeMediaDetail extends AnimeMedia {
  duration: number | null;
  studios: { nodes: AnimeStudio[] };
  characters: { nodes: AnimeCharacter[] };
  streamingEpisodes: StreamingEpisode[];
  trailer: AnimeTrailer | null;
  recommendations: { nodes: AnimeRecommendation[] };
}

async function anilistFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`AniList request failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { data: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(`AniList error: ${json.errors.map((e) => e.message).join(", ")}`);
  }
  return json.data;
}

const MEDIA_FIELDS = `
  id
  title { romaji english }
  coverImage { large extraLarge }
  bannerImage
  genres
  averageScore
  episodes
  description
  status
  season
  seasonYear
`;

export async function getTrendingAnime(): Promise<AnimeMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 20) {
        media(type: ANIME, sort: TRENDING_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: { media: AnimeMedia[] } }>(query);
  return data.Page.media;
}

export async function getPopularAnime(): Promise<AnimeMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 20) {
        media(type: ANIME, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: { media: AnimeMedia[] } }>(query);
  return data.Page.media;
}

export async function getSeasonalAnime(): Promise<AnimeMedia[]> {
  const query = `
    query ($season: MediaSeason, $year: Int) {
      Page(page: 1, perPage: 20) {
        media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          coverImage { large extraLarge }
          bannerImage
          genres
          averageScore
          episodes
          description
          status
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: { media: AnimeMedia[] } }>(query, {
    season: "WINTER",
    year: 2025,
  });
  return data.Page.media;
}

export async function searchAnime(searchQuery: string): Promise<AnimeMedia[]> {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 30) {
        media(type: ANIME, search: $search) {
          id
          title { romaji english }
          coverImage { large extraLarge }
          genres
          averageScore
          episodes
          description
          status
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: { media: AnimeMedia[] } }>(query, {
    search: searchQuery,
  });
  return data.Page.media;
}

export async function getAnimeById(id: number): Promise<AnimeMediaDetail> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english native }
        coverImage { large extraLarge }
        bannerImage
        genres
        averageScore
        episodes
        description
        status
        season
        seasonYear
        duration
        studios { nodes { name isAnimationStudio } }
        characters(sort: ROLE, perPage: 6) {
          nodes {
            name { full }
            image { medium }
          }
        }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
        trailer { id site }
        recommendations(perPage: 6) {
          nodes {
            mediaRecommendation {
              id
              title { romaji english }
              coverImage { large }
              averageScore
            }
          }
        }
      }
    }
  `;
  const data = await anilistFetch<{ Media: AnimeMediaDetail }>(query, { id });
  return data.Media;
}

export async function getAnimeByGenre(genre: string): Promise<AnimeMedia[]> {
  const query = `
    query ($genre: String) {
      Page(page: 1, perPage: 20) {
        media(type: ANIME, genre: $genre, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          coverImage { large extraLarge }
          genres
          averageScore
          episodes
          description
        }
      }
    }
  `;
  const data = await anilistFetch<{ Page: { media: AnimeMedia[] } }>(query, { genre });
  return data.Page.media;
}
