import ApiError from "./ApiError";

export default class UnauthenticatedError extends ApiError {
  constructor(message: string) {
    super(message, 401);
  }
}