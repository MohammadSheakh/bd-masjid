/**
 * Enterprise Authentication Service (ADR-003, ADR-054)
 * - Synchronous UI access to authenticated contributor state (< 1ms latency)
 * - Fast token hydration on boot via SecureTokenStorage
 * - Pub/Sub subscription dispatch for navbar and modal listeners
 */

import { ApiClient } from '../lib/apiClient';
import { SecureTokenStorage } from '../lib/storage';
import { AuthSession, LoginPayload, RegisterPayload, UserProfile, UserRole } from '../types/auth';

let cachedUser: UserProfile | null = null;
let isHydrated: boolean = false;
const authListeners = new Set<(session: AuthSession) => void>();

function notifyAuthListeners(): void {
  const session: AuthSession = {
    user: cachedUser,
    isAuthenticated: !!cachedUser,
  };
  authListeners.forEach((fn) => {
    try {
      fn(session);
    } catch {}
  });
}

export const AuthService = {
  getUserSync(): UserProfile | null {
    return cachedUser;
  },

  isAuthenticatedSync(): boolean {
    return !!cachedUser;
  },

  isHydratedSync(): boolean {
    return isHydrated;
  },

  subscribeAuth(listener: (session: AuthSession) => void): () => void {
    authListeners.add(listener);
    listener({
      user: cachedUser,
      isAuthenticated: !!cachedUser,
    });
    return () => {
      authListeners.delete(listener);
    };
  },

  async hydrateSession(): Promise<AuthSession> {
    try {
      const token = await SecureTokenStorage.getAccessToken();
      if (token) {
        const user = await ApiClient.fetchCurrentUserSession();
        cachedUser = user;
      } else {
        cachedUser = null;
      }
    } catch {
      cachedUser = null;
    } finally {
      isHydrated = true;
      notifyAuthListeners();
    }
    return {
      user: cachedUser,
      isAuthenticated: !!cachedUser,
    };
  },

  async login(payload: LoginPayload): Promise<UserProfile> {
    const res = await ApiClient.loginUser(payload);
    cachedUser = res.user;
    notifyAuthListeners();
    return res.user;
  },

  async register(payload: RegisterPayload): Promise<UserProfile> {
    const res = await ApiClient.registerUser(payload);
    cachedUser = res.user;
    notifyAuthListeners();
    return res.user;
  },

  async logout(): Promise<void> {
    try {
      await ApiClient.logoutUser();
    } finally {
      cachedUser = null;
      notifyAuthListeners();
    }
  },

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  getRoleBadge(role?: UserRole, isBangla: boolean = false): string {
    switch (role) {
      case 'ADMIN':
        return isBangla ? 'অ্যাডমিন' : 'Admin';
      case 'MODERATOR':
        return isBangla ? 'মডারেটর' : 'Moderator';
      case 'CONTRIBUTOR':
        return isBangla ? 'কমিউনিটি সেবক' : 'Contributor';
      default:
        return isBangla ? 'মুসুল্লি' : 'Musalli';
    }
  },
};
