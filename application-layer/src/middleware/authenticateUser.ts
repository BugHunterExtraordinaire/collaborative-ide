import { UnauthenticatedError } from "../types/express/errors";
import { DefaultMiddleware } from "../types/express/functions";
import { UserPayload } from "../types/express";
import jwt from 'jsonwebtoken';

const authenticateUser: DefaultMiddleware = async (req, res, next) => {
  const token = req.cookies.ide_token;
  
  if (!token) {
    return next(new UnauthenticatedError("User not authenticated. No Token provided."));
  }

  try {
    const isVerified = jwt.verify(token, process.env.JWT_SECRET as string);
    
    req.user = isVerified as UserPayload;
    next();
  } catch (error) {
    return next(new UnauthenticatedError("User not authenticated. Invalid or Expired Token."));
  }
}

export default authenticateUser;