import { Router } from 'express';

import { 
  createSession, 
  deleteSession, 
  getSessions,
  getSession, 
  getSessionHistory,
  getSessionAnalytics
} from '../controllers/session';

import { authenticateUser } from '../middleware';

const router = Router();

router.use(authenticateUser);

router.route('/').get(getSessions)
                 .post(createSession);

router.route('/:id').get(getSession)
                    .delete(deleteSession);

router.get('/:id/history', getSessionHistory);

router.get('/:id/analytics', getSessionAnalytics);

export default router;