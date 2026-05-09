import { NextFunction, Request, Response } from "express";

export type DefaultController = (req: Request, res: Response, next?: NextFunction) => Promise<any>;
export type DefaultMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<any>;
export type ErrorMiddlware = (err: any, req: Request, res: Response, next: NextFunction) => Promise<any>;