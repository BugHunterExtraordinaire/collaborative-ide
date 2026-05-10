import { ErrorHandlerFunction } from "../types/functions";

import { ApiError } from "../types/errors";

const handleError: ErrorHandlerFunction = async (err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message });
  } else {
    res.status(500).json({ message: "Internal Execution Server Error" });
  }
}

export default handleError;