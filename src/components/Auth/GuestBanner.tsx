import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isGuestUser, useAuth } from '../../context/AuthContext';

const GUEST_TOAST_ID = 'guest-banner';
const KNOWN_ROUTES = [
  'auth',
  'sign-up',
  'profile',
  'organization',
  'billing',
  'campaign',
  'plans',
  'landing',
  'marketing-dashboard',
  'custom-report',
  'static',
  'tabularView',
];

export default function GuestBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authResponse, sourceLocal } = useAuth();
  const isGuest = isGuestUser(authResponse);

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isHomePage =
    location.pathname === '/' ||
    (pathSegments.length === 1 && !KNOWN_ROUTES.includes(pathSegments[0]));

  useEffect(() => {
    const shouldShowToast = Boolean(authResponse) && isGuest && isHomePage;

    if (!shouldShowToast) {
      toast.dismiss(GUEST_TOAST_ID);
      return;
    }

    toast.custom(
      toastId => (
        <div className="w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-sky-200 bg-white px-4 py-4 shadow-2xl sm:px-5">
          <div className="relative min-w-0 pr-8">
            <div>
              <p className="text-lg font-semibold leading-7 text-slate-900">
                You are logged in as a guest user.
              </p>
              <p className="mt-1 text-base leading-7 text-slate-700">
                Sign up or sign in to access full features.
              </p>

              <div className="mt-4 flex flex-row flex-wrap gap-2">
                <button
                  className="rounded-md bg-[#155315] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a651a]"
                  onClick={() => {
                    toast.dismiss(toastId);
                    navigate(sourceLocal ? `/sign-up/${sourceLocal}` : '/sign-up');
                  }}
                  type="button"
                >
                  Sign up
                </button>

                <button
                  className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
                  onClick={() => {
                    toast.dismiss(toastId);
                    navigate('/auth');
                  }}
                  type="button"
                >
                  Sign in
                </button>
              </div>
            </div>

            <button
              aria-label="Dismiss guest notice"
              className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              onClick={() => toast.dismiss(toastId)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                />
              </svg>
            </button>
          </div>
        </div>
      ),
      {
        id: GUEST_TOAST_ID,
        duration: Infinity,
        style: {
          right: '2rem',
        },
      }
    );
  }, [authResponse, isGuest, isHomePage, navigate, sourceLocal]);

  useEffect(() => {
    return () => {
      toast.dismiss(GUEST_TOAST_ID);
    };
  }, []);

  return null;
}
