import ApiError from "./ApiError";

export default class MissingRequestBodyInfoError extends ApiError {
  constructor(message: string) {
    super(message, 400);
  }
}