import { Router } from 'express';

import { executeCode } from '../controllers/execute';

import { authenticateUser } from '../middleware';

const router = Router();

router.post('/', authenticateUser, executeCode);

export default router;