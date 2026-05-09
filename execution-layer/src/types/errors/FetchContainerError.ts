import ApiError from "./ApiError";

export default class FetchContainerError extends ApiError {
  constructor(message: string) {
    super(message, 500);
  }
}