import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_LICENSE"
  | "LICENSE_EXPIRED"
  | "LICENSE_REVOKED"
  | "LICENSE_BANNED"
  | "LICENSE_PAUSED"
  | "INVALID_CREDENTIALS"
  | "USER_BANNED"
  | "USER_EXPIRED"
  | "USER_DISABLED"
  | "DEVICE_MISMATCH"
  | "DEVICE_LIMIT_REACHED"
  | "DEVICE_BANNED"
  | "APPLICATION_DISABLED"
  | "APPLICATION_MAINTENANCE"
  | "APPLICATION_NOT_FOUND"
  | "RATE_LIMITED"
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INTERNAL_SERVER_ERROR";

export interface ApiResponseSuccess<T = unknown> {
  success: true;
  data: T;
  error: null;
}

export interface ApiResponseError {
  success: false;
  data: null;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiResponseSuccess<T> | ApiResponseError;

export function apiSuccess<T>(data: T, status: number = 200) {
  const body: ApiResponseSuccess<T> = {
    success: true,
    data,
    error: null,
  };
  return NextResponse.json(body, { status });
}

export function apiError(code: ApiErrorCode, message: string, status: number = 400, details?: unknown) {
  const body: ApiResponseError = {
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}
