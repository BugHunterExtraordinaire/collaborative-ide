import { UnauthenticatedError } from "../types/express/errors";
import { DefaultMiddleware } from "../types/express/functions";
import jwt from 'jsonwebtoken';

const authenticateUser: DefaultMiddleware = async (req, res, next) => {
  const token = req.cookies.ide_token;

  const isVerified = jwt.verify(token, process.env.JWT_SECRET as string);
  if (!isVerified) next(new UnauthenticatedError("User not authenticated."));

  next();
}

export default authenticateUser;