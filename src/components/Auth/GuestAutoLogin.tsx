import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HttpReq } from '../../services/apiService';
import urls from '../../urls.json';
import { AuthSuccessResponse } from '../../types/allTypesAndInterfaces';
import GuestBanner from './GuestBanner'; // import banner

export default function GuestManager({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { source } = useParams<{ source?: string }>();
  const { authResponse, isAuthenticated, setAuthResponse, logout } = useAuth();

  // --- Guest Auto-Login ---
  useEffect(() => {
    const performGuestLogin = async () => {
      const path = location.pathname.replace('/', '');

      if (isAuthenticated || location.pathname.startsWith('/auth')) return;

      try {
        await HttpReq<AuthSuccessResponse>(
          urls.login,
          (data) => {
            if (!('idToken' in data)) return;

            setAuthResponse(data);
            localStorage.setItem('auth', JSON.stringify(data));

            if (path) navigate('/');
          },
          () => {},
          () => {},
          () => {},
          (err) => console.error('Guest login failed:', err),
          'post',
          {
            email: 'guest@slocator.com',
            password: 'guest',
            source,
          }
        );
      } catch (error) {
        console.error('Guest auto-login error:', error);
      }
    };

    performGuestLogin();
  }, [location.pathname, isAuthenticated, navigate, setAuthResponse, source]);

  // --- Token Expiration Handling for Guest: silent re-login ---
  useEffect(() => {
    if (!authResponse) return;

    const isGuest =
      authResponse.email === 'guest' ||
      authResponse.localId?.startsWith('guest_') ||
      authResponse.registered === false;

    if (!isGuest) return;

    const reLoginGuest = async () => {
      try {
        await HttpReq<AuthSuccessResponse>(
          urls.login,
          (data) => {
            if (!('idToken' in data)) return;
            setAuthResponse(data);
            localStorage.setItem('auth', JSON.stringify(data));
          },
          () => {},
          () => {},
          () => {},
          (err) => console.error('Guest re-login failed:', err),
          'post',
          {
            email: 'guest@slocator.com',
            password: 'guest',
            source,
          }
        );
      } catch (error) {
        console.error('Guest re-login error:', error);
        logout();
      }
    };

    const expiresAt = authResponse.expiresAt
      ? new Date(authResponse.expiresAt)
      : null;

    if (expiresAt) {
      const now = new Date();
      if (now >= expiresAt) {
        reLoginGuest();
      } else {
        const timeout = expiresAt.getTime() - now.getTime();
        const timer = setTimeout(() => reLoginGuest(), timeout);
        return () => clearTimeout(timer);
      }
    }
  }, [authResponse, logout, setAuthResponse, source]);

  return (
    <>
      <GuestBanner /> {/* reusable banner */}
      {children}
    </>
  );
}
