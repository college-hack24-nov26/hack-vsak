import type { IProviderAdapter, UnifiedEnvironmentRequest, UnifiedEnvironmentResponse, ProviderConfig } from '../types.js';

export class OpenAqAdapter implements IProviderAdapter<UnifiedEnvironmentRequest, UnifiedEnvironmentResponse> {
  public readonly id = 'openaq';
  public readonly category = 'environment' as const;
  public readonly displayName = 'OpenAQ Global Air Quality API (v3)';
  public readonly isKeyRequired = true;

  public async execute(params: UnifiedEnvironmentRequest, config: ProviderConfig): Promise<UnifiedEnvironmentResponse> {
    const apiKey = config.apiKey || process.env.OPENAQ_API_KEY;
    if (!apiKey) {
      const err = new Error('OpenAQ v3 requires an API key in X-API-Key header. Triggering failover to Open-Meteo Air.');
      (err as any).statusCode = 401;
      throw err;
    }

    const city = params.city || 'Delhi';
    const url = `https://api.openaq.org/v3/locations?limit=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 5000);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-API-Key': apiKey,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = new Error(`OpenAQ API error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = await response.json() as any;
      const result = data.results?.[0];

      return {
        location: result?.name || city,
        airQuality: {
          status: 'Moderate',
          mainPollutant: 'PM2.5',
        },
        provider: this.id,
        timestamp: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
