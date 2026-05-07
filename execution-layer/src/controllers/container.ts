import { Request, Response } from 'express';

import { docker } from '../services/dockerService';

import { DefaultController } from '../types/functions';

export const getContainers: DefaultController = async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const activeRunners = containers.filter(container =>
      container.Image.includes('node') || container.Image.includes('python') || container.Image.includes('alpine')
    );

    res.status(200).json(activeRunners);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch containers', error: error.message });
  }
};

export const deleteContainer = async (req: Request, res: Response): Promise<void> => {
  try {
    const container = docker.getContainer(req.params.id as string);
    await container.remove({ force: true });

    res.status(200).json({ message: `Container ${req.params.id} destroyed.` });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to destroy container', error: error.message });
  }
};