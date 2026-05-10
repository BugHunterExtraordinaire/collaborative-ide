import ApiError from "./ApiError";

export default class DestroyContainerError extends ApiError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
  }
}