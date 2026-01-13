import { act, render, renderHook, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

vi.mock('../services/api', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn()
    }
  };
});

const api = (await import('../services/api')).default;

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    api.get.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    cleanup();
  });

  it('throws when useAuth is called outside provider', () => {
    function Outside() {
      useAuth();
      return null;
    }
    expect(() => render(<Outside />)).toThrow('useAuth must be used within an AuthProvider');
  });

  it('logs in and stores session/user data', async () => {
    api.post.mockImplementation((url) => {
      if (url === '/auth/login/') {
        return Promise.resolve({
          data: {
            user: {
              user_id: 1,
              name: 'Test User',
              email: 'test@example.com',
              role: 'user'
            },
            session_id: 'session-123'
          }
        });
      }
      if (url === '/auth/logout/') {
        return Promise.resolve({ data: {} });
      }
      return Promise.resolve({ data: {} });
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login/', {
      email: 'test@example.com',
      password: 'password123'
    });
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('sessionId')).toBe('session-123');
  });

  it('returns MFA requirement without mutating state', async () => {
    api.post.mockImplementation((url) => {
      if (url === '/auth/login/') {
        return Promise.resolve({
          data: {
            requiresMfa: true,
            message: 'OTP required',
            email: 'mfa@example.com'
          }
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.login('mfa@example.com', 'password');
    });

    expect(response).toMatchObject({
      requiresMfa: true,
      message: 'OTP required',
      email: 'mfa@example.com'
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('sessionId')).toBeNull();
  });

  it('logs out and clears session data', async () => {
    api.post.mockImplementation((url) => {
      if (url === '/auth/login/') {
        return Promise.resolve({
          data: {
            user: {
              user_id: 1,
              name: 'Test User',
              email: 'logout@example.com',
              role: 'user'
            },
            session_id: 'session-logout'
          }
        });
      }
      if (url === '/auth/logout/') {
        return Promise.resolve({ data: { ok: true } });
      }
      return Promise.resolve({ data: {} });
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('logout@example.com', 'password');
    });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/logout/');
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('sessionId')).toBeNull();
  });
});
