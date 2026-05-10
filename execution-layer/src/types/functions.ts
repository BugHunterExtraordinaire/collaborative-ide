import { NextFunction, Request, Response } from "express"

export type DefaultController = (req: Request, res: Response, next?: NextFunction) => Promise<void>;
export type ErrorHandlerFunction = (err: any, req: Request, res: Response, next: NextFunction) => Promise<void>;
export type DockerImageFunction = (imageName: string) => Promise<void>;