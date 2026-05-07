import { Router } from 'express';

import { getContainers, deleteContainer } from '../controllers/container';

const router = Router();

router.get('/', getContainers);

router.delete('/:id', deleteContainer);

export default router;