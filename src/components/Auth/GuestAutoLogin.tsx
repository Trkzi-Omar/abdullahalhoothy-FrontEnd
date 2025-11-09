import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HttpReq } from '../../services/apiService';
import urls from '../../urls.json';
import { AuthResponse } from '../../types/allTypesAndInterfaces';
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
        await HttpReq(
          urls.login,
          (data: any) => {
            if (!('idToken' in data)) return;

            setAuthResponse(data as AuthResponse);
            localStorage.setItem('auth', JSON.stringify(data));

            if (path) navigate('/');
          },
          () => {},
          () => {},
          () => {},
          (err: any) => console.error('Guest login failed:', err),
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
  }, [location.pathname]);

  // --- Token Expiration Handling for Guest ---
  useEffect(() => {
    if (!authResponse) return;

    const isGuest =
      authResponse.email === 'guest' ||
      authResponse.localId?.startsWith('guest_') ||
      authResponse.registered === false;

    if (!isGuest) return;

    const expiresAt = authResponse.expiresAt
      ? new Date(authResponse.expiresAt)
      : null;

    if (expiresAt) {
      const now = new Date();
      if (now >= expiresAt) {
        logout();
      } else {
        const timeout = expiresAt.getTime() - now.getTime();
        const timer = setTimeout(() => logout(), timeout);
        return () => clearTimeout(timer);
      }
    }
  }, [authResponse]);

  return (
    <>
      <GuestBanner /> {/* reusable banner */}
      {children}
    </>
  );
}
