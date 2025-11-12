// src/components/GuestAutoLogin.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HttpReq } from '../../services/apiService';
import urls from '../../urls.json';
import { AuthResponse } from '../../types/allTypesAndInterfaces';
import { useAuth } from '../../context/AuthContext';

const GuestAutoLogin = () => {
  const { isAuthenticated, authResponse, setAuthResponse } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const [bannerVisible, setBannerVisible] = useState(true);

  // Auto-login guest on homepage or marketing pages
  useEffect(() => {
    const performGuestLogin = async () => {
      if (isAuthenticated) return;

      const path = location.pathname.replace(/^\/+/, ''); // remove leading slash
      const source = path && path !== '' ? path : undefined;

      try {
        await HttpReq(
          urls.login,
          (data: AuthResponse) => {
            // Detect guest user
            if (data.email === 'guest' || data.registered === false || data.localId?.startsWith('guest_')) {
              if (source) (data as any).source = source;
            }
            setAuthResponse(data);
          },
          () => {},
          () => {},
          () => {},
          (error) => console.error('Guest login error', error),
          'post',
          { email: 'guest@slocator.com', password: 'guest', source }
        );
      } catch (e) {
        console.error('Guest login failed', e);
      }
    };

    if (location.pathname !== '/auth') {
      performGuestLogin();
    }
  }, [isAuthenticated, location.pathname, setAuthResponse]);

  if (!authResponse) return null;

  const isGuest =
    authResponse.email === 'guest' ||
    authResponse.registered === false ||
    authResponse.localId?.startsWith('guest_');

  if (!isGuest || !bannerVisible) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-yellow-200 text-black py-3 px-4 flex justify-between items-center z-50 shadow-md">
      <span>
        You are logged in as a guest user. Please{' '}
        <button className="underline font-semibold" onClick={() => nav('/sign-up')}>
          sign up
        </button>{' '}
        or{' '}
        <button className="underline font-semibold" onClick={() => nav('/auth')}>
          sign in
        </button>{' '}
        to access full features.
      </span>
      <button onClick={() => setBannerVisible(false)} className="font-bold px-2">
        ×
      </button>
    </div>
  );
};

export default GuestAutoLogin;
