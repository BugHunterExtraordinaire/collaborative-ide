import mongoose from "mongoose";
import { ApiError } from "../types/express/errors";
import { type ErrorMiddlware } from "../types/express/functions";

const handleError: ErrorMiddlware = async (err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message });
    return; 
  } 
  
  if (err.name === 'MongoServerError' && err.code === 11000) {
    res.status(400).json({ message: 'Duplicate Key Error: You have a ghost index from an old schema. Drop the index in MongoDB.' });
    return;
  }

  if (err instanceof mongoose.Error) {
    if (err instanceof mongoose.Error.ValidationError) {
      let errorString: Array<string> = [];
      for (const error in err.errors) {
        errorString.push(error);
      }
      res.status(400).json({ message: `Error validating: ${errorString.join(', ')} Fields` });
    } else if (err instanceof mongoose.Error.CastError) {
      res.status(400).json({ message: "Casting Error please enter valid data type" });
    } else {
      res.status(400).json({ message: err.message });
    }
    return;
  } 
  
  console.error("Unhandled Server Error:", err);
  res.status(500).json({ message: 'Internal Server Error' });
};

export default handleError;