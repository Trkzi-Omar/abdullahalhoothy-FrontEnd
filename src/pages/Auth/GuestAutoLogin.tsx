import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isGuestUser } from '../../context/AuthContext';
import Banner from '../../components/Banner/Banner';

const GuestAutoLogin = () => {
  const { authResponse } = useAuth();
  const nav = useNavigate();
  const [bannerVisible, setBannerVisible] = useState(true);

  if (!authResponse) return null;

  const isGuest = isGuestUser(authResponse);

  if (!isGuest || !bannerVisible) return null;

  return (
    <Banner
      visible={bannerVisible}
      type="info"
      message={
        <>
          You are logged in as a guest user. Please{' '}
          <button className="underline font-semibold" onClick={() => nav('/sign-up')}>
            sign up
          </button>{' '}
          or{' '}
          <button className="underline font-semibold" onClick={() => nav('/auth')}>
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
