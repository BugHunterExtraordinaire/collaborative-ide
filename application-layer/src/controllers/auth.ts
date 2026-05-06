import { JwtPayload } from "jsonwebtoken";

import User from "../models/User";

import { BadRequestError, NotFoundError } from "../types/express/errors";
import { DefaultController } from "../types/express/functions";

export const loginUser: DefaultController = async (req, res) => {
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

  res.cookie('ide_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 6 * 60 * 60 * 1000
  });

  res.status(200).json({
    message: "Login successful!",
    user: jwtPayload,
  });
}

export const registerUser: DefaultController = async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) throw new BadRequestError("Please provide all fields");

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) throw new BadRequestError("User with that email or username already exists");

  const user = await User.create({
    username,
    email,
    passwordHash: password,
    role
  });

  res.status(201).json({ message: "User created successfully!" });
}

export const logoutUser: DefaultController = async (req, res) => {
  res.clearCookie('ide_token');
  res.status(200).json({ message: "Logged out successfully!" });
}