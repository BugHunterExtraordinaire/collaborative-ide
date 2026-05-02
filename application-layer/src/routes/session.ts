import { Router } from 'express';

import { 
  createSession, 
  deleteSession, 
  getSessions,
  getSession, 
  getSessionHistory 
} from '../controllers/session';

import { authenticateUser } from '../middleware';

const router = Router();

router.post('/', authenticateUser, createSession);

router.get('/', authenticateUser, getSessions);
router.get('/:id', authenticateUser, getSession);
router.get('/:id/history', authenticateUser, getSessionHistory);

router.delete('/:id', authenticateUser, deleteSession);

export default router;