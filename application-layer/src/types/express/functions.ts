import mongoose from "mongoose";

import { NextFunction, Request, Response } from "express";

import { ApiError } from "./errors";

type DefaultController = (req: Request, res: Response) => Promise<any>;
type DefaultMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<any>;
type ErrorMiddlware = (err: ApiError | mongoose.Error, req: Request, res: Response, next: NextFunction) => Promise<any>;

export {
  DefaultController,
  DefaultMiddleware,
  ErrorMiddlware,
}