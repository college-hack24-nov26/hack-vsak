import type { Response, NextFunction } from 'express';
import { proxyEngine } from '../services/proxyEngine.service.js';
import { providerRegistry } from '../providers/registry.js';
import type { ProjectAuthenticatedRequest } from '../middleware/projectAuth.middleware.js';

function setProxyHeaders(res: Response, meta: any): void {
  res.setHeader('X-OneAPI-Fallback', String(meta.fallbackTriggered));
  res.setHeader('X-OneAPI-Primary-Provider', meta.primaryProvider);
  res.setHeader('X-OneAPI-Final-Provider', meta.finalProvider);
  res.setHeader('X-OneAPI-Latency-MS', String(meta.latencyMs));
  if (meta.fallbackReason) {
    res.setHeader('X-OneAPI-Fallback-Reason', meta.fallbackReason);
  }
}

/**
 * 1. AI Chat Proxy
 * POST /api/v1/proxy/ai/chat
 */
export async function proxyAiChat(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = req.project!;
    const { messages, model, temperature, maxTokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_MESSAGES', message: 'messages must be an array of { role, content }.' },
      });
      return;
    }

    const result = await proxyEngine.execute({
      project,
      category: 'ai',
      endpoint: '/ai/chat',
      params: { messages, model, temperature, maxTokens },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    setProxyHeaders(res, result.meta);
    res.status(200).json({
      success: true,
      data: result.data,
      _oneapi: result.meta,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 2. Music Search Proxy
 * GET /api/v1/proxy/music/search
 * POST /api/v1/proxy/music/search
 */
export async function proxyMusicSearch(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = req.project!;
    const query = (req.query.query as string) || req.body?.query || 'techno';
    const limit = parseInt((req.query.limit as string) || req.body?.limit || '10', 10);

    const result = await proxyEngine.execute({
      project,
      category: 'music',
      endpoint: '/music/search',
      params: { query, limit },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    setProxyHeaders(res, result.meta);
    res.status(200).json({
      success: true,
      data: result.data,
      _oneapi: result.meta,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 3. Weather Current Proxy
 * GET /api/v1/proxy/weather/current
 * POST /api/v1/proxy/weather/current
 */
export async function proxyWeatherCurrent(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = req.project!;
    const city = (req.query.city as string) || req.body?.city;
    const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : req.body?.latitude;
    const lon = req.query.longitude ? parseFloat(req.query.longitude as string) : req.body?.longitude;

    const result = await proxyEngine.execute({
      project,
      category: 'weather',
      endpoint: '/weather/current',
      params: { city, latitude: lat, longitude: lon },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    setProxyHeaders(res, result.meta);
    res.status(200).json({
      success: true,
      data: result.data,
      _oneapi: result.meta,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 4. News Search Proxy
 * GET /api/v1/proxy/news/search
 * POST /api/v1/proxy/news/search
 */
export async function proxyNewsSearch(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = req.project!;
    const query = (req.query.query as string) || req.body?.query || 'technology';
    const limit = parseInt((req.query.limit as string) || req.body?.limit || '10', 10);

    const result = await proxyEngine.execute({
      project,
      category: 'news',
      endpoint: '/news/search',
      params: { query, limit },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    setProxyHeaders(res, result.meta);
    res.status(200).json({
      success: true,
      data: result.data,
      _oneapi: result.meta,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 5. Environment Air Quality Proxy
 * GET /api/v1/proxy/environment/air-quality
 * POST /api/v1/proxy/environment/air-quality
 */
export async function proxyEnvironmentAir(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = req.project!;
    const city = (req.query.city as string) || req.body?.city || 'Delhi';
    const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : req.body?.latitude;
    const lon = req.query.longitude ? parseFloat(req.query.longitude as string) : req.body?.longitude;

    const result = await proxyEngine.execute({
      project,
      category: 'environment',
      endpoint: '/environment/air-quality',
      params: { city, latitude: lat, longitude: lon },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    setProxyHeaders(res, result.meta);
    res.status(200).json({
      success: true,
      data: result.data,
      _oneapi: result.meta,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 6. List All Available Providers & Categories
 * GET /api/v1/proxy/providers
 */
export async function listAvailableProviders(
  _req: ProjectAuthenticatedRequest,
  res: Response
): Promise<void> {
  const providers = providerRegistry.list();
  const categories = ['ai', 'music', 'weather', 'news', 'environment'];

  const grouped = categories.map((cat) => ({
    category: cat,
    defaultRouting: providerRegistry.getDefaultRouting(cat as any),
    registeredProviders: providers.filter((p) => p.category === cat),
  }));

  res.status(200).json({
    success: true,
    data: {
      categories: grouped,
      totalRegistered: providers.length,
    },
  });
}
