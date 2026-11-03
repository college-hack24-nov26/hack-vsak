import { Router } from 'express';
import {
  signup,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  refreshToken,
  logout,
  createApiKeyHandler,
  listApiKeys,
  getApiKeyById,
  updateApiKey,
  revokeApiKey,
  validateApiKeyHandler,
} from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter, sensitiveLimiter } from '../middleware/rateLimiter.js';
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createApiKeySchema,
  updateApiKeySchema,
  validateApiKeySchema,
} from '../validations/auth.validation.js';

const router = Router();

/**
 * ---------------------------------------------------------------------------
 * Public Authentication Routes
 * ---------------------------------------------------------------------------
 */
// 1. User Signup (user_id, name, phone_no, email, password, terms_accepted)
router.post('/signup', authLimiter, validateBody(signupSchema), signup);

// 2. Verify OTP / Email
router.post('/verify-otp', authLimiter, validateBody(verifyOtpSchema), verifyOtp);
router.post('/verify-email', authLimiter, validateBody(verifyOtpSchema), verifyOtp);

// 3. Resend OTP
router.post('/resend-otp', sensitiveLimiter, validateBody(resendOtpSchema), resendOtp);

// 4. User Login
router.post('/login', authLimiter, validateBody(loginSchema), login);

// 5. Forgot Password
router.post('/forgot-password', sensitiveLimiter, validateBody(forgotPasswordSchema), forgotPassword);

// 6. Reset Password
router.post('/reset-password', sensitiveLimiter, validateBody(resetPasswordSchema), resetPassword);

// 7. Refresh Access Token
router.post('/refresh-token', refreshToken);

/**
 * ---------------------------------------------------------------------------
 * AI API Key Validation Endpoint (Validates using userId + email)
 * ---------------------------------------------------------------------------
 */
// 8. Validate API Key for AI Agents & Services
router.post('/api-keys/validate', validateBody(validateApiKeySchema), validateApiKeyHandler);

/**
 * ---------------------------------------------------------------------------
 * Protected Profile & Session Routes (Require Bearer Token)
 * ---------------------------------------------------------------------------
 */
// 9. Current User Profile
router.get('/me', authenticate, getMe);

// 10. Logout
router.post('/logout', authenticate, logout);

/**
 * ---------------------------------------------------------------------------
 * Protected API Key CRUD Operations (Require Bearer Token)
 * ---------------------------------------------------------------------------
 */
// 11. Create API Key (both /create-api-key and /api-keys routes supported)
router.post('/create-api-key', authenticate, validateBody(createApiKeySchema), createApiKeyHandler);
router.post('/api-keys', authenticate, validateBody(createApiKeySchema), createApiKeyHandler);

// 12. List All Active API Keys for Current User
router.get('/api-keys', authenticate, listApiKeys);

// 13. Read Single API Key Details by Key ID
router.get('/api-keys/:keyId', authenticate, getApiKeyById);

// 14. Update API Key (Rename or Toggle Active/Inactive Status)
router.patch('/api-keys/:keyId', authenticate, validateBody(updateApiKeySchema), updateApiKey);

// 15. Delete / Revoke API Key
router.delete('/api-keys/:keyId', authenticate, revokeApiKey);

export const authRoutes = router;
