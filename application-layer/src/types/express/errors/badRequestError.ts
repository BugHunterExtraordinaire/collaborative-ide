import ApiError from "./apiError";

export default class BadRequestError extends ApiError {
  constructor(message: string) {
    super(message, 400);
  }
}