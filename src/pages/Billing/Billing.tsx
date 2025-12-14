import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useUIContext } from '../../context/UIContext';
import BottomDrawer from '../../components/BottomDrawer/BottomDrawer';
import { useBillingContext } from '../../context/BillingContext';
import { processCityData } from '../../utils/helperFunctions';
import { City } from '../../types/allTypesAndInterfaces';
import urls from '../../urls.json';
import apiRequest from '../../services/apiRequest';

const Billing = () => {
  const { isMobile, setIsDrawerOpen } = useUIContext();
  const { isAuthenticated, authLoading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) nav('/auth');
  }, [authLoading, isAuthenticated, nav]);

  return (
    <>
      {isMobile ? (
        <>
          <BillingDrawer />
          <button
            className="bg-white border p-2.5 fixed w-full bottom-0 left-0 right-0 z-[5] flex items-center gap-2 text-gray-400 font-normal"
            onClick={() => setIsDrawerOpen(true)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
            >
              <path
                d="M18 15L12 9L6 15"
                stroke-width="1.5"
                stroke-miterlimit="16"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Tap to see more options
          </button>
        </>
      ) : (
        <div className="h-full w-96 bg-[#115740] px-1 py-1">
          <div className="w-full h-full bg-white rounded">
            <BillingContent />
          </div>
        </div>
      )}
    </>
  );
};

function BillingContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkout, dispatch } = useBillingContext();
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesData, setCitiesData] = useState<{ [country: string]: City[] }>({});
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'area-intelligence', label: 'Area Intelligence', path: '/billing' },
    { id: 'datasets', label: 'Datasets', path: '/billing/datasets' },
    { id: 'reports', label: 'Reports', path: '/billing/reports' },
  ];

  const getActiveTab = () => {
    if (location.pathname === '/billing' || location.pathname === '/billing/') {
      return 'area-intelligence';
    }
    return tabs.find(tab => location.pathname === tab.path)?.id || 'area-intelligence';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  // Fetch countries and cities on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await apiRequest({ url: urls.country_city, method: 'get' });
        setCountries(processCityData(res.data.data, setCitiesData));
        setError(null);
      } catch (error) {
        setError(
          `Error fetching countries and cities: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };
    fetchInitialData();
  }, []);

  // Update cities when country changes
  useEffect(() => {
    if (checkout.country_name && citiesData[checkout.country_name]) {
      setCities(citiesData[checkout.country_name]);
    } else {
      setCities([]);
    }
  }, [checkout.country_name, citiesData]);

  const handleCountryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch({ type: 'setCountry', payload: e.target.value });
    },
    [dispatch]
  );

  const handleCityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch({ type: 'setCity', payload: e.target.value });
    },
    [dispatch]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="text-2xl pl-6 pt-4 font-semibold mb-4">Acquire</div>

      <div className="flex flex-col justify-center items-center gap-3">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={`border rounded-lg shadow-md hover:shadow-lg transition-all h-14 flex items-center justify-center w-[80%] ${
                isActive
                  ? 'bg-gem-gradient text-gray-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-[20vh] px-6 pb-4 pt-6 border-t lg:mt-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="country-select" className="block mb-2 text-md font-medium text-black">
            Country:
          </label>
          <select
            id="country-select"
            value={checkout.country_name}
            onChange={handleCountryChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="" disabled>
              Select a country
            </option>
            {countries.map(country => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city-select" className="block mb-2 text-md font-medium text-black">
            City:
          </label>
          <select
            id="city-select"
            value={checkout.city_name}
            onChange={handleCityChange}
            disabled={!checkout.country_name}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="" disabled>
              Select a city
            </option>
            {cities.map(city => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function BillingDrawer() {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const { isDrawerOpen, setIsDrawerOpen } = useUIContext();

  useEffect(() => {
    const drawerContent = contentRef.current;

    if (drawerContent) {
      // Remove potential focus-trap attributes
      drawerContent.removeAttribute('aria-hidden');
      drawerContent.removeAttribute('tabIndex');
    }
  }, []);

  return (
    <>
      <BottomDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        modal={false}
        defaultSnap={0.375}
        snapPoints={[0, 0.375, 1]}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <BillingContent />
        </div>
      </BottomDrawer>
    </>
  );
}
export default Billing;
