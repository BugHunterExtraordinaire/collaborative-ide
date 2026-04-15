import { Router } from 'express';
import { createSession, getSession, getSessionHistory } from '../controllers/session';

const router = Router();

router.post('/', createSession);

router.get('/', getSession);
router.get('/:id/history', getSessionHistory);

export default router;