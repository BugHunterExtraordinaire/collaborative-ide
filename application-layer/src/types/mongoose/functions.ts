import mongoose from "mongoose";

type MongooseConnectFunction = (MONGO_URI: string) => Promise<typeof mongoose>;

export {
  MongooseConnectFunction
}