import { Document } from "mongoose"

interface IUser extends Document {
  username: string;
  email: string;
  password_hash: string;
  role: 'Student' | 'Instructor';
  created_at: Date;
}

export {
  IUser
}