import type { IProviderAdapter, UnifiedMusicRequest, UnifiedMusicResponse, ProviderConfig } from '../types.js';

export class DeezerMusicAdapter implements IProviderAdapter<UnifiedMusicRequest, UnifiedMusicResponse> {
  public readonly id = 'deezer';
  public readonly category = 'music' as const;
  public readonly displayName = 'Deezer Music API (Public)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedMusicRequest, config: ProviderConfig): Promise<UnifiedMusicResponse> {
    const limit = params.limit || 10;
    const query = encodeURIComponent(params.query || 'electronic');
    const url = `https://api.deezer.com/search?q=${query}&limit=${limit}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 5000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const err = new Error(`Deezer API error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = await response.json() as any;
      const rawTracks = data.data || [];

      if (!Array.isArray(rawTracks) || rawTracks.length === 0) {
        const err = new Error('Deezer catalog returned no playable tracks for this query/region. Triggering failover.');
        (err as any).statusCode = 404;
        throw err;
      }

      const tracks = rawTracks.map((t: any) => ({
        id: String(t.id),
        title: t.title,
        artist: t.artist?.name || 'Unknown Artist',
        album: t.album?.title || 'Unknown Album',
        duration: t.duration || 0,
        previewUrl: t.preview,
        coverUrl: t.album?.cover_medium || t.album?.cover,
      }));

      return {
        tracks,
        provider: this.id,
        total: data.total || tracks.length,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
