import { NextFunction, Request, Response } from "express";

type DefaultController = (req: Request, res: Response) => Promise<any>;
type DefaultMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export {
  DefaultController,
  DefaultMiddleware,
}