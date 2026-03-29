import { JwtPayload } from "jsonwebtoken";
import { BadRequestError, NotFoundError } from "../types/express/errors";
import { DefaultController } from "../types/express/functions";
import User from "../models/User";

const loginUser: DefaultController = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new BadRequestError("Please provide both email and password");

  const user = await User.findOne({ email });
  if (!user) throw new NotFoundError("Invalid Credentials!");

  const isMatch = await user.verifyPassword(password);
  if (!isMatch) throw new BadRequestError("Invalid Credentials!");

  const jwtPayload: JwtPayload = {
    userId: user._id,
    username: user.username,
    role: user.role
  };

  const token = user.generateJWT(jwtPayload);

  res.status(200).json({
    message: "Login successful",
    token,
    user: jwtPayload,
  });
}

const registerUser: DefaultController = async (req, res) => {
  
}

export {
  loginUser,
  registerUser,
}