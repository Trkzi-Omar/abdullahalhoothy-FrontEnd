import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContextType, AuthResponse, AuthSuccessResponse } from '../types/allTypesAndInterfaces';
import { HttpReq } from '../services/apiService';
import urls from '../urls.json';
import { useLocation } from 'react-router';
import { useSearchParams } from 'react-router-dom';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to detect guest users
export const isGuestUser = (authResponse: AuthResponse | null): boolean => {
  if (!authResponse) return false;
  const email = authResponse.email?.toLowerCase() || '';
  return (
    email === 'guest' ||
    email === 'guest@slocator.com' ||
    (authResponse as any).registered === false ||
    authResponse.localId?.startsWith('guest_') === true
  );
};

export const performGoogleLogin = async (
  setAuthResponse: (response: AuthResponse) => void,
  credential: string
): Promise<AuthResponse> => {
  return new Promise((resolve, reject) => {
    HttpReq<AuthResponse>(
      urls.google_login,
      (data: AuthResponse) => {
        if (!data || !('idToken' in data)) {
          reject(new Error('Google Login Error: Invalid response'));
          return;
        }
        setAuthResponse(data);
        resolve(data);
      },
      () => {},
      () => {},
      () => {},
      (error: any) => {
        reject(error);
      },
      'post',
      { credential }
    );
  });
};

export const performLogin = async (
  setAuthResponse: (response: AuthResponse) => void,
  options: { isGuest?: boolean; email?: string; password?: string; source?: string } = {}
): Promise<AuthResponse> => {
  const storedAuth = localStorage.getItem('authResponse');

  if (storedAuth) {
    try {
      const parsedAuth = JSON.parse(storedAuth) as AuthSuccessResponse;
      if (parsedAuth && 'idToken' in parsedAuth) {
        const isStoredGuest = isGuestUser(parsedAuth);

        if (options.isGuest || !isStoredGuest) {
          setAuthResponse(parsedAuth);
          return parsedAuth;
        }
      }
    } catch (e) {
      console.error('Failed to parse stored auth:', e);
    }
  }

  return new Promise((resolve, reject) => {
    const credentials = options.isGuest
      ? {
          email: 'guest@slocator.com',
          password: 'guest',
          ...(options.source && { source: options.source }),
        }
      : { email: options.email!, password: options.password! };

    HttpReq<AuthResponse>(
      urls.login,
      (data: AuthResponse) => {
        if (!data || !('idToken' in data)) {
          reject(new Error('Login Error: Invalid response'));
          return;
        }

        if (options.isGuest && isGuestUser(data) && options.source) {
          (data as any).source = options.source;
        }

        setAuthResponse(data);
        resolve(data);
      },
      () => {},
      () => {},
      () => {},
      (error: any) => {
        reject(error);
      },
      'post',
      credentials
    );
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authResponse, setAuthResponse] = useState<AuthResponse>(() => {
    const stored = localStorage.getItem('authResponse');
    return stored ? (JSON.parse(stored) as AuthSuccessResponse) : null;
  });

  const pathname = useLocation().pathname;
  const [searchParams] = useSearchParams();
  const urlSource = searchParams.get('source');
  const urlAuth = searchParams.get('auth');
  const [sourceLocal, setSourceLocal] = useState<string | null>(null);

  const logout = () => {
    localStorage.removeItem('authResponse');
    setAuthResponse(null);
  };

  useEffect(() => {
    if (authResponse && 'idToken' in authResponse) {
      localStorage.setItem('authResponse', JSON.stringify(authResponse));
    } else {
      localStorage.removeItem('authResponse');
    }
  }, [authResponse]);

  useEffect(() => {
    if (pathname === '/auth' && urlAuth !== 'auto') return;

    let source: string | null = null;
    if (urlSource) {
      source = urlSource;
      localStorage.setItem('source', urlSource);
    } else {
      const storedSource = localStorage.getItem('source');
      if (storedSource) {
        source = storedSource;
      }
    }

    setSourceLocal(source);
    const initializeAuth = async () => {
      const storedAuth = localStorage.getItem('authResponse');
      if (!storedAuth) {
        setAuthLoading(true);
        try {
          const loginOptions: { isGuest?: boolean; source?: string } = { isGuest: true };
          if (source) {
            loginOptions.source = source;
          }
          await performLogin(setAuthResponse, loginOptions);
        } catch (error) {
          console.error('Failed to initialize guest session:', error);
        } finally {
          setAuthLoading(false);
        }
      } else {
        setAuthLoading(false);
      }
    };
    initializeAuth();
  }, [urlAuth]);

  // useEffect(() => {
  //   let source: string | null = null;
  //   if (urlSource) {
  //     source = urlSource;
  //     localStorage.setItem('source', urlSource);
  //   } else {
  //     const storedSource = localStorage.getItem('source');
  //     if (storedSource) {
  //       source = storedSource;
  //     }
  //   }
  //   setSourceLocal(source);
  // }, [urlSource]);
  console.log('sourceLocal', sourceLocal);

  const isAuthenticated = !!(authResponse && 'idToken' in authResponse);
  const [authLoading, setAuthLoading] = useState(() => {
    return !localStorage.getItem('authResponse');
  });

  const value = {
    authResponse,
    setAuthResponse,
    isAuthenticated,
    authLoading,
    logout,
    sourceLocal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
