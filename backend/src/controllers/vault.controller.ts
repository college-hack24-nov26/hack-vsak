import type { Response, NextFunction } from 'express';
import { VaultSecret, type ProviderCategory } from '../models/VaultSecret.js';
import { encryptSecret, maskApiKey } from '../utils/vaultCrypto.js';
import { providerRegistry } from '../providers/registry.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * 1. GET /api/v1/vault
 * Retrieves all encrypted API keys stored in vault by the authenticated developer.
 */
export async function getVaultSecrets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const secrets = await VaultSecret.find({ userId: user._id }).select(
      'category providerId keyPreview metadata updatedAt'
    );

    res.status(200).json({
      success: true,
      data: {
        secrets,
        vaultSecrets: secrets,
        count: secrets.length,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 2. POST /api/v1/vault
 * Encrypts and securely stores or updates a provider API key in the developer's vault.
 */
export async function saveVaultSecret(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { category, providerId, apiKey, metadata } = req.body;

    if (!category || !providerId || !apiKey) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'category, providerId, and apiKey are required fields.',
        },
      });
      return;
    }

    if (!providerRegistry.has(category as ProviderCategory, providerId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROVIDER',
          message: `Provider "${providerId}" is not registered under category "${category}".`,
        },
      });
      return;
    }

    const trimmedKey = String(apiKey).trim();
    if (trimmedKey.length < 4) {
      res.status(400).json({
        success: false,
        error: {
          code: 'KEY_TOO_SHORT',
          message: 'API Key must be at least 4 characters long.',
        },
      });
      return;
    }

    const encryption = encryptSecret(trimmedKey);
    const encryptedCombined = encryption.combined;
    const keyPreview = maskApiKey(trimmedKey);

    const secret = await VaultSecret.findOneAndUpdate(
      { userId: user._id, category, providerId },
      {
        encryptedCombined,
        keyPreview,
        metadata: metadata || {},
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: `Vault secret for ${providerId} (${category}) safely encrypted and stored.`,
      data: {
        id: secret._id,
        category: secret.category,
        providerId: secret.providerId,
        keyPreview: secret.keyPreview,
        updatedAt: secret.updatedAt,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 3. DELETE /api/v1/vault/:providerId
 * Deletes a provider credential from developer's vault.
 */
export async function deleteVaultSecret(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { providerId } = req.params;
    const category = req.query.category as string | undefined;

    const query: any = { userId: user._id, providerId };
    if (category) {
      query.category = category;
    }

    const result = await VaultSecret.findOneAndDelete(query);
    if (!result) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SECRET_NOT_FOUND',
          message: `Vault secret for provider "${providerId}" was not found.`,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Vault credential for ${providerId} was successfully deleted.`,
    });
  } catch (err: any) {
    next(err);
  }
}
