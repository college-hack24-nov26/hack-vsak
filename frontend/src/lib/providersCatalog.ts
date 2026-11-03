export type Category = 'ai' | 'music' | 'weather' | 'news' | 'environment';

export interface ProviderCatalogItem {
  id: string;
  name: string;
  category: Category;
  requiresKey: boolean;
  tagline: string;
  docUrl: string;
  iconUrl: string;
  fallbackIcon: string;
}

export const PROVIDERS_CATALOG: ProviderCatalogItem[] = [
  {
    id: 'gemini',
    name: 'Google Gemini (gemini-3.5-flash-lite)',
    category: 'ai',
    requiresKey: true,
    tagline: 'High-speed multimodal AI generation with sub-second response times and 1M+ token context.',
    docUrl: 'https://ai.google.dev/gemini-api/docs',
    iconUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    fallbackIcon: '🧠',
  },
  {
    id: 'groq',
    name: 'Groq Cloud (Llama 3.3 70B)',
    category: 'ai',
    requiresKey: true,
    tagline: 'Ultra-low latency LPU inference engine for lightning-fast AI reasoning.',
    docUrl: 'https://console.groq.com/docs/quickstart',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/groq.svg',
    fallbackIcon: '⚡',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Unified AI Models)',
    category: 'ai',
    requiresKey: true,
    tagline: 'Access 200+ top LLMs (Claude, GPT-4o, Llama 3.3, DeepSeek) through one unified key.',
    docUrl: 'https://openrouter.ai/docs',
    iconUrl: 'https://openrouter.ai/favicon.ico',
    fallbackIcon: '🌐',
  },
  {
    id: 'deezer',
    name: 'Deezer Music API',
    category: 'music',
    requiresKey: false,
    tagline: 'Global music repository with millions of artists, tracks, and 30-second audio previews.',
    docUrl: 'https://developers.deezer.com/api',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/deezer.svg',
    fallbackIcon: '🎵',
  },
  {
    id: 'itunes',
    name: 'Apple iTunes Search API',
    category: 'music',
    requiresKey: false,
    tagline: 'Apple worldwide media repository spanning songs, albums, and high-fidelity preview audio.',
    docUrl: 'https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg',
    fallbackIcon: '🍎',
  },
  {
    id: 'openmeteo',
    name: 'Open-Meteo Weather',
    category: 'weather',
    requiresKey: false,
    tagline: 'High-resolution open meteorological forecast models without API key requirements.',
    docUrl: 'https://open-meteo.com/en/docs',
    iconUrl: 'https://open-meteo.com/images/logo.svg',
    fallbackIcon: '☀️',
  },
  {
    id: 'weatherstack',
    name: 'Weatherstack (APILayer)',
    category: 'weather',
    requiresKey: true,
    tagline: 'Production-ready real-time weather conditions for 2.6M+ cities worldwide.',
    docUrl: 'https://weatherstack.com/documentation',
    iconUrl: 'https://assets.apilayer.com/weatherstack/icon.png',
    fallbackIcon: '🌤️',
  },
  {
    id: 'hackernews',
    name: 'HackerNews Algolia API',
    category: 'news',
    requiresKey: false,
    tagline: 'Real-time trending tech headlines, top algorithmic submissions, and dev discussions.',
    docUrl: 'https://github.com/HackerNews/API',
    iconUrl: 'https://news.ycombinator.com/y18.svg',
    fallbackIcon: '📰',
  },
  {
    id: 'spaceflight',
    name: 'Spaceflight News API (v4)',
    category: 'news',
    requiresKey: false,
    tagline: 'Curated space exploration, satellite launch manifests, and aerospace reports.',
    docUrl: 'https://api.spaceflightnewsapi.net/v4/docs/',
    iconUrl: 'https://spaceflightnewsapi.net/favicon.ico',
    fallbackIcon: '🚀',
  },
  {
    id: 'openaq',
    name: 'OpenAQ Global Air Quality (v3)',
    category: 'environment',
    requiresKey: true,
    tagline: 'Worldwide reference-grade ambient air quality monitoring and PM2.5 / PM10 sensor data.',
    docUrl: 'https://docs.openaq.org',
    iconUrl: 'https://openaq.org/assets/graphics/content/logo.svg',
    fallbackIcon: '🌱',
  },
  {
    id: 'openmeteo_air',
    name: 'Open-Meteo Atmospheric Air',
    category: 'environment',
    requiresKey: false,
    tagline: 'Atmospheric pollutant dispersion modeling including US AQI, European AQI, NO2, and PM2.5.',
    docUrl: 'https://open-meteo.com/en/docs/air-quality-api',
    iconUrl: 'https://open-meteo.com/images/logo.svg',
    fallbackIcon: '💨',
  },
];
