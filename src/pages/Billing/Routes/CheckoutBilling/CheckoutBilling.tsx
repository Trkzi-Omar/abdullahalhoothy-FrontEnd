import React, { useEffect, useMemo, useCallback } from 'react';
import { formatSubcategoryName } from '../../../../utils/helperFunctions';
import urls from '../../../../urls.json';
import { FaCaretDown, FaCaretRight } from 'react-icons/fa';
import { useAuth } from '../../../../context/AuthContext';
import apiRequest from '../../../../services/apiRequest';
import { MdAttachMoney, MdCheckCircle, MdErrorOutline, MdClose, MdHome } from 'react-icons/md';
import { CategoryData } from '../../../../types/allTypesAndInterfaces';
import { useUIContext } from '../../../../context/UIContext';
import { useBillingContext, type ReportTier } from '../../../../context/BillingContext';
import ItemSelectionView from './ItemSelectionView';
import CheckoutModal from './CheckoutModal';

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
      poi: true,
    },
    isMostPopular: true,
    conciergeService: 'Personal consultant to guide your business expansion.',
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
      poi: true,
    },
    isMostPopular: false,
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
      poi: true,
    },
    isMostPopular: false,
  },
];

interface DataVariable {
  key: string;
  description: string;
}

interface SelectedItemData {
  name: string;
  type: 'dataset' | 'intelligence' | 'report';
  description: string;
  dataVariables: DataVariable[];
  price?: number;
  itemKey?: string;
  isCurrentlyOwned?: boolean;
  expiration?: string;
  explanation?: string;
}

function CheckoutBilling({ Name }: { Name: string }) {
  const [categories, setCategories] = React.useState<CategoryData>({});
  const [openedCategories, setOpenedCategories] = React.useState<string[]>([]);
  const [isCalculatingCost, setIsCalculatingCost] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedItem, setSelectedItem] = React.useState<SelectedItemData | null>(null);
  const [selectedItemKey, setSelectedItemKey] = React.useState<{
    key: string;
    type: 'dataset' | 'intelligence' | 'report';
    name: string;
  } | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = React.useState(false);
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
        description?: string;
        data_variables?: Record<string, string>;
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
        description?: string;
        data_variables?: Record<string, string>;
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
        report_tier: string;
        report_potential_business_type?: string;
        description?: string;
        data_variables?: Record<string, string>;
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

  const formatPrice = useCallback(
    (value: number) =>
      `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    []
  );

  const handleDatasetToggle = useCallback(
    (type: string) => {
      if (!checkout.country_name || !checkout.city_name) {
        openModal(
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MdErrorOutline className="text-orange-500 text-6xl mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Location Required</h2>
            <p className="text-gray-600">
              Please select a country and city before adding datasets.
            </p>
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
    },
    [dispatch, checkout.country_name, checkout.city_name, openModal]
  );

  const handleIntelligenceToggle = useCallback(
    (service: 'population' | 'income') => {
      const formatted = service === 'population' ? 'Population' : 'Income';
      dispatch({ type: 'toggleIntelligence', payload: formatted });
    },
    [dispatch]
  );

  const handleReportToggle = useCallback(
    (reportKey: ReportTier) => {
      if (checkout.report === reportKey) {
        dispatch({ type: 'setReport', payload: '' });
      } else {
        dispatch({ type: 'setReport', payload: reportKey });
      }
    },
    [checkout.report, dispatch]
  );

  // Calculate cart cost
  const calculateCartCost = useCallback(async () => {
    if (!authResponse?.localId) {
      return;
    }

    // Don't calculate if there are no items in cart
    if (
      checkout.datasets.length === 0 &&
      checkout.intelligences.length === 0 &&
      checkout.report === ''
    ) {
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
      console.log(response.data);

      setCartCostResponse(response.data);
    } catch {
      setCartCostResponse(null);
    } finally {
      setIsCalculatingCost(false);
    }
  }, [authResponse?.localId, checkout]);

  // Helper function to convert data_variables object to array
  const convertDataVariables = useCallback(
    (dataVars: Record<string, string> | undefined): DataVariable[] => {
      if (!dataVars) return [];
      return Object.entries(dataVars).map(([key, description]) => ({
        key,
        description,
      }));
    },
    []
  );

  // Helper to create empty/no-data selected item
  const createEmptySelectedItem = useCallback(
    (
      name: string,
      type: 'dataset' | 'intelligence' | 'report',
      itemKey: string,
      description = 'No data available.'
    ): SelectedItemData => ({
      name,
      type,
      description,
      dataVariables: [],
      itemKey,
    }),
    []
  );

  // Update selectedItem when API response changes
  useEffect(() => {
    if (!selectedItemKey) {
      return;
    }

    const { key, type, name } = selectedItemKey;

    if (isCalculatingCost) {
      setSelectedItem(createEmptySelectedItem(name, type, key, ''));
      return;
    }

    if (!cartCostResponse?.data) {
      setSelectedItem(createEmptySelectedItem(name, type, key));
      return;
    }

    if (type === 'intelligence') {
      const item = cartCostResponse.data.intelligence_purchase_items?.find(
        i => i.intelligence_name === key
      );
      if (item) {
        setSelectedItem({
          name,
          type,
          description: item.description || '',
          dataVariables: convertDataVariables(item.data_variables),
          price: item.cost,
          itemKey: key,
          isCurrentlyOwned: item.is_currently_owned,
          expiration: item.expiration || undefined,
          explanation: item.explanation,
        });
      } else {
        setSelectedItem(createEmptySelectedItem(name, type, key));
      }
    } else if (type === 'dataset') {
      const item = cartCostResponse.data.dataset_purchase_items?.find(d => d.dataset_name === key);
      if (item) {
        setSelectedItem({
          name,
          type,
          description: item.description || '',
          dataVariables: convertDataVariables(item.data_variables),
          price: item.cost,
          itemKey: key,
          isCurrentlyOwned: item.is_currently_owned,
          expiration: item.expiration || undefined,
          explanation: item.explanation,
        });
      } else {
        setSelectedItem(createEmptySelectedItem(name, type, key));
      }
    } else if (type === 'report') {
      const item = cartCostResponse.data.report_purchase_items?.find(r => r.report_tier === key);
      if (item) {
        setSelectedItem({
          name,
          type,
          description: item.description || '',
          dataVariables: convertDataVariables(item.data_variables),
          price: item.cost,
          itemKey: key,
          isCurrentlyOwned: item.is_currently_owned,
          expiration: item.expiration || undefined,
          explanation: item.explanation,
        });
      } else {
        setSelectedItem(createEmptySelectedItem(name, type, key));
      }
    }
  }, [
    cartCostResponse,
    selectedItemKey,
    isCalculatingCost,
    convertDataVariables,
    createEmptySelectedItem,
  ]);

  // Handler to select and add item to cart
  const handleItemSelect = useCallback(
    (itemKey: string, type: 'dataset' | 'intelligence' | 'report', name: string) => {
      // Set selected item key for tracking
      setSelectedItemKey({ key: itemKey, type, name });

      // Add to cart if not already there
      if (type === 'intelligence') {
        const formatted = itemKey as 'Income' | 'Population';
        if (!checkout.intelligences.includes(formatted)) {
          dispatch({ type: 'toggleIntelligence', payload: formatted });
        }
      } else if (type === 'dataset') {
        if (!checkout.datasets.includes(itemKey)) {
          if (!checkout.country_name || !checkout.city_name) {
            openModal(
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <MdErrorOutline className="text-orange-500 text-6xl mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Location Required</h2>
                <p className="text-gray-600">
                  Please select a country and city before adding datasets.
                </p>
              </div>,
              {
                darkBackground: true,
                isSmaller: true,
                hasAutoSize: true,
              }
            );
            return;
          }
          dispatch({ type: 'toggleDataset', payload: itemKey });
        }
      } else if (type === 'report') {
        if (checkout.report !== itemKey) {
          dispatch({ type: 'setReport', payload: itemKey as ReportTier });
        }
      }
    },
    [checkout, dispatch, openModal]
  );

  const canCalculateCost = useMemo(
    () =>
      checkout.datasets.length > 0 || checkout.intelligences.length > 0 || checkout.report !== '',
    [checkout]
  );

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
  }, [
    checkout.datasets,
    checkout.intelligences,
    checkout.report,
    checkout.country_name,
    checkout.city_name,
    canCalculateCost,
    authResponse?.localId,
    calculateCartCost,
  ]);

  const getAreaCardClasses = useCallback(
    (isSelected: boolean) =>
      `border rounded-lg transition-all flex items-center justify-between w-full max-w-md px-3 py-2 sm:px-4 sm:py-3 cursor-pointer ${
        isSelected
          ? 'border-green-600 bg-green-50 text-green-800 shadow-lg ring-2 ring-green-200'
          : 'border-gray-300 bg-white text-gray-700 shadow-md hover:shadow-lg hover:border-[#115740] hover:bg-gray-50'
      }`,
    []
  );

  // ... Render JSX updated to use 'checkout' state and dispatch actions ...
  return (
    <div className="h-full overflow-hidden relative flex flex-col lg:flex-row">
      <div className="w-full lg:w-1/3 flex flex-col justify-between items-center overflow-y-auto">
        {Name === 'area' ? (
          <div className="w-full px-4 sm:px-8 lg:px-24">
            <div className="text-2xl pl-6 pt-4 font-semibold mb-4">Area Intelligence</div>
            <div className="flex flex-col items-center space-y-6">
              <div
                className={getAreaCardClasses(checkout.intelligences.includes('Population'))}
                role="button"
                tabIndex={0}
                onClick={() => {
                  handleItemSelect('Population', 'intelligence', 'Population Intelligence');
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleItemSelect('Population', 'intelligence', 'Population Intelligence');
                  }
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
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
                    <div className="flex-1">
                      <div className="font-semibold">Population Intelligence</div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        Access comprehensive population demographics...
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mt-1">Price: TBD</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {checkout.intelligences.includes('Population') ? (
                    <MdCheckCircle className="text-green-600" size={24} />
                  ) : (
                    <span className="text-xs text-gray-400">Tap to view</span>
                  )}
                </div>
              </div>
              <div
                className={getAreaCardClasses(checkout.intelligences.includes('Income'))}
                role="button"
                tabIndex={0}
                onClick={() => {
                  handleItemSelect('Income', 'intelligence', 'Income Intelligence');
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleItemSelect('Income', 'intelligence', 'Income Intelligence');
                  }
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MdAttachMoney size={24} />
                    <div className="flex-1">
                      <div className="font-semibold">Income Intelligence</div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        Gain deep insights into income levels and wealth...
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mt-1">Price: TBD</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {checkout.intelligences.includes('Income') ? (
                    <MdCheckCircle className="text-green-600" size={24} />
                  ) : (
                    <span className="text-xs text-gray-400">Tap to view</span>
                  )}
                </div>
              </div>
              <div
                className="border rounded-lg transition-all flex items-center justify-between w-full max-w-md px-3 py-2 sm:px-4 sm:py-3 border-gray-300 bg-gray-100/60 shadow-md cursor-not-allowed relative"
                role="button"
                tabIndex={-1}
                aria-disabled="true"
              >
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                  <span className="text-[10px] sm:text-xs bg-purple-500 text-white px-2 py-1 rounded-full font-semibold shadow-sm">
                    Coming next month
                  </span>
                </div>
                <div className="flex items-center gap-3 opacity-50 pr-24 sm:pr-28">
                  <MdHome size={24} />
                  <div>
                    <div className="font-semibold text-gray-700">Real Estate Intelligence</div>
                    <div className="text-xs text-gray-500">Enable smart real estate data</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : Name === 'reports' ? (
          <div className="w-full px-4 sm:px-8 lg:px-24">
            <div className="text-2xl pl-6 pt-4 font-semibold mb-6">Report</div>
            <div className="flex flex-col lg:flex-row gap-6 flex-wrap">
              {REPORT_TIERS.map(tier => {
                return (
                  <details
                    key={tier.id}
                    className="relative border rounded-xl shadow-md hover:shadow-lg transition-all flex-1 min-w-full sm:min-w-[300px] max-w-full lg:max-w-[400px] bg-white overflow-hidden"
                  >
                    {tier.isMostPopular && (
                      <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-lg z-10">
                        Most Popular
                        <div className="absolute -right-2 top-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-green-500"></div>
                      </div>
                    )}
                    <summary className="cursor-pointer p-6 flex flex-col items-start font-semibold list-none [&::-webkit-details-marker]:hidden">
                      <div className="w-full flex justify-between items-start mb-4">
                        <span className="text-xl text-gray-900 font-bold">{tier.name}</span>
                        <span className="text-3xl font-bold text-green-700">
                          {formatPrice(tier.price)}
                        </span>
                      </div>
                    </summary>
                    <div className="p-6 pt-0 space-y-4">
                      <div className="mb-3">
                        <span className="bg-purple-100 text-purple-700 rounded-full px-4 py-2 font-medium text-sm inline-block">
                          Top 10 Locations Ranked
                        </span>
                      </div>
                      <ul className="mb-4 text-sm space-y-2">
                        {tier.perks.map(perk => (
                          <li key={perk} className="text-gray-700">
                            • {perk}
                          </li>
                        ))}
                      </ul>
                      <div className="mb-4">
                        <div className="text-sm font-semibold text-gray-900 mb-3">
                          Intelligences Included:
                        </div>
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
                              <span className="font-semibold">Concierge Service:</span>{' '}
                              {tier.conciergeService}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            handleItemSelect(tier.reportKey, 'report', `${tier.name} Report`);
                          }}
                          className="flex-1 rounded-lg transition-all py-3 font-semibold bg-purple-600 text-white hover:bg-purple-700"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="w-full px-4 sm:px-8 lg:px-24">
              <div className="flex flex-col my-5 w-full">
                <div className="flex justify-between mb-4">
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
                    <div key={category} className="flex-1 min-w-full sm:min-w-[200px]">
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
                        <span>
                          {openedCategories.includes(category) ? <FaCaretDown /> : <FaCaretRight />}
                        </span>{' '}
                        {formatSubcategoryName(category)}
                      </button>
                      <div
                        className={`w-full basis-full overflow-hidden transition-all ${!openedCategories.includes(category) ? 'h-0' : ''}`}
                      >
                        <div className="flex flex-wrap gap-3 mt-3">
                          {(types as string[]).map(type => {
                            const formattedName = formatSubcategoryName(type);
                            const isSelected = checkout.datasets.includes(type);
                            return (
                              <div key={type} className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  className={`px-2 py-0 rounded border transition-all ${
                                    isSelected
                                      ? 'bg-green-600 text-white border-green-700'
                                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                                  }`}
                                  onClick={e => {
                                    e.preventDefault();
                                    handleItemSelect(type, 'dataset', formattedName);
                                  }}
                                >
                                  <div>
                                    {formattedName}
                                    <span className="ml-2 font-bold">{isSelected ? '✓' : '+'}</span>
                                  </div>
                                  <div className="text-[12px] text-left">$300</div>
                                </button>
                              </div>
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

      {/* Item Selection View panel */}
      <div className="w-full lg:w-2/3 flex flex-col justify-center items-center border-l-0 lg:border-l border-gray-200">
        <ItemSelectionView
          selectedItem={selectedItem}
          isLoading={isCalculatingCost && !!selectedItemKey}
          isInCart={
            selectedItem?.type === 'intelligence'
              ? checkout.intelligences.includes(selectedItem.itemKey || '')
              : selectedItem?.type === 'dataset'
                ? checkout.datasets.includes(selectedItem.itemKey || '')
                : selectedItem?.type === 'report'
                  ? checkout.report === selectedItem.itemKey
                  : false
          }
          onAddToCart={() => {
            if (!selectedItem?.itemKey) return;
            if (selectedItem.type === 'intelligence') {
              handleIntelligenceToggle(
                selectedItem.itemKey === 'Population' ? 'population' : 'income'
              );
            } else if (selectedItem.type === 'dataset') {
              handleDatasetToggle(selectedItem.itemKey);
            } else if (selectedItem.type === 'report') {
              handleReportToggle(selectedItem.itemKey as ReportTier);
            }
          }}
          onRemoveFromCart={() => {
            if (!selectedItem?.itemKey) return;
            if (selectedItem.type === 'intelligence') {
              handleIntelligenceToggle(
                selectedItem.itemKey === 'Population' ? 'population' : 'income'
              );
            } else if (selectedItem.type === 'dataset') {
              handleDatasetToggle(selectedItem.itemKey);
            } else if (selectedItem.type === 'report') {
              handleReportToggle(selectedItem.itemKey as ReportTier);
            }
          }}
        />
      </div>

      {/* View Checkout Button - Fixed at bottom center */}
      {canCalculateCost && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <button
            type="button"
            onClick={() => setShowCheckoutModal(true)}
            className="bg-[#115740] text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-2xl hover:bg-[#0d4632] transition-all flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            View Checkout
            {(() => {
              const itemCount =
                checkout.datasets.length +
                checkout.intelligences.length +
                (checkout.report ? 1 : 0);
              return itemCount > 0 ? (
                <span className="bg-white text-[#115740] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {itemCount}
                </span>
              ) : null;
            })()}
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <CheckoutModal
          onClose={() => setShowCheckoutModal(false)}
          cartCostResponse={cartCostResponse}
          isCalculatingCost={isCalculatingCost}
          onPurchaseComplete={() => {
            dispatch({ type: 'reset' });
            setCartCostResponse(null);
          }}
        />
      )}
    </div>
  );
}

export default CheckoutBilling;
