import { Router } from 'express';

import { createSession, deleteSession, getSession, getSessionHistory } from '../controllers/session';

import { authenticateUser } from '../middleware';

const router = Router();

router.post('/', authenticateUser, createSession);

router.get('/', authenticateUser, getSession);
router.get('/:id/history', authenticateUser, getSessionHistory);

router.delete('/:id', authenticateUser, deleteSession);

export default router;