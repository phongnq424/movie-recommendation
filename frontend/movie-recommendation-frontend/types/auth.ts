export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  userPublicId: string;
  fullName: string;
  email: string;
  role: string;
  message: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface User {
  publicId: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  status: string;
}
