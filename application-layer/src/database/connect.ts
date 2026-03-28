import mongoose from "mongoose";
import { MongooseConnectFunction } from "../types/mongoose/functions";

const connectDB: MongooseConnectFunction = async (MONGO_URI) => {
  return await mongoose.connect(MONGO_URI, {
    dbName: "COLLABORATIVE_CODING_SITE",
  });
}

export default connectDB;