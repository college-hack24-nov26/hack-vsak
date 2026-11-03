import { providerRegistry } from '../providers/registry.js';
import type { ProviderCategory, ProviderConfig } from '../providers/types.js';
import { RoutingRule } from '../models/RoutingRule.js';
import { VaultSecret } from '../models/VaultSecret.js';
import { GatewayLog } from '../models/GatewayLog.js';
import { decryptSecret } from '../utils/vaultCrypto.js';
import type { IProject } from '../models/Project.js';

export interface ProxyExecutionResult<T = any> {
  data: T;
  meta: {
    category: ProviderCategory;
    primaryProvider: string;
    finalProvider: string;
    fallbackTriggered: boolean;
    fallbackReason?: string;
    latencyMs: number;
  };
}

export class ProxyEngineService {
  /**
   * Executes a unified proxy request with automatic failover.
   */
  public async execute<TReq = any, TRes = any>({
    project,
    category,
    endpoint,
    params,
    ipAddress,
    userAgent,
  }: {
    project: IProject;
    category: ProviderCategory;
    endpoint: string;
    params: TReq;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ProxyExecutionResult<TRes>> {
    const startTime = Date.now();

    // 1. Resolve Routing Rule (configured primary and fallback providers)
    let rule = await RoutingRule.findOne({ projectId: project._id, category });
    const defaults = providerRegistry.getDefaultRouting(category);

    const primaryId = rule?.primaryProviderId || defaults.primary;
    const fallbackId = rule?.fallbackProviderId || defaults.fallback;
    const timeoutMs = rule?.timeoutMs || 5000;
    const retryStatuses = rule?.retryOnStatusCodes || [400, 401, 402, 403, 404, 410, 429, 500, 502, 503, 504];

    // 2. Fetch primary provider adapter
    const primaryAdapter = providerRegistry.get(category, primaryId);
    if (!primaryAdapter) {
      throw new Error(`Primary provider "${primaryId}" not found for category "${category}".`);
    }

    // 3. Resolve primary provider credentials from vault
    const primaryConfig = await this.resolveProviderConfig(project, category, primaryId, timeoutMs);

    // 4. Attempt Primary Execution
    try {
      const data = await primaryAdapter.execute(params, primaryConfig);
      const latencyMs = Date.now() - startTime;

      // Log successful telemetry
      await this.logTelemetry({
        projectId: project._id,
        category,
        endpoint,
        primaryProvider: primaryId,
        finalProvider: primaryId,
        fallbackTriggered: false,
        latencyMs,
        statusCode: 200,
        ipAddress,
        userAgent,
      });

      return {
        data,
        meta: {
          category,
          primaryProvider: primaryId,
          finalProvider: primaryId,
          fallbackTriggered: false,
          latencyMs,
        },
      };
    } catch (primaryError: any) {
      const primaryStatus = primaryError.statusCode || 500;
      const shouldRetry = retryStatuses.includes(primaryStatus) || primaryStatus >= 400 || primaryError.name === 'AbortError' || primaryError.message?.includes('timeout');

      console.warn(`[ProxyEngine] Primary provider "${primaryId}" failed (${primaryError.message}). Should failover: ${shouldRetry}`);

      if (!shouldRetry) {
        throw primaryError;
      }

      // 5. Automatic Failover to Fallback Provider
      const fallbackReason = primaryError.name === 'AbortError' ? 'TIMEOUT_EXCEEDED' : `UPSTREAM_${primaryStatus}`;
      const fallbackAdapter = providerRegistry.get(category, fallbackId);

      if (!fallbackAdapter) {
        console.error(`[ProxyEngine] Fallback provider "${fallbackId}" not found. Cannot failover.`);
        throw primaryError;
      }

      console.log(`[ProxyEngine] 🔄 Automatically failing over to "${fallbackAdapter.displayName}" (${fallbackId})...`);

      const fallbackConfig = await this.resolveProviderConfig(project, category, fallbackId, timeoutMs);

      try {
        const fallbackData = await fallbackAdapter.execute(params, fallbackConfig);
        const totalLatencyMs = Date.now() - startTime;

        // Log failover telemetry
        await this.logTelemetry({
          projectId: project._id,
          category,
          endpoint,
          primaryProvider: primaryId,
          finalProvider: fallbackId,
          fallbackTriggered: true,
          fallbackReason,
          latencyMs: totalLatencyMs,
          statusCode: 200,
          ipAddress,
          userAgent,
        });

        return {
          data: fallbackData,
          meta: {
            category,
            primaryProvider: primaryId,
            finalProvider: fallbackId,
            fallbackTriggered: true,
            fallbackReason,
            latencyMs: totalLatencyMs,
          },
        };
      } catch (fallbackError: any) {
        const totalLatencyMs = Date.now() - startTime;
        console.error(`[ProxyEngine] Both primary and fallback providers failed for ${category}.`);

        await this.logTelemetry({
          projectId: project._id,
          category,
          endpoint,
          primaryProvider: primaryId,
          finalProvider: fallbackId,
          fallbackTriggered: true,
          fallbackReason: `FALLBACK_FAILED_${fallbackError.statusCode || 500}`,
          latencyMs: totalLatencyMs,
          statusCode: fallbackError.statusCode || 500,
          ipAddress,
          userAgent,
        });

        throw fallbackError;
      }
    }
  }

  /**
   * Resolves decrypted provider credentials from VaultSecret.
   */
  private async resolveProviderConfig(
    project: IProject,
    category: ProviderCategory,
    providerId: string,
    timeoutMs: number
  ): Promise<ProviderConfig> {
    const secret = await VaultSecret.findOne({
      projectId: project._id,
      category,
      providerId,
    }).select('+encryptedCombined');

    let apiKey: string | undefined;
    if (secret?.encryptedCombined) {
      try {
        apiKey = decryptSecret(secret.encryptedCombined);
      } catch (err: any) {
        console.error(`[ProxyEngine] Failed to decrypt vault secret for ${providerId}:`, err.message);
      }
    }

    return {
      apiKey,
      metadata: secret?.metadata,
      timeoutMs,
    };
  }

  /**
   * Records telemetry in GatewayLog.
   */
  private async logTelemetry(logData: any): Promise<void> {
    try {
      await GatewayLog.create(logData);
    } catch (err: any) {
      console.error('[ProxyEngine] Telemetry log failed:', err.message);
    }
  }
}

export const proxyEngine = new ProxyEngineService();
