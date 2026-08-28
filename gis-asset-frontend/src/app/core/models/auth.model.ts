export type UserRole = 'ADMIN' | 'VIEWER';

export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: string;
  user: PublicUser;
}
