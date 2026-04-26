import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdHome } from 'react-icons/md';
import urls from '../../urls.json';
import { t } from '../../i18n';


const StaticRedirect = () => {
  const params = useParams();
  const navigate = useNavigate();
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
          <p className="text-gray-600">{t("loading-report")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <iframe
        src={backendUrl}
        className="w-full h-full border-none"
        title={t("static-content")}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <button
        onClick={() => navigate('/')}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-[#115740] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#0d4532] transition-colors"
      >
        <MdHome size={20} />
        <span className="text-sm font-medium">{t("home")}</span>
      </button>
    </div>
  );
};

export default StaticRedirect;
