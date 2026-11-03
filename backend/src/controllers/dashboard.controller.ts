import type { Response, NextFunction } from 'express';
import { GatewayLog } from '../models/GatewayLog.js';
import { VaultSecret } from '../models/VaultSecret.js';
import { ApiKey } from '../models/ApiKey.js';
import { providerRegistry } from '../providers/registry.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * GET /api/v1/dashboard/overview
 * Returns unified analytics, KPI metrics, and live telemetry for the authenticated developer.
 */
export async function getDashboardOverview(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;

    const [totalRequests, totalFallbacks, vaultCount, activeDbKeysCount, recentLogs, latencyAgg] = await Promise.all([
      GatewayLog.countDocuments({ userId: user._id }),
      GatewayLog.countDocuments({ userId: user._id, fallbackTriggered: true }),
      VaultSecret.countDocuments({ userId: user._id }),
      ApiKey.countDocuments({ userId: user._id, isActive: true }),
      GatewayLog.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50),
      GatewayLog.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, avgLatency: { $avg: '$latencyMs' } } },
      ]),
    ]);

    const legacyActiveKeysCount = (user.apiKeys || []).filter((k) => k.isActive).length;
    const activeKeysCount = activeDbKeysCount > 0 ? activeDbKeysCount : legacyActiveKeysCount;
    const fallbackRate = totalRequests > 0 ? ((totalFallbacks / totalRequests) * 100).toFixed(1) + '%' : '0.0%';
    const averageLatencyMs = latencyAgg[0]?.avgLatency ? Math.round(latencyAgg[0].avgLatency) : 0;

    res.status(200).json({
      success: true,
      data: {
        developer: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        metrics: {
          totalRequests,
          totalFallbacks,
          fallbackRatePercentage: fallbackRate,
          averageLatencyMs,
          activeKeysCount,
          configuredVaultCount: vaultCount,
          totalAvailableProviders: providerRegistry.list().length,
        },
        recentLogs,
      },
    });
  } catch (err: any) {
    next(err);
  }
}
