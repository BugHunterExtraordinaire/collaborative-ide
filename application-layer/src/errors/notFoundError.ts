import ApiError from "./apiError";

export default class NotFoundError extends ApiError {
  constructor(message) {
    super(message, 404);
  }
}