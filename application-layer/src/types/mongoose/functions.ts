import mongoose from "mongoose";

export type MongooseConnectFunction = (MONGO_URI: string) => Promise<typeof mongoose>;