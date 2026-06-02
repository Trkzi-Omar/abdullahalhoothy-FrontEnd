import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import urls from '../../urls.json';
import apiRequest from '../../services/apiRequest';
import { t } from '../../i18n';


export default function Wallet() {
  const { authResponse } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(0.0);

  // Check for success query parameter
  const getWallet = useCallback(async () => {
    if (!authResponse?.localId) return;
    const res = await apiRequest({
      url: urls.fetch_wallet + `?user_id=${authResponse.localId}`,
      method: 'get',
      isAuthRequest: true,
    });
    setBalance(res.data.data.balance.toFixed(2));
  }, [authResponse?.localId]);
  useEffect(() => {
    getWallet();
  }, [getWallet]);

  useEffect(() => {
    setIsLoading(false);
  }, [authResponse]);

  if (isLoading)
    return (
      <div className="text-lg text-primary text-center mt-14 font-semibold">
        <h1>{t("loading-wallet-details")}</h1>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8 font-sans">
      <h2 className="text-xl font-semibold mb-6">{t("credits")}</h2>
      <div className="rounded-md shadow-sm border p-4 sm:p-5">
        <h3 className="font-semibold mb-2">{t("summary")}</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-600">{t("total-amount-remaining")}</p>
            <p className="text-sm text-gray-600">${balance}</p>
          </div>
          <div className="hidden sm:block w-px h-10 bg-gray-300" />
          <Link
            to="/profile/wallet/add"
            className="flex w-full sm:w-auto"
          >
            <button className="h-11 w-full sm:w-auto px-6 py-2 bg-[#115740] text-white font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer">
              {t("add-funds")}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
