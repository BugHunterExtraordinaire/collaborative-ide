import { Router } from 'express';

import { authenticateUser } from '../middleware';

import {
  getContainers,
  deleteContainer,
} from '../controllers/system';

const router = Router();

router.get('/containers', authenticateUser, getContainers);

router.delete('/containers/:id', authenticateUser, deleteContainer);

export default router;