"use client";

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";

import { createAuthApiClient } from "./api";
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  OtpResponse,
  ResetPasswordRequest,
} from "./types";

type HookClientOptions = {
  baseUrl?: string;
};

const DEFAULT_BASE_URL = "/api/auth";

function getClient(baseUrl?: string) {
  return createAuthApiClient({ baseUrl: baseUrl ?? DEFAULT_BASE_URL });
}

export function useLoginMutation(
  options?: UseMutationOptions<LoginResponse, Error, LoginRequest> &
    HookClientOptions
): UseMutationResult<LoginResponse, Error, LoginRequest> {
  const client = getClient(options?.baseUrl);
  return useMutation({
    mutationFn: (input) => client.login(input),
    ...options,
  });
}

export function useRequestOtpMutation(
  options?: UseMutationOptions<OtpResponse, Error, string> & HookClientOptions
): UseMutationResult<OtpResponse, Error, string> {
  const client = getClient(options?.baseUrl);
  return useMutation({
    mutationFn: (email) => client.requestOtp(email),
    ...options,
  });
}

export function useVerifyOtpMutation(
  options?: UseMutationOptions<
    OtpResponse,
    Error,
    { email: string; otp: string }
  > &
    HookClientOptions
): UseMutationResult<OtpResponse, Error, { email: string; otp: string }> {
  const client = getClient(options?.baseUrl);
  return useMutation({
    mutationFn: ({ email, otp }) => client.verifyOtp(email, otp),
    ...options,
  });
}

export function useResetPasswordMutation(
  options?: UseMutationOptions<OtpResponse, Error, ResetPasswordRequest> &
    HookClientOptions
): UseMutationResult<OtpResponse, Error, ResetPasswordRequest> {
  const client = getClient(options?.baseUrl);
  return useMutation({
    mutationFn: (input) => client.resetPassword(input),
    ...options,
  });
}

export function useLogoutMutation(
  options?: UseMutationOptions<LogoutResponse, Error, void> & HookClientOptions
): UseMutationResult<LogoutResponse, Error, void> {
  const client = getClient(options?.baseUrl);
  return useMutation({
    mutationFn: () => client.logout(),
    ...options,
  });
}

