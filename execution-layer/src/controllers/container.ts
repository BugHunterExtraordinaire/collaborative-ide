import { docker } from '../services/dockerService';

import { DefaultController } from '../types/functions';

import { DestroyContainerError, FetchContainerError } from '../types/errors';

export const getContainers: DefaultController = async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const activeRunners = containers.filter(container =>
      container.Image.includes('node') || container.Image.includes('python') || (container.Image.includes('alpine') && !container.Image.includes('nginx'))
    );

    res.status(200).json(activeRunners);
  } catch (error: any) {
    throw new FetchContainerError("Failed to fetch controllers");
  }
};

export const deleteContainer: DefaultController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const container = docker.getContainer(id as string);
    if (!container) throw new DestroyContainerError(`No container was found with id: ${id}`, 400);

    await container.remove({ force: true });

    res.status(200).json({ message: `Container ${req.params.id} destroyed.` });
  } catch (error: any) {
    if (error instanceof DestroyContainerError && error.statusCode === 400) {
      return next!(error);
    }

    throw new DestroyContainerError("Failed to destroy container", 500);
  }
};