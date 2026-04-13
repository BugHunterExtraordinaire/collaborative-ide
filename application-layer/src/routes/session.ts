import { Router } from 'express';
import { createSession, getSession } from '../controllers/session';

const router = Router();

router.post('/', createSession);

router.get('/', getSession);

export default router;