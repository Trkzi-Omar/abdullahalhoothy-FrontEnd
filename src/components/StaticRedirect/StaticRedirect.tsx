import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const StaticRedirect = () => {
  const params = useParams();
  const [backendUrl, setBackendUrl] = useState<string>('');

  const filePath = params['*'];

  useEffect(() => {
    // Determine the backend URL based on the current hostname
    const currentHost = window.location.hostname;
    let backendHost: string;

    if (currentHost === 'localhost') {
      backendHost = 'http://37.27.195.216:8000';
    } else if (currentHost === '37.27.195.216') {
      backendHost = 'http://37.27.195.216:8000';
    } else if (currentHost === 's-locator.northernacs.com') {
      backendHost = 'http://s-locator.northernacs.com:8000';
    } else {
      // Fallback to localhost
      backendHost = 'http://37.27.195.216:8000';
    }

    const fullUrl = `${backendHost}/static/${filePath}`;
    setBackendUrl(fullUrl);
  }, [filePath]);

  if (!backendUrl) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full h-full">
      <iframe
        src={backendUrl}
        className="w-full h-full border-none"
        title="Static Content"
      />
    </div>
  );
};

export default StaticRedirect;
