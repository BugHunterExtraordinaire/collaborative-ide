import ApiError from "./apiError";

export default class BadRequestError extends ApiError {
  constructor(message) {
    super(message, 400);
  }
}