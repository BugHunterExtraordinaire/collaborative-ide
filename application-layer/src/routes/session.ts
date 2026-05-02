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

router.use(authenticateUser);

router.route('/').get(getSessions)
                 .post(createSession);

router.route('/:id').get(getSession)
                    .delete(deleteSession);

router.get('/:id/history', getSessionHistory);

export default router;