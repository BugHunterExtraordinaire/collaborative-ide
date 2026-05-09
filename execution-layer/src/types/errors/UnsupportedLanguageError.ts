import ApiError from "./ApiError";

export default class UnsupportedLanguageError extends ApiError {
  constructor(message: string) {
    super(message, 400);
  }
}