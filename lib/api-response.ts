import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string | null;
};

export type ApiError = {
  success: false;
  data: null;
  message: string;
  errors?: unknown[];
};

export function apiSuccess<T>(data: T, message: string | null = null) {
  return NextResponse.json<ApiSuccess<T>>({
    success: true,
    data,
    message,
  });
}

export function apiCreated<T>(data: T, message: string | null = null) {
  return NextResponse.json<ApiSuccess<T>>(
    { success: true, data, message },
    { status: 201 },
  );
}

export function apiError(
  message: string,
  status = 400,
  errors?: unknown[],
) {
  return NextResponse.json<ApiError>(
    { success: false, data: null, message, ...(errors ? { errors } : {}) },
    { status },
  );
}
