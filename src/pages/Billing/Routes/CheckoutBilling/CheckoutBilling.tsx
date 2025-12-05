import React, { useEffect, useMemo, useCallback } from 'react';
import { formatSubcategoryName } from '../../../../utils/helperFunctions';
import urls from '../../../../urls.json';
import { FaCaretDown, FaCaretRight } from 'react-icons/fa';
import { useAuth } from '../../../../context/AuthContext';
import apiRequest from '../../../../services/apiRequest';
import { MdAttachMoney, MdCheckCircle, MdCheckCircleOutline, MdErrorOutline, MdClose } from 'react-icons/md';
import { CategoryData } from '../../../../types/allTypesAndInterfaces';
import { useUIContext } from '../../../../context/UIContext';
import { useBillingContext, type ReportTier } from '../../../../context/BillingContext';

const REPORT_TIERS = [
  { 
    id: 'report-premium-tier', 
    name: 'Premium Tier', 
    price: 1999, 
    reportKey: 'premium' as ReportTier, 
    perks: ['Custom Scoring', '4x Report Refreshes', 'Full Data Access'],
    intelligences: {
      ai: true,
      income: true,
      population: true,
      realEstate: true,
      competition: true,
      poi: true
    },
    isMostPopular: true,
    conciergeService: 'Personal consultant to guide your business expansion.'
  },
  { 
    id: 'report-standard-tier', 
    name: 'Standard Tier', 
    price: 1849, 
    reportKey: 'standard' as ReportTier, 
    perks: ['Custom Scoring', '4x Report Refreshes', 'Full Data Access'],
    intelligences: {
      ai: false,
      income: false,
      population: true,
      realEstate: true,
      competition: true,
      poi: true
    },
    isMostPopular: false
  },
  { 
    id: 'report-basic-tier', 
    name: 'Basic Tier', 
    price: 1559, 
    reportKey: 'basic' as ReportTier, 
    perks: ['Preset Scoring', '1x Report', 'Full Data Access'],
    intelligences: {
      ai: false,
      income: false,
      population: true,
      realEstate: true,
      competition: true,
      poi: true
    },
    isMostPopular: false
  },
];

function CheckoutBilling({ Name }: { Name: string }) {
  const [categories, setCategories] = React.useState<CategoryData>({});
  const [openedCategories, setOpenedCategories] = React.useState<string[]>([]);
  const [isCalculatingCost, setIsCalculatingCost] = React.useState(false);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [cartCostResponse, setCartCostResponse] = React.useState<{
    data?: {
      total_cost?: number;
      intelligence_purchase_items?: Array<{
        user_id: string;
        city_name: string;
        country_name: string;
        cost: number;
        expiration: string | null;
        explanation: string;
        is_currently_owned: boolean;
        free_as_part_of_package: boolean | null;
        intelligence_name: string;
      }>;
      dataset_purchase_items?: Array<{
        user_id: string;
        city_name: string;
        country_name: string;
        cost: number;
        expiration: string | null;
        explanation: string;
        is_currently_owned: boolean;
        free_as_part_of_package: boolean | null;
        dataset_name: string;
        api_calls?: number;
      }>;
      report_purchase_items?: Array<{
        user_id: string;
        city_name: string;
        country_name: string;
        cost: number;
        expiration: string | null;
        explanation: string;
        is_currently_owned: boolean;
        free_as_part_of_package: boolean | null;
        report_name: string;
      }>;
    };
  } | null>(null);

  const { authResponse } = useAuth();
  const { openModal } = useUIContext();
  const { checkout, dispatch } = useBillingContext();

  // Fetch categories on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await apiRequest({ url: urls.nearby_categories, method: 'get' });
        setCategories(res.data.data);
      } catch {
        // Silently handle error
      }
    };
    fetchInitialData();
  }, []);

  const formatPrice = useCallback((value: number) =>
    `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, []);

  const handleDatasetToggle = useCallback((type: string) => {
    if (!checkout.country_name || !checkout.city_name) {
      openModal(
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <MdErrorOutline className="text-orange-500 text-6xl mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Location Required</h2>
          <p className="text-gray-600">Please select a country and city before adding datasets.</p>
        </div>,
        {
          darkBackground: true,
          isSmaller: true,
          hasAutoSize: true,
        }
      );
      return;
    }
    dispatch({ type: 'toggleDataset', payload: type });
  }, [dispatch, checkout.country_name, checkout.city_name, openModal]);

  const handleIntelligenceToggle = useCallback((service: 'population' | 'income') => {
    const formatted = service === 'population' ? 'Population' : 'Income';
    dispatch({ type: 'toggleIntelligence', payload: formatted });
  }, [dispatch]);

  const handleReportToggle = useCallback((reportKey: ReportTier) => {
    if (checkout.report === reportKey) {
      dispatch({ type: 'setReport', payload: '' });
    } else {
      dispatch({ type: 'setReport', payload: reportKey });
    }
  }, [checkout.report, dispatch]);

  // Calculate cart cost
  const calculateCartCost = useCallback(async () => {
    if (!authResponse?.localId) {
      return;
    }
    
    // Don't calculate if there are no items in cart
    if (checkout.datasets.length === 0 && checkout.intelligences.length === 0 && checkout.report === '') {
      setCartCostResponse(null);
      return;
    }
    
    setIsCalculatingCost(true);

    try {
      const requestBody: {
        user_id: string;
        country_name: string;
        city_name: string;
        datasets: string[];
        intelligences: string[];
        displayed_price: number;
        report?: ReportTier;
      } = {
        user_id: authResponse.localId,
        country_name: checkout.country_name || '',
        city_name: checkout.city_name || '',
        datasets: checkout.datasets,
        intelligences: checkout.intelligences,
        displayed_price: 0,
      };

      // Only include report if it's not empty
      if (checkout.report) {
        requestBody.report = checkout.report;
      }

      const response = await apiRequest({
        url: urls.calculate_cart_cost,
        method: 'POST',
        body: requestBody,
        isAuthRequest: true,
      });
      setCartCostResponse(response.data);
    } catch {
      setCartCostResponse(null);
    } finally {
      setIsCalculatingCost(false);
    }
  }, [authResponse?.localId, checkout]);

  // Handle purchase
  const handlePurchase = useCallback(async () => {
    if (!authResponse?.localId) {
      return;
    }
    
    // Don't purchase if there are no items in cart
    if (checkout.datasets.length === 0 && checkout.intelligences.length === 0 && checkout.report === '') {
      return;
    }
    
    setIsPurchasing(true);

    try {
      const requestBody: {
        user_id: string;
        country_name: string;
        city_name: string;
        datasets: string[];
        intelligences: string[];
        displayed_price: number;
        report?: ReportTier;
      } = {
        user_id: authResponse.localId,
        country_name: checkout.country_name || '',
        city_name: checkout.city_name || '',
        datasets: checkout.datasets,
        intelligences: checkout.intelligences,
        displayed_price: cartCostResponse?.data?.total_cost || 0,
      };

      // Only include report if it's not empty
      if (checkout.report) {
        requestBody.report = checkout.report;
      }
      const response = await apiRequest({
        url: urls.purchase_items,
        method: 'POST',
        body: requestBody,
        isAuthRequest: true,
      });
      
      // Extract message from API response
      const successMessage = response?.data?.message || 'Your purchase has been completed successfully.';
      
      // Purchase successful - show success modal with API message
      openModal(
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <MdCheckCircleOutline className="text-green-500 text-6xl mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600">{successMessage}</p>
        </div>,
        {
          darkBackground: true,
          isSmaller: true,
          hasAutoSize: true,
        }
      );
      
      // Reset the checkout state
      dispatch({ type: 'reset' });
      setCartCostResponse(null);
    } catch (error) {
      console.error('Purchase failed:', error);
      
      // Extract error message from API response
      let errorMessage = 'An error occurred while processing your purchase.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string; detail?: string; error?: string } | string } };
        const errorData = apiError.response?.data;
        
        if (errorData && typeof errorData === 'object') {
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error instanceof Error) {
        // Remove status code from error message if present
        errorMessage = error.message.replace(/\s*\(Status:\s*\d+\)/g, '');
      }
      
      // Show error modal with API message
      openModal(
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <MdErrorOutline className="text-red-500 text-6xl mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-600">{errorMessage}</p>
        </div>,
        {
          darkBackground: true,
          isSmaller: true,
          hasAutoSize: true,
        }
      );
    } finally {
      setIsPurchasing(false);
    }
  }, [authResponse?.localId, checkout, cartCostResponse, openModal, dispatch]);

  const canCalculateCost = useMemo(() => (
    (checkout.datasets.length > 0 || checkout.intelligences.length > 0 || checkout.report !== '')
  ), [checkout]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    return Object.entries(categories).reduce((acc, [category, types]) => {
      const filteredTypes = (types as string[]).filter(type =>
        type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredTypes.length > 0) {
        acc[category] = filteredTypes;
      }
      return acc;
    }, {} as CategoryData);
  }, [categories, searchQuery]);

  // Handle clear all datasets
  const handleClear = useCallback(() => {
    dispatch({ type: 'clearDatasets' });
    setSearchQuery('');
  }, [dispatch]);

  // Automatically calculate cart cost when checkout state changes
  useEffect(() => {
    if (canCalculateCost && authResponse?.localId) {
      // Use a small delay to debounce rapid changes
      const timeoutId = setTimeout(() => {
        calculateCartCost();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Reset cart cost response when conditions are not met
      setCartCostResponse(null);
    }
  }, [checkout.datasets, checkout.intelligences, checkout.report, checkout.country_name, checkout.city_name, canCalculateCost, authResponse?.localId, calculateCartCost]);

  const getAreaCardClasses = useCallback((isSelected: boolean) =>
    `border rounded-lg transition-all flex items-center justify-between w-[80%] px-4 py-3 cursor-pointer ${isSelected
      ? 'border-green-600 bg-green-50 text-green-800 shadow-lg ring-2 ring-green-200'
      : 'border-gray-300 bg-white text-gray-700 shadow-md hover:shadow-lg hover:border-[#115740] hover:bg-gray-50'
    }`, []);

  // ... Render JSX updated to use 'checkout' state and dispatch actions ...
  return (
    <div className="h-full overflow-hidden relative flex">
      <div className="w-1/3 flex flex-col justify-between items-center overflow-y-auto">
        {Name === 'area' ? (
          <div className="w-full pl-4 pr-2 px-24">
            <div className="text-2xl pl-6 pt-4 font-semibold mb-4">Area Intelligence</div>
            <div className="flex flex-col items-center space-y-6">
              <div
                className={getAreaCardClasses(checkout.intelligences.includes('Population'))}
                role="button"
                tabIndex={0}
                onClick={() => handleIntelligenceToggle('population')}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleIntelligenceToggle('population');
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  {/* SVG Icon omitted here for brevity */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    className="min-w-5"
                  >
                    <g>
                      <path
                        d="M18 7.16C17.94 7.15 17.87 7.15 17.81 7.16C16.43 7.11 15.33 5.98 15.33 4.58C15.33 3.15 16.48 2 17.91 2C19.34 2 20.49 3.16 20.49 4.58C20.48 5.98 19.38 7.11 18 7.16Z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                      <path
                        d="M16.9699 14.44C18.3399 14.67 19.8499 14.43 20.9099 13.72C22.3199 12.78 22.3199 11.24 20.9099 10.3C19.8399 9.59004 18.3099 9.35003 16.9399 9.59003"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                      <path
                        d="M5.96998 7.16C6.02998 7.15 6.09998 7.15 6.15998 7.16C7.53998 7.11 8.63998 5.98 8.63998 4.58C8.63998 3.15 7.48998 2 6.05998 2C4.62998 2 3.47998 3.16 3.47998 4.58C3.48998 5.98 4.58998 7.11 5.96998 7.16Z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                      <path
                        d="M6.99994 14.44C5.62994 14.67 4.11994 14.43 3.05994 13.72C1.64994 12.78 1.64994 11.24 3.05994 10.3C4.12994 9.59004 5.65994 9.35003 7.02994 9.59003"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                      <path
                        d="M12 14.63C11.94 14.62 11.87 14.62 11.81 14.63C10.43 14.58 9.32996 13.45 9.32996 12.05C9.32996 10.62 10.48 9.46997 11.91 9.46997C13.34 9.46997 14.49 10.63 14.49 12.05C14.48 13.45 13.38 14.59 12 14.63Z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                      <path
                        d="M9.08997 17.78C7.67997 18.72 7.67997 20.26 9.08997 21.2C10.69 22.27 13.31 22.27 14.91 21.2C16.32 20.26 16.32 18.72 14.91 17.78C13.32 16.72 10.69 16.72 9.08997 17.78Z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                      />
                    </g>
                  </svg>
                  <div>
                    <div className="font-semibold">Population Intelligence</div>
                    <div className="text-xs text-gray-500">Enable smart population data</div>
                  </div>
                </div>
                {checkout.intelligences.includes('Population') ? (
                  <MdCheckCircle className="text-green-600" size={24} />
                ) : (
                  <span className="text-xs text-gray-400">Tap to add</span>
                )}
              </div>
              <div
                className={getAreaCardClasses(checkout.intelligences.includes('Income'))}
                role="button"
                tabIndex={0}
                onClick={() => handleIntelligenceToggle('income')}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleIntelligenceToggle('income');
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <MdAttachMoney size={24} />
                  <div>
                    <div className="font-semibold">Income Intelligence</div>
                    <div className="text-xs text-gray-500">Enable smart income data</div>
                  </div>
                </div>
                {checkout.intelligences.includes('Income') ? (
                  <MdCheckCircle className="text-green-600" size={24} />
                ) : (
                  <span className="text-xs text-gray-400">Tap to add</span>
                )}
              </div>
            </div>
          </div>
        ) : Name === 'reports' ? (
          <div className="w-full pl-4 pr-2 px-24">
            <div className="text-2xl pl-6 pt-4 font-semibold mb-6">Report</div>
            <div className="flex flex-row gap-6 flex-wrap">
              {REPORT_TIERS.map(tier => {
                const isSelected = checkout.report === tier.reportKey;
                return (
                  <details key={tier.id} className="relative border rounded-xl shadow-md hover:shadow-lg transition-all flex-1 min-w-[300px] max-w-[400px] bg-white overflow-hidden">
                    {tier.isMostPopular && (
                      <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-lg z-10">
                        Most Popular
                        <div className="absolute -right-2 top-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-green-500"></div>
                      </div>
                    )}
                    <summary className="cursor-pointer p-6 flex flex-col items-start font-semibold list-none [&::-webkit-details-marker]:hidden">
                      <div className="w-full flex justify-between items-start mb-4">
                        <span className="text-xl text-gray-900 font-bold">{tier.name}</span>
                        <span className="text-3xl font-bold text-green-700">{formatPrice(tier.price)}</span>
                      </div>
                    </summary>
                    <div className="p-6 pt-0 space-y-4">
                      <div className="mb-3">
                        <span className="bg-purple-100 text-purple-700 rounded-full px-4 py-2 font-medium text-sm inline-block">Top 10 Locations Ranked</span>
                      </div>
                      <ul className="mb-4 text-sm space-y-2">
                        {tier.perks.map(perk => (
                          <li key={perk} className="text-gray-700">• {perk}</li>
                        ))}
                      </ul>
                      <div className="mb-4">
                        <div className="text-sm font-semibold text-gray-900 mb-3">Intelligences Included:</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {tier.intelligences.ai ? (
                              <MdCheckCircle className="text-green-600" size={20} />
                            ) : (
                              <MdClose className="text-red-600" size={20} />
                            )}
                            <span className="text-sm text-gray-700">AI</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {tier.intelligences.income ? (
                              <MdCheckCircle className="text-green-600" size={20} />
                            ) : (
                              <MdClose className="text-red-600" size={20} />
                            )}
                            <span className="text-sm text-gray-700">Income</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {tier.intelligences.population ? (
                              <MdCheckCircle className="text-green-600" size={20} />
                            ) : (
                              <MdClose className="text-red-600" size={20} />
                            )}
                            <span className="text-sm text-gray-700">Population</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {tier.intelligences.realEstate ? (
                              <MdCheckCircle className="text-green-600" size={20} />
                            ) : (
                              <MdClose className="text-red-600" size={20} />
                            )}
                            <span className="text-sm text-gray-700">Real Estate</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {tier.intelligences.competition ? (
                              <MdCheckCircle className="text-green-600" size={20} />
                            ) : (
                              <MdClose className="text-red-600" size={20} />
                            )}
                            <span className="text-sm text-gray-700">Competition</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {tier.intelligences.poi ? (
                              <MdCheckCircle className="text-green-600" size={20} />
                            ) : (
                              <MdClose className="text-red-600" size={20} />
                            )}
                            <span className="text-sm text-gray-700">POI (Point of Interest)</span>
                          </div>
                          <div className="text-xs text-gray-500 ml-7 mt-1">
                            Includes up to 5 datasets. Additional datasets starting from $300.
                          </div>
                        </div>
                      </div>
                      {tier.conciergeService && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                          <div className="flex items-start gap-2">
                            <span className="text-purple-600 text-lg">★</span>
                            <span className="text-sm text-purple-900">
                              <span className="font-semibold">Concierge Service:</span> {tier.conciergeService}
                            </span>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleReportToggle(tier.reportKey);
                        }}
                        className={`w-full rounded-lg transition-all py-3 font-semibold ${isSelected
                          ? 'bg-red-50 border-2 border-red-500 text-red-600 hover:bg-red-100'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                      >
                        {isSelected ? 'Remove from checkout' : 'Buy'}
                      </button>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="w-full pl-4 pr-2 px-24">
              <div className="flex flex-col my-5 w-full">
                <div className="flex justify-between mb-4" >
                  <label className="font-bold">What are you looking for?</label>
                  <button
                    onClick={handleClear}
                    className="w-16 h-6 text-sm bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div className="pb-3">
                  <input
                    type="text"
                    id="searchInput"
                    name="searchInput"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Search for a type..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-5">
                  {Object.entries(filteredCategories).map(([category, types]) => (
                    <div key={category} className="flex-1 min-w-[200px]">
                      <button
                        className="font-semibold cursor-pointer flex justify-start items-center w-full hover:bg-gray-200 transition-all rounded"
                        onClick={() => {
                          if (openedCategories.includes(category)) {
                            setOpenedCategories(openedCategories.filter(x => x !== category));
                          } else {
                            setOpenedCategories([...openedCategories, category]);
                          }
                        }}
                      >
                        <span>{openedCategories.includes(category) ? <FaCaretDown /> : <FaCaretRight />}</span>{' '}
                        {formatSubcategoryName(category)}
                      </button>
                      <div className={`w-full basis-full overflow-hidden transition-all ${!openedCategories.includes(category) ? 'h-0' : ''}`}>
                        <div className="flex flex-wrap gap-3 mt-3">
                          {(types as string[]).map(type => {
                            const included = checkout.datasets.includes(type);
                            return (
                              <button
                                key={type}
                                type="button"
                                className={`p-2 rounded border transition-all ${included
                                  ? 'bg-green-600 text-white border-green-700'
                                  : 'bg-gray-100 border-gray-300'
                                }`}
                                onClick={e => {
                                  e.preventDefault();
                                  handleDatasetToggle(type);
                                }}
                              >
                                {formatSubcategoryName(type)}<span className="ml-2 font-bold">{included ? '✓' : '+'}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 w-full bg-white flex justify-center items-center space-x-4 border-t pt-2 lg:h-[10%]">
              {/* <button
                type="button"
                className={`w-48 lg:h-16 h-12 border-2 border-[#115740] text-[#115740] flex justify-center items-center font-semibold rounded-lg transition-all cursor-pointer ${isCalculatingCost || !canCalculateCost
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : 'bg-slate-100 hover:bg-white'
                  }`}
                disabled={isCalculatingCost || !canCalculateCost}
                onClick={calculateCartCost}
              >
                {isCalculatingCost ? 'Calculating...' : cartCostResponse?.data?.total_cost ? `Total: ${formatPrice(cartCostResponse.data.total_cost)}` : 'Calculate Cost'}
              </button> */}
            </div>
          </>
        )}
      </div>

      {/* Checkout summary panel... */}
      <div className="w-2/3 flex flex-col justify-center items-center border-l border-gray-200">
        <div className="max-w-3xl w-full p-8 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Checkout</h2>
              <span className="text-sm text-gray-500">
                {(() => {
                  const apiItemCount = (cartCostResponse?.data?.intelligence_purchase_items?.length ?? 0) +
                    (cartCostResponse?.data?.dataset_purchase_items?.length ?? 0) +
                    (cartCostResponse?.data?.report_purchase_items?.length ?? 0);
                  const checkoutItemCount = checkout.datasets.length + checkout.intelligences.length + (checkout.report ? 1 : 0);
                  const totalItems = apiItemCount > 0 ? apiItemCount : checkoutItemCount;
                  return `${totalItems} item${totalItems === 1 ? '' : 's'}`;
                })()}
              </span>
            </div>

            {/* Support Note */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mb-6">
              <p className="text-xs text-gray-500 leading-relaxed">
                Questions? We're happy to help — reach us at{' '}
                <a href="tel:+970595142078" className="text-[#115740] font-medium hover:underline">+970 (59) 514 - 207</a>
              </p>
            </div>

            {(() => {
              const hasApiItems = cartCostResponse?.data && (
                (cartCostResponse.data.intelligence_purchase_items?.length ?? 0) > 0 ||
                (cartCostResponse.data.dataset_purchase_items?.length ?? 0) > 0 ||
                (cartCostResponse.data.report_purchase_items?.length ?? 0) > 0
              );
              const hasCheckoutItems = checkout.datasets.length > 0 || checkout.intelligences.length > 0 || checkout.report !== '';
              const isEmpty = !hasApiItems && !hasCheckoutItems;

              if (isEmpty) {
                return (
                  <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500">
                    {/* SVG omitted */}
                    <p className="text-lg font-medium">Your checkout is empty</p>
                    <p className="text-sm">Select services from Area Intelligence, Datasets, or Reports to get started.</p>
                  </div>
                );
              }

              return (
                <>
                  <div className="space-y-4">
                    {/* Render intelligence items from API response */}
                    {cartCostResponse?.data?.intelligence_purchase_items
                      ?.filter(item => item.intelligence_name) // Filter out items without intelligence_name
                      .map(item => (
                        <div key={item.intelligence_name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">area</span>
                              <span className="text-sm text-gray-300">•</span>
                              <span className="text-sm text-gray-500">{item.intelligence_name || 'Unknown'}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.intelligence_name || 'Unknown'} Intelligence</h3>
                            <p className="text-sm text-gray-500">{item.explanation}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {item.free_as_part_of_package ? (
                              <span className="text-lg font-semibold text-green-600">Free</span>
                            ) : (
                              <span className="text-lg font-semibold text-gray-900">{formatPrice(item.cost)}</span>
                            )}
                            <button 
                              type="button" 
                              className="text-xs text-red-500 hover:text-red-700" 
                              onClick={() => item.intelligence_name && handleIntelligenceToggle(item.intelligence_name.toLowerCase() as 'population' | 'income')}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    {/* Render dataset items from API response */}
                    {cartCostResponse?.data?.dataset_purchase_items
                      ?.filter(item => item.dataset_name) // Filter out items without dataset_name
                      .map(item => (
                        <div key={item.dataset_name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">dataset</span>
                              <span className="text-sm text-gray-300">•</span>
                              <span className="text-sm text-gray-500">{formatSubcategoryName(item.dataset_name || '')}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{formatSubcategoryName(item.dataset_name || '')}</h3>
                            <p className="text-sm text-gray-500">{item.explanation}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {item.free_as_part_of_package ? (
                              <span className="text-lg font-semibold text-green-600">Free</span>
                            ) : (
                              <span className="text-lg font-semibold text-gray-900">{formatPrice(item.cost)}</span>
                            )}
                            <button 
                              type="button" 
                              className="text-xs text-red-500 hover:text-red-700" 
                              onClick={() => handleDatasetToggle(item.dataset_name)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    {/* Render report items from API response */}
                    {cartCostResponse?.data?.report_purchase_items?.map((item, index) => {
                      const tierName = item.report_name 
                        ? (REPORT_TIERS.find(t => t.reportKey === item.report_name)?.name || `${item.report_name.charAt(0).toUpperCase() + item.report_name.slice(1)} Tier`)
                        : 'Report';
                      return (
                        <div key={`report-${index}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">report</span>
                              <span className="text-sm text-gray-300">•</span>
                              <span className="text-sm text-gray-500 capitalize">{item.report_name || 'report'}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{tierName} Report</h3>
                            <p className="text-sm text-gray-500">{item.explanation}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-lg font-semibold text-gray-900">{formatPrice(item.cost)}</span>
                            {item.report_name && (
                              <button 
                                type="button" 
                                className="text-xs text-red-500 hover:text-red-700" 
                                onClick={() => handleReportToggle(item.report_name as ReportTier)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {/* Fallback: Show items from checkout state if API response not available yet */}
                    {!hasApiItems && (
                      <>
                        {checkout.intelligences.map(service => (
                          <div key={service} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">area</span>
                                <span className="text-sm text-gray-300">•</span>
                                <span className="text-sm text-gray-500">{service}</span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{service} Intelligence</h3>
                              <p className="text-sm text-gray-500">Calculating price...</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button 
                                type="button" 
                                className="text-xs text-red-500 hover:text-red-700" 
                                onClick={() => handleIntelligenceToggle(service.toLowerCase() as 'population' | 'income')}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        {checkout.datasets.map(dataset => (
                          <div key={dataset} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">dataset</span>
                                <span className="text-sm text-gray-300">•</span>
                                <span className="text-sm text-gray-500">{formatSubcategoryName(dataset)}</span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{formatSubcategoryName(dataset)}</h3>
                              <p className="text-sm text-gray-500">Calculating price...</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button 
                                type="button" 
                                className="text-xs text-red-500 hover:text-red-700" 
                                onClick={() => handleDatasetToggle(dataset)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        {checkout.report && (() => {
                          const tierName = REPORT_TIERS.find(t => t.reportKey === checkout.report)?.name || `${checkout.report.charAt(0).toUpperCase() + checkout.report.slice(1)} Tier`;
                          return (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">report</span>
                                  <span className="text-sm text-gray-300">•</span>
                                  <span className="text-sm text-gray-500 capitalize">{checkout.report}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{tierName} Report</h3>
                                <p className="text-sm text-gray-500">Calculating price...</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <button 
                                  type="button" 
                                  className="text-xs text-red-500 hover:text-red-700" 
                                  onClick={() => handleReportToggle(checkout.report)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                  <div className="border-t border-gray-200 mt-6 pt-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-900">
                        {cartCostResponse?.data?.total_cost ? formatPrice(cartCostResponse.data.total_cost) : '$0.00'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="mt-4 w-full bg-[#115740] text-white py-3 rounded-lg font-semibold hover:bg-[#0d4632] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={handlePurchase}
                      disabled={isPurchasing || isCalculatingCost || !canCalculateCost}
                    >
                      {isPurchasing ? 'Processing...' : 'Purchase Now'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutBilling;
