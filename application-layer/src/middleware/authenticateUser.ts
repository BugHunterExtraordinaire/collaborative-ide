import { UnauthenticatedError } from "../types/express/errors";
import { DefaultMiddleware } from "../types/express/functions";
import { UserPayload } from "../types/express";
import jwt from 'jsonwebtoken';

const authenticateUser: DefaultMiddleware = async (req, res, next) => {
  const token = req.cookies.ide_token;
  if (!token) next(new UnauthenticatedError("User not authenticated. No Token provided."))

  const isVerified = jwt.verify(token, process.env.JWT_SECRET as string);
  if (!isVerified) next(new UnauthenticatedError("User not authenticated. Invalid Token."));
  
  req.user = isVerified as UserPayload;
  next();
}

export default authenticateUser;