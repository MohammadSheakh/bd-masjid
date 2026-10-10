/**
 * Authentication and Contributor Identity Domain Models (ADR-003, ADR-054)
 */

export type UserRole = 'USER' | 'CONTRIBUTOR' | 'MODERATOR' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: UserProfile | null;
  isAuthenticated: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}
