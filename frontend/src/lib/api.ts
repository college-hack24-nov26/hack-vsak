/**
 * Centralized API Client for OneAPI Backend
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  _oneapi?: {
    category: string;
    primaryProvider: string;
    finalProvider: string;
    fallbackTriggered: boolean;
    fallbackReason?: string;
    latencyMs: number;
  };
}

// Token & Session Storage Helpers (Client-side)
// Required tokens only: Auth Token (JWT Access), Refresh Token (JWT Refresh), OneAPI Developer Key (sk_live_...)
export const authStorage = {
  getToken: () => (typeof window !== 'undefined' ? localStorage.getItem('oneapi_access_token') : null),
  setToken: (token: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('oneapi_access_token', token);
  },
  getRefreshToken: () => (typeof window !== 'undefined' ? localStorage.getItem('oneapi_refresh_token') : null),
  setRefreshToken: (token: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('oneapi_refresh_token', token);
  },
  getUser: () => {
    if (typeof window === 'undefined') return null;
    const u = localStorage.getItem('oneapi_user');
    return u ? JSON.parse(u) : null;
  },
  setUser: (user: any) => {
    if (typeof window !== 'undefined') localStorage.setItem('oneapi_user', JSON.stringify(user));
  },
  getApiKey: () => (typeof window !== 'undefined' ? localStorage.getItem('oneapi_developer_key') : null),
  setApiKey: (key: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('oneapi_developer_key', key);
  },
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oneapi_access_token');
      localStorage.removeItem('oneapi_refresh_token');
      localStorage.removeItem('oneapi_user');
      localStorage.removeItem('oneapi_developer_key');
      localStorage.removeItem('oneapi_project_token');
      localStorage.removeItem('oneapi_project_id');
    }
  },
};

// Generic fetch wrapper with single unified Authorization header
export async function fetchApi<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path}`;
  const token = authStorage.getToken();
  const apiKey = authStorage.getApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Single unified authentication header: Bearer token or OneAPI developer key
  if (!headers['Authorization']) {
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to communicate with backend server. Make sure it is running on http://localhost:5000.',
      },
    };
  }
}
