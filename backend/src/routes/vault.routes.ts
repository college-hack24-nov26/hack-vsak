import { Router } from 'express';
import { getVaultSecrets, saveVaultSecret, deleteVaultSecret } from '../controllers/vault.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All vault routes require developer authentication
router.use(authenticate);

router.get('/', getVaultSecrets);
router.post('/', saveVaultSecret);
router.delete('/:providerId', deleteVaultSecret);

export const vaultRoutes = router;
