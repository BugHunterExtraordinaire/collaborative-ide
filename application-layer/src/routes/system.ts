import { Router } from 'express';

import { authenticateUser } from '../middleware';

import {
  getContainers,
  deleteContainer,
  getSessions,
} from '../controllers/system';

const router = Router();

router.use(authenticateUser);

router.get('/containers', getContainers);
router.get('/sessions', getSessions);

router.delete('/containers/:id', deleteContainer);

export default router;