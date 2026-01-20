import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth, performGoogleLogin, isGuestUser } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import MarketingContent from '../../components/Auth/MarketingContent';
import LoginForm from '../../components/Auth/LoginForm';
import RegisterForm from '../../components/Auth/RegisterForm';
import ResetPasswordForm from '../../components/Auth/ResetPasswordForm';

type AuthMode = 'login' | 'register' | 'reset';

const Auth = () => {
  const nav = useNavigate();
  const location = useLocation();
  const { authLoading, isAuthenticated, setAuthResponse, authResponse, sourceLocal } = useAuth();
  const [searchParams] = useSearchParams();
  const modeQuery = searchParams.get('mode');

  const getInitialMode = (): AuthMode => {
    if (modeQuery === 'register' || modeQuery === 'reset') return modeQuery;
    return 'login';
  };

  const [mode, setMode] = useState<AuthMode>(getInitialMode);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Redirect if already authenticated (non-guest users go to home)
  useEffect(() => {
    if (!authLoading && isAuthenticated && authResponse && !isGuestUser(authResponse)) {
      nav('/');
    }
  }, [authLoading, isAuthenticated, authResponse, nav]);

  const handleRedirect = () => {
    const params = new URLSearchParams(location.search);
    const redirectUrl = params.get('redirect_url');
    setTimeout(() => {
      redirectUrl ? window.location.replace(redirectUrl) : nav('/');
    }, 100);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleError(null);
      try {
        await performGoogleLogin(setAuthResponse, tokenResponse.access_token, sourceLocal);
        handleRedirect();
      } catch (e: any) {
        setGoogleError(e.response?.data?.detail || e.message || 'Google login failed');
      }
    },
    onError: () => {
      setGoogleError('Google login failed');
    },
  });

  const switchMode = (newMode: AuthMode) => {
    setGoogleError(null);
    setMode(newMode);
  };

  const getTitle = () => {
    if (mode === 'reset') return 'Reset Password';
    if (mode === 'login') return 'Log in';
    return 'Sign up';
  };

  const getSubtitle = () => {
    if (mode === 'register') {
      return 'Get started for free. No credit card required.';
    }
    return null;
  };

  const showGoogleLogin = mode !== 'reset';

  const renderGoogleLogin = () => {
    if (!showGoogleLogin) return null;

    return (
      <>
        {googleError && <p className="mb-4 text-center text-red-500">{googleError}</p>}
        <button
          type="button"
          onClick={() => googleLogin()}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors duration-200"
        >
          <FcGoogle className="text-xl" />
          <span className="text-gray-700 font-medium">Google</span>
        </button>
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-300" />
          <span className="px-3 text-gray-500 text-sm">Or with email and password</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>
      </>
    );
  };

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm
            onSuccess={handleRedirect}
            onForgotPassword={() => switchMode('reset')}
          />
        );
      case 'register':
        return (
          <RegisterForm
            onSuccess={handleRedirect}
            source={sourceLocal}
          />
        );
      case 'reset':
        return (
          <ResetPasswordForm
            onSuccess={() => switchMode('login')}
            onBackToLogin={() => switchMode('login')}
          />
        );
    }
  };

  // Login and Reset: Centered layout
  if (mode === 'login' || mode === 'reset') {
    return (
      <div className="w-full h-screen overflow-hidden flex flex-col bg-primary">
        <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#006400] mb-6 text-center">
              {getTitle()}
            </h2>

            {renderGoogleLogin()}
            {renderForm()}

            {mode === 'login' && (
              <div className="text-center mt-4 text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('register')}
                  className="text-[#006400] hover:underline"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Register: Split layout with marketing content
  return (
    <div className="w-full h-screen overflow-hidden flex flex-col lg:flex-row">
      {/* Left side - Marketing Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary overflow-hidden">
        <MarketingContent />
      </div>

      {/* Right side - Sign up form */}
      <div className="flex-1 flex items-center justify-center bg-white p-4 lg:p-8 min-h-0 overflow-hidden">
        <div className="w-full max-w-md">
          {/* Mobile-only headline */}
          <h1 className="lg:hidden text-2xl font-bold text-primary mb-6 text-center">
            Get started with <span className="whitespace-nowrap">S-Locator</span>
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#006400] mb-2 text-center">
            {getTitle()}
          </h2>
          {getSubtitle() && (
            <p className="text-gray-500 text-center mb-6">{getSubtitle()}</p>
          )}

          {renderGoogleLogin()}
          {renderForm()}

          <div className="text-center mt-6 text-gray-600 text-sm">
            Already using S-Locator?{' '}
            <button
              onClick={() => switchMode('login')}
              className="text-[#006400] hover:underline"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
