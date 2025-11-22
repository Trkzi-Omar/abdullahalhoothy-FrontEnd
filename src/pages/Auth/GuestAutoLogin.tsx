import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isGuestUser } from '../../context/AuthContext';
import Banner from '../../components/Banner/Banner';
import { usePreserveQueryNavigate } from '../../hooks/usePreserveQueryNavigate';

const GuestAutoLogin = () => {
  const { authResponse, logout } = useAuth();
  const nav = useNavigate();
  const [bannerVisible, setBannerVisible] = useState(true);
  const navigate = usePreserveQueryNavigate();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source');

  if (!authResponse) return null;

  const isGuest = isGuestUser(authResponse);

  if (!isGuest || !bannerVisible) return null;

  function handleSigninClick() {
    logout();
    navigate('/auth');
  }

  return (
    <Banner
      visible={bannerVisible}
      type="info"
      message={
        <>
          You are logged in as a guest user. Please{' '}
          <button className="underline font-semibold" onClick={() => nav(`/sign-up/${source}`)}>
            sign up
          </button>{' '}
          or{' '}
          <button className="underline font-semibold" onClick={handleSigninClick}>
            sign in
          </button>{' '}
          to access full features.
        </>
      }
      onClose={() => setBannerVisible(false)}
      className="rounded-md "
    />
  );
};

export default GuestAutoLogin;
