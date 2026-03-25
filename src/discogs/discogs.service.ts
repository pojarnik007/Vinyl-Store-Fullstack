import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface DiscogsRelease {
  id: number;
  title: string;
  artists: Array<{ name: string }>;
  genres: string[];
  year: number;
  images: Array<{ uri: string; type: string }>;
  community: { rating: { average: number; count: number } };
  tracklist: Array<{ title: string; duration: string }>;
}

export interface DiscogsSearchResult {
  id: number;
  title: string;
  country: string;
  year: string;
  genre: string[];
  thumb: string;
  cover_image: string;
  type: string;
  resource_url: string;
  community: { want: number; have: number };
}

@Injectable()
export class DiscogsService {
  private readonly client: ReturnType<typeof axios.create>;
  private readonly logger = new Logger(DiscogsService.name);

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get('DISCOGS_TOKEN');

    this.client = axios.create({
      baseURL: 'https://api.discogs.com',
      headers: {
        Authorization: `Discogs token=${token}`,
        'User-Agent': 'MyVinylStoreApp/1.0',
        Accept: 'application/vnd.discogs.v2.plaintext+json',
      },
    });
  }

  async searchReleases(query: string, page = 1, perPage = 20) {
    const response = await this.client.get<{
      results: DiscogsSearchResult[];
      pagination: any;
    }>('/database/search', {
      params: {
        q: query,
        type: 'release',
        format: 'vinyl',
        per_page: perPage,
        page,
      },
    });

    console.log(`[Debug] Search "${query}" results count:`, response.data.results?.length);

    return {
      results: response.data.results as DiscogsSearchResult[],
      pagination: response.data.pagination,
    };
  }

  async getRelease(releaseId: string): Promise<DiscogsRelease> {
    try {
      const response = await this.client.get<DiscogsRelease>(`/releases/${releaseId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error(`Ошибка Discogs [${releaseId}]:`, error.response.data);
      }
      throw error;
    }
  }

  mapReleaseToVinyl(release: DiscogsRelease) {
    const artist = release.artists?.[0]?.name || 'Unknown Artist';
    const primaryImage = release.images?.find((i) => i.type === 'primary') || release.images?.[0];

    return {
      name: release.title,
      authorName: artist.replace(/\(\d+\)$/, '').trim(),
      description: [
        release.genres?.join(', '),
        release.year ? `Year: ${release.year}` : null,
        release.tracklist?.length ? `${release.tracklist.length} tracks` : null,
      ]
        .filter(Boolean)
        .join('. '),
      image: primaryImage?.uri || undefined,
      price: Math.floor(Math.random() * 40 + 10) + 0.99,
      discogsId: release.id.toString(),
      discogsScore: release.community?.rating?.average || null,
    };
  }
}
