import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isGuestUser } from '../../context/AuthContext';
import Banner from '../../components/Banner/Banner';
import { t } from '../../i18n';


const GuestAutoLogin = () => {
  const { authResponse } = useAuth();
  const [bannerVisible, setBannerVisible] = useState(true);
  const navigate = useNavigate();

  if (!authResponse) return null;

  const isGuest = isGuestUser(authResponse);

  if (!isGuest || !bannerVisible) return null;

  function handleSigninClick() {
    navigate('/auth');
  }
  function handleSignupClick() {
    const source = localStorage.getItem('source') || '';
    navigate(`/sign-up/${source}`);
  }

  return (
    <Banner
      visible={bannerVisible}
      type="info"
      message={
        <>{t("you-are-logged-in-as-a-guest-user-please")}{' '}
          <button className="underline font-semibold" onClick={handleSignupClick}>{t("sign-up-2")}</button>{' '}{t("or")}{' '}
          <button className="underline font-semibold" onClick={handleSigninClick}>{t("sign-in-2")}</button>{' '}{t("to-access-full-features")}</>
      }
      onClose={() => setBannerVisible(false)}
      className="rounded-md "
    />
  );
};

export default GuestAutoLogin;
