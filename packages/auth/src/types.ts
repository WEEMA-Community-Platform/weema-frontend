export type WeemaRole = "admin" | "cluster_admin" | "facilitator";

export type WeemaBackendRole =
  | "ROLE_SUPER_ADMIN"
  | "ROLE_ADMIN"
  | "ROLE_CLUSTER_ADMIN"
  | "ROLE_FACILITATOR";

export type AuthStatusCode = string;

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  statusCode: AuthStatusCode;
  role: string;
  isFirstTimeLogin: boolean;
  accessToken: string;
  refreshToken: string;
  email: string;
};

export type OtpResponse = {
  message: string;
  statusCode: AuthStatusCode;
};

export type ResetPasswordRequest = {
  email: string;
  otp: string;
  newPassword: string;
};

export type RefreshResponse = {
  message: string;
  statusCode: AuthStatusCode;
  accessToken: string;
  refreshToken?: string;
};

export type LogoutResponse = {
  message: string;
  statusCode: AuthStatusCode;
};

