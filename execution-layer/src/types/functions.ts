import { Request, Response } from "express"

export type DefaultController = (req: Request, res: Response) => Promise<void>;
export type DockerImageFunction = (imageName: string) => Promise<void>;