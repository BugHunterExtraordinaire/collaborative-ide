import ApiError from "./ApiError";

export default class ExecutionTimeoutError extends ApiError {
  constructor(message: string) {
    super(message, 500);
  }
}