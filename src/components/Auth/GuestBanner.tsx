import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, isGuestUser } from '../../context/AuthContext';

export default function GuestBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authResponse, sourceLocal } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Don't show banner on landing page
  if (location.pathname === '/landing') return null;

  if (!authResponse) return null;

  const isGuest = isGuestUser(authResponse);

  if (!isGuest || dismissed) return null;

  function handleSignupClick() {
    navigate(`/sign-up/${sourceLocal}`);
  }

  return (
    <div className=' fixed top-0 left-0 z-10'>
<div className="fixed top-[5vh] sm:top-[2vh] left-1/2 transform -translate-x-1/2 bg-[#E0F2FE] text-[#0369A1] py-3 px-4 sm:px-6 flex justify-between items-center  shadow-lg rounded-md w-[90%] sm:w-[85%] lg:w-full max-w-[90ch]">
      <div className="flex-1 text-center pr-2">
        <span className="text-sm sm:text-base">
          You are logged in as a guest user.{' '}
          <button className="underline font-semibold" onClick={handleSignupClick}>
            sign up
          </button>{' '}
          or{' '}
          <button className="underline font-semibold" onClick={() => navigate('/auth')}>
            sign in
          </button>{' '}
          to access full features.
        </span>
      </div>
      <button
        className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex-shrink-0"
        onClick={() => setDismissed(true)}
        aria-label="Close banner"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L4 12M4 4L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
    </div>
  );
}
