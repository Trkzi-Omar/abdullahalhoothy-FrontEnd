import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContextType, AuthResponse, AuthSuccessResponse } from '../types/allTypesAndInterfaces';
import apiRequest from '../services/apiRequest';
import urls from '../urls.json';
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
  credential: string,
  source?: string | null
): Promise<AuthResponse> => {
  const payload: { credential: string; source?: string } = { credential };
  if (source) {
    payload.source = source;
  }

  const response = await apiRequest({
    url: urls.google_login,
    method: 'POST',
    body: payload,
  });

  const data = (response?.data?.data || response?.data) as AuthResponse;
  if (!data || !('idToken' in data)) {
    throw new Error('Google Login Error: Invalid response');
  }

  setAuthResponse(data);
  return data;
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

  const credentials = options.isGuest
    ? {
        email: 'guest@slocator.com',
        password: 'guest',
        ...(options.source && { source: options.source }),
      }
    : { email: options.email!, password: options.password! };

  const response = await apiRequest({
    url: urls.login,
    method: 'POST',
    body: credentials,
  });

  const data = (response?.data?.data || response?.data) as AuthResponse;
  if (!data || !('idToken' in data)) {
    throw new Error('Login Error: Invalid response');
  }

  if (options.isGuest && isGuestUser(data) && options.source) {
    (data as any).source = options.source;
  }

  setAuthResponse(data);
  return data;
};

export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  source?: string;
}

export const performRegistration = async (
  setAuthResponse: (response: AuthResponse) => void,
  data: RegistrationData
): Promise<AuthResponse> => {
  const response = await apiRequest({
    url: urls.create_user_profile,
    method: 'POST',
    body: {
      email: data.email,
      password: data.password,
      username: data.name,
      fullName: data.name,
      phone: data.phone || '',
      reason: '',
      source: data.source || '',
      account_type: 'admin',
      teamId: '',
      show_price_on_purchase: true,
      user_id: '',
    },
  });

  const responseData = response?.data?.data || response?.data;
  if (Array.isArray(responseData) && responseData[0]?.data?.user_id) {
    const userData = responseData[0].data;
    const authData: AuthResponse = {
      localId: userData.user_id,
      email: data.email,
      displayName: data.name,
      idToken: userData.token || '',
      refreshToken: userData.refresh_token || '',
      expiresIn: '3600',
      user: { id: userData.user_id, email: data.email, fullName: data.name },
    };
    setAuthResponse(authData);
    return authData;
  }

  throw new Error(responseData?.detail || 'Registration failed');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authResponse, setAuthResponse] = useState<AuthResponse>(() => {
    const stored = localStorage.getItem('authResponse');
    return stored ? (JSON.parse(stored) as AuthSuccessResponse) : null;
  });

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
