import { useEffect, useState } from 'react';
import { t } from '../../i18n';


export default function MarketingDashboard() {
  const [dashboardHtml, setDashboardHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/fastapi/marketing-dashboard');
        if (!response.ok) {
          throw new Error(t("failed-to-fetch-dashboard"));
        }
        const html = await response.text();
        setDashboardHtml(html);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("unknown-error"));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t("loading-marketing-dashboard")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{t("error-loading-dashboard")}{' '}{error}</div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen"
      dangerouslySetInnerHTML={{ __html: dashboardHtml }}
    />
  );
}
