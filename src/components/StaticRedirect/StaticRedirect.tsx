import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const StaticRedirect = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  const filePath = params['*'];
  const staticFileUrl = `http://37.27.195.216:8000/static/${filePath}`;

  useEffect(() => {
    if (isAuthenticated) {
      window.location.replace(staticFileUrl);
    } else {
      const redirectUrl = encodeURIComponent(staticFileUrl);
      navigate(`/auth?redirect_url=${redirectUrl}`);
    }
  }, [isAuthenticated, navigate, staticFileUrl]);

  return <div>Loading...</div>;
};

export default StaticRedirect;
