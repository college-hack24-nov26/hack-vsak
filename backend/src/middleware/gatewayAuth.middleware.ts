import type { Request, Response, NextFunction } from 'express';
import { User, type IUser } from '../models/User.js';
import { ApiKey } from '../models/ApiKey.js';
import { hashToken, safeCompare } from '../utils/crypto.js';
import { verifyAccessToken } from '../utils/tokens.js';

export interface GatewayAuthenticatedRequest extends Request {
  user?: IUser;
  apiKeyMeta?: {
    name: string;
    keyPrefix: string;
  };
}

/**
 * Middleware that authenticates incoming OneAPI gateway proxy calls.
 * Accepts ONLY:
 *   1. OneAPI Developer API Key: "x-api-key: sk_live_..." or "Authorization: Bearer sk_live_..." / "Authorization: ApiKey sk_live_..."
 *   2. User Auth JWT Token: "Authorization: Bearer <jwt_access_token>"
 */
export async function authenticateGateway(
  req: GatewayAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let rawToken: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.split(' ')[1];
    } else if (authHeader && authHeader.startsWith('ApiKey ')) {
      rawToken = authHeader.split(' ')[1];
    } else if (req.headers['x-api-key']) {
      rawToken = req.headers['x-api-key'] as string;
    } else if (req.cookies?.token) {
      rawToken = req.cookies.token;
    }

    if (!rawToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'OneAPI Developer API Key (sk_live_...) or User Auth Token is required.',
        },
      });
      return;
    }

    // 1. Check if token is a User JWT Session Access Token
    try {
      const decoded = verifyAccessToken(rawToken);
      if (decoded?.userId) {
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = user;
          return next();
        }
      }
    } catch {
      // Not a valid JWT, proceed to Developer API Key check
    }

    // 2. Check Developer API Key in dedicated ApiKey model
    const hashedToken = hashToken(rawToken);
    const keyDoc = await ApiKey.findOne({
      keyHash: hashedToken,
      isActive: true,
    }).populate('userId');

    if (keyDoc && keyDoc.userId) {
      const user = keyDoc.userId as any;
      req.user = user;
      req.apiKeyMeta = {
        name: keyDoc.name,
        keyPrefix: keyDoc.keyPrefix,
      };

      // Async update lastUsedAt
      ApiKey.updateOne({ _id: keyDoc._id }, { $set: { lastUsedAt: new Date() } }).catch(() => {});
      return next();
    }

    // 3. Fallback check across legacy embedded User.apiKeys
    const allUsersWithKey = await User.findOne({
      'apiKeys.keyHash': hashedToken,
      'apiKeys.isActive': true,
    });

    if (allUsersWithKey) {
      req.user = allUsersWithKey;
      return next();
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'The provided OneAPI API Key or Token is invalid or has been revoked.',
      },
    });
  } catch (err: any) {
    next(err);
  }
}
