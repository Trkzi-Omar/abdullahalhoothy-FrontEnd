import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, isGuestUser } from '../../context/AuthContext';

export default function GuestBanner() {
  const navigate = useNavigate();
  const { authResponse } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!authResponse) return null;

  const isGuest = isGuestUser(authResponse);

  if (!isGuest || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-yellow-200 border-b border-yellow-400 text-black text-center px-4 py-3 z-50">
      <span>
        You are logged in as a guest user.{' '}
        <button
          className="underline font-semibold"
          onClick={() => navigate('/sign-up')}
        >
          Sign Up
        </button>{' '}
        or{' '}
        <button
          className="underline font-semibold"
          onClick={() => navigate('/auth')}
        >
          Sign In
        </button>{' '}
        to access full features.
      </span>
      <button
        className="absolute right-2 top-2 text-black font-bold"
        onClick={() => setDismissed(true)}
      >
        ✕
      </button>
    </div>
  );
}
