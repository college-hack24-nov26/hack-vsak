import type { Request, Response, NextFunction } from 'express';
import { Project, type IProject } from '../models/Project.js';
import { hashToken } from '../utils/crypto.js';

export interface ProjectAuthenticatedRequest extends Request {
  project?: IProject;
}

/**
 * Middleware that authenticates incoming proxy requests using the OneAPI Project Token.
 * Accepts:
 *   - Authorization: Bearer oneapi_dev_token_xxx
 *   - x-project-token: oneapi_dev_token_xxx
 */
export async function authenticateProject(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let rawToken: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.split(' ')[1];
    } else if (req.headers['x-project-token']) {
      rawToken = req.headers['x-project-token'] as string;
    }

    if (!rawToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_PROJECT_TOKEN',
          message: 'OneAPI Project Token is required. Supply via "Authorization: Bearer <token>" or "x-project-token" header.',
        },
      });
      return;
    }

    const hashedToken = hashToken(rawToken);
    const project = await Project.findOne({ projectTokenHash: hashedToken, isActive: true });

    if (!project) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_TOKEN',
          message: 'The provided OneAPI Project Token is invalid or has been deactivated.',
        },
      });
      return;
    }

    req.project = project;
    next();
  } catch (err: any) {
    next(err);
  }
}
