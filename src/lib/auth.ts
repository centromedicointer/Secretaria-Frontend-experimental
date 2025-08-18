import { api } from './api';
import type { User } from '@/integrations/postgres/types';

export interface AuthUser extends User {
  roles: string[];
  dashboardPermissions: string[];
  isAdmin: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

// Simple session storage for user data
const USER_STORAGE_KEY = 'secretaria_user';

export const getStoredUser = (): AuthUser | null => {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: AuthUser | null): void => {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

export const loginUser = async (email: string, password: string): Promise<AuthUser | null> => {
  try {
    const response = await api.login(email, password);
    const authUser: AuthUser = response.user;

    setStoredUser(authUser);
    return authUser;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const logoutUser = (): void => {
  setStoredUser(null);
};

export const hasRole = (user: AuthUser | null, role: string): boolean => {
  return user?.roles.includes(role) || false;
};

export const hasDashboardPermission = (user: AuthUser | null, dashboard: string): boolean => {
  if (!user) return false;
  return user.isAdmin || user.dashboardPermissions.includes(dashboard);
};