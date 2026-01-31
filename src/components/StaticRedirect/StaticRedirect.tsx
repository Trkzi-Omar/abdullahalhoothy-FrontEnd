import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import urls from '../../urls.json';

const StaticRedirect = () => {
  const params = useParams();
  const [backendUrl, setBackendUrl] = useState<string>('');

  const filePath = params['*'];

  useEffect(() => {
    // Determine the backend URL based on the API URL configuration
    const apiUrl = urls.REACT_APP_API_URL;
    let backendHost: string;

    try {
      // Extract base URL from API URL (remove /fastapi suffix if present)
      const baseUrl = apiUrl.replace('/fastapi', '');
      const urlObj = new URL(baseUrl);
      backendHost = `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      // Fallback: Use current protocol and hostname with backend port
      backendHost = `${window.location.protocol}//${window.location.hostname}:8000`;
    }

    // Ensure filePath doesn't already include /static/
    const cleanPath = filePath?.startsWith('static/')
      ? filePath
      : `static/${filePath || ''}`;

    const fullUrl = `${backendHost}/${cleanPath}`;
        setBackendUrl(fullUrl);
  }, [filePath]);

  if (!backendUrl) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <iframe
        src={backendUrl}
        className="w-full h-full border-none"
        title="Static Content"
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
};

export default StaticRedirect;
