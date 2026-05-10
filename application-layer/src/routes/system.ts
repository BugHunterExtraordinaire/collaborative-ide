import { Router } from 'express';

import { authenticateUser } from '../middleware';

import {
  getContainers,
  deleteContainer,
} from '../controllers/system';

const router = Router();

router.use(authenticateUser);

router.get('/containers', getContainers);

router.delete('/containers/:id', deleteContainer);

export default router;