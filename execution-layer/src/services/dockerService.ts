import Docker from 'dockerode';

import { DockerImageFunction } from '../types/functions';

export const docker = new Docker();

export const ensureImageExists: DockerImageFunction = async (imageName) => {
  try {
    await docker.getImage(imageName).inspect();
    return;
  } catch (error) {
    console.log(`Image not found locally. Pulling ${imageName}...`);
    return new Promise((resolve, reject) => {
      docker.pull(imageName, (err: any, stream: any) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (err, output) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }
}