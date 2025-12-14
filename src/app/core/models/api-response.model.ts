import { HttpStatusCode } from "@angular/common/http";

// Espelho do ResponseBase<T> do C#
export interface ApiResponse<T> {
  data: T;
  statusCode: HttpStatusCode;
  message?: string;
}

// Espelho do ResponseError<T> do C# (onde T geralmente é string[])
export interface ApiErrorResponse<T = string[]> {
  errors: T;
  statusCode: HttpStatusCode;
  message?: string;
}