import React, { useEffect, useMemo, useCallback } from 'react';
import { formatSubcategoryName } from '../../../../utils/helperFunctions';
import urls from '../../../../urls.json';
import { useAuth } from '../../../../context/AuthContext';
import apiRequest from '../../../../services/apiRequest';
import { MdAttachMoney, MdCheckCircle, MdErrorOutline, MdClose, MdHome } from 'react-icons/md';
import { CategoryData } from '../../../../types/allTypesAndInterfaces';
import { useUIContext } from '../../../../context/UIContext';
import { useBillingContext, type ReportTier } from '../../../../context/BillingContext';
import ItemSelectionView from './ItemSelectionView';
import CheckoutModal from './CheckoutModal';
import CategoriesBrowserSubCategories from '../../../../components/CategoriesBrowserSubCategories/CategoriesBrowserSubCategories';
import { Skeleton } from '../../../../components/common/Skeleton';

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

interface PriceData {
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
}

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

const itemConfig = {
  intelligence: {
    arrayKey: 'intelligence_purchase_items' as const,
    matchKey: 'intelligence_name' as const,
  },
  dataset: {
    arrayKey: 'dataset_purchase_items' as const,
    matchKey: 'dataset_name' as const,
  },
  report: {
    arrayKey: 'report_purchase_items' as const,
    matchKey: 'report_tier' as const,
  },
} as const;

function CheckoutBilling({ Name }: { Name: string }) {
  const [categories, setCategories] = React.useState<CategoryData>({});
  const [openedCategories, setOpenedCategories] = React.useState<string[]>([]);
  const [isCalculatingCost, setIsCalculatingCost] = React.useState(false);
  const [isCalculatingPrices, setIsCalculatingPrices] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedItem, setSelectedItem] = React.useState<SelectedItemData | null>(null);
  const [selectedItemKey, setSelectedItemKey] = React.useState<{
    key: string;
    type: 'dataset' | 'intelligence' | 'report';
    name: string;
  } | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = React.useState(false);

  // priceData: ONLY for displaying prices (fetches ALL items)
  const [priceData, setPriceData] = React.useState<PriceData | null>(null);

  // Track last location used for price fetching
  const [lastPriceLocation, setLastPriceLocation] = React.useState<{
    country_name: string;
    city_name: string;
  } | null>(null);

  // cartCostResponse: For cart management and checked items (fetches only checked items)
  const [cartCostResponse, setCartCostResponse] = React.useState<{
    data?: PriceData;
  } | null>(null);

  const [hasInitializedArea, setHasInitializedArea] = React.useState(false);
  const [hasInitializedDatasets, setHasInitializedDatasets] = React.useState(false);
  const [hasInitializedReports, setHasInitializedReports] = React.useState(false);
  const [activeView, setActiveView] = React.useState<'area' | 'datasets' | 'reports'>('area');

  const { authResponse } = useAuth();
  const { openModal } = useUIContext();
  const { checkout, dispatch } = useBillingContext();

  // Update active view when Name changes
  useEffect(() => {
    if (Name === 'area') {
      setActiveView('area');
    } else if (Name === 'reports') {
      setActiveView('reports');
    } else {
      setActiveView('datasets');
    }
  }, [Name]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await apiRequest({
          url: urls.nearby_categories,
          method: 'get',
        });
        const categoriesData = res.data.data;
        setCategories(categoriesData);
      } catch {
        // Silently handle error
      }
    };
    fetchInitialData();
  }, []);

  // Mark views as initialized when they're opened
  useEffect(() => {
    if (activeView === 'area' && !hasInitializedArea) {
      setHasInitializedArea(true);
    }
  }, [activeView, hasInitializedArea]);

  useEffect(() => {
    if (
      activeView === 'datasets' &&
      !hasInitializedDatasets &&
      Object.keys(categories).length > 0
    ) {
      setHasInitializedDatasets(true);
    }
  }, [activeView, hasInitializedDatasets, categories]);

  useEffect(() => {
    if (activeView === 'reports' && !hasInitializedReports) {
      setHasInitializedReports(true);
    }
  }, [activeView, hasInitializedReports]);

  const formatPrice = useCallback(
    (value: number) =>
      `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    []
  );

  const population_intelligence = useMemo(() => {
    return priceData?.intelligence_purchase_items?.find(i => i.intelligence_name === 'Population');
  }, [priceData]);

  const income_intelligence = useMemo(() => {
    return priceData?.intelligence_purchase_items?.find(i => i.intelligence_name === 'Income');
  }, [priceData]);

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

  /**
   * Fetch area intelligence prices - sends only intelligences
   */
  const fetchAreaPrices = useCallback(async () => {
    if (!authResponse?.localId) {
      return;
    }

    const currentCountry = checkout.country_name || '';
    const currentCity = checkout.city_name || '';

    // Check if location has changed
    const locationChanged =
      !lastPriceLocation ||
      lastPriceLocation.country_name !== currentCountry ||
      lastPriceLocation.city_name !== currentCity;

    // Check if intelligences data already exists AND location hasn't changed
    if (
      !locationChanged &&
      priceData?.intelligence_purchase_items &&
      priceData.intelligence_purchase_items.length > 0
    ) {
      return; // Already have intelligence prices for this location, skip fetch
    }

    const allIntelligences = ['Income', 'Population'];

    setIsCalculatingPrices(true);

    try {
      const requestBody: {
        user_id: string;
        country_name: string;
        city_name: string;
        datasets: string[];
        intelligences: string[];
        displayed_price: number;
      } = {
        user_id: authResponse.localId,
        country_name: currentCountry,
        city_name: currentCity,
        datasets: [], // No datasets for area view
        intelligences: allIntelligences,
        displayed_price: 0,
      };

      const response = await apiRequest({
        url: urls.calculate_cart_cost,
        method: 'POST',
        body: requestBody,
        isAuthRequest: true,
      });
      console.log('Area price data:', response.data);

      // Update last location used
      setLastPriceLocation({
        country_name: currentCountry,
        city_name: currentCity,
      });

      // Merge with existing priceData, preserving other data
      setPriceData(prev => ({
        total_cost: response.data.data.total_cost ?? prev?.total_cost,
        intelligence_purchase_items: response.data.data.intelligence_purchase_items,
        dataset_purchase_items: prev?.dataset_purchase_items ?? undefined,
        report_purchase_items: prev?.report_purchase_items ?? undefined,
      }));
    } catch {
      // Don't clear existing data on error
    } finally {
      setIsCalculatingPrices(false);
    }
  }, [
    authResponse?.localId,
    checkout.country_name,
    checkout.city_name,
    priceData,
    lastPriceLocation,
  ]);

  /**
   * Fetch dataset prices - sends only datasets
   */
  const fetchDatasetPrices = useCallback(async () => {
    if (!authResponse?.localId) {
      return;
    }

    const currentCountry = checkout.country_name || '';
    const currentCity = checkout.city_name || '';

    // Check if location has changed
    const locationChanged =
      !lastPriceLocation ||
      lastPriceLocation.country_name !== currentCountry ||
      lastPriceLocation.city_name !== currentCity;

    // Check if datasets data already exists AND location hasn't changed
    if (
      !locationChanged &&
      priceData?.dataset_purchase_items &&
      priceData.dataset_purchase_items.length > 0
    ) {
      return; // Already have dataset prices for this location, skip fetch
    }

    // Extract all available datasets from categories
    const allDatasets: string[] = [];
    Object.values(categories).forEach(types => {
      if (Array.isArray(types)) {
        allDatasets.push(...types);
      }
    });

    if (allDatasets.length === 0) {
      return; // No datasets to fetch
    }

    setIsCalculatingPrices(true);

    try {
      const requestBody: {
        user_id: string;
        country_name: string;
        city_name: string;
        datasets: string[];
        intelligences: string[];
        displayed_price: number;
      } = {
        user_id: authResponse.localId,
        country_name: currentCountry,
        city_name: currentCity,
        datasets: allDatasets,
        intelligences: [], // No intelligences for datasets view
        displayed_price: 0,
      };

      const response = await apiRequest({
        url: urls.calculate_cart_cost,
        method: 'POST',
        body: requestBody,
        isAuthRequest: true,
      });
      console.log('Dataset price data:', response.data);

      // Update last location used
      setLastPriceLocation({
        country_name: currentCountry,
        city_name: currentCity,
      });

      // Merge with existing priceData, preserving other data
      setPriceData(prev => ({
        total_cost: response.data.data.total_cost ?? prev?.total_cost,
        intelligence_purchase_items: prev?.intelligence_purchase_items ?? undefined,
        dataset_purchase_items: response.data.data.dataset_purchase_items,
        report_purchase_items: prev?.report_purchase_items ?? undefined,
      }));
    } catch {
      // Don't clear existing data on error
    } finally {
      setIsCalculatingPrices(false);
    }
  }, [
    authResponse?.localId,
    checkout.country_name,
    checkout.city_name,
    categories,
    priceData,
    lastPriceLocation,
  ]);

  /**
   * Fetch report prices - sends only reports
   */
  const fetchReportPrices = useCallback(async () => {
    if (!authResponse?.localId) {
      return;
    }

    const currentCountry = checkout.country_name || '';
    const currentCity = checkout.city_name || '';

    // Check if location has changed
    const locationChanged =
      !lastPriceLocation ||
      lastPriceLocation.country_name !== currentCountry ||
      lastPriceLocation.city_name !== currentCity;

    // Check if reports data already exists AND location hasn't changed
    if (
      !locationChanged &&
      priceData?.report_purchase_items &&
      priceData.report_purchase_items.length > 0
    ) {
      return; // Already have report prices for this location, skip fetch
    }

    const defaultReport = 'premium';

    setIsCalculatingPrices(true);

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
        country_name: currentCountry,
        city_name: currentCity,
        datasets: [], // No datasets for reports view
        intelligences: [], // No intelligences for reports view
        displayed_price: 0,
        report: defaultReport as ReportTier,
      };

      const response = await apiRequest({
        url: urls.calculate_cart_cost,
        method: 'POST',
        body: requestBody,
        isAuthRequest: true,
      });
      console.log('Report price data:', response.data);

      // Update last location used
      setLastPriceLocation({
        country_name: currentCountry,
        city_name: currentCity,
      });

      // Merge with existing priceData, preserving other data
      setPriceData(prev => ({
        total_cost: response.data.data.total_cost ?? prev?.total_cost,
        intelligence_purchase_items: prev?.intelligence_purchase_items ?? undefined,
        dataset_purchase_items: prev?.dataset_purchase_items ?? undefined,
        report_purchase_items: response.data.data.report_purchase_items,
      }));
    } catch {
      // Don't clear existing data on error
    } finally {
      setIsCalculatingPrices(false);
    }
  }, [
    authResponse?.localId,
    checkout.country_name,
    checkout.city_name,
    priceData,
    lastPriceLocation,
  ]);

  /**
   * Calculate cart cost - sends only CHECKED items for cart management
   *
   * This function sends only the items that user has checked/selected.
   * The cartCostResponse is used for cart management and checkout.
   */
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
        datasets: checkout.datasets, // Only checked datasets
        intelligences: checkout.intelligences, // Only checked intelligences
        displayed_price: 0,
      };

      // Only include report if it's selected
      if (checkout.report) {
        requestBody.report = checkout.report;
      }

      const response = await apiRequest({
        url: urls.calculate_cart_cost,
        method: 'POST',
        body: requestBody,
        isAuthRequest: true,
      });
      console.log('Cart cost:', response.data);

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

  // Update selectedItem when price data changes (uses priceData for display)
  useEffect(() => {
    if (!selectedItemKey) {
      return;
    }

    const { key, type, name } = selectedItemKey;

    if (isCalculatingPrices) {
      setSelectedItem(createEmptySelectedItem(name, type, key, ''));
      return;
    }

    if (!priceData) {
      setSelectedItem(createEmptySelectedItem(name, type, key));
      return;
    }

    const config = itemConfig[type];
    if (config) {
      const items = priceData[config.arrayKey];
      const item = items?.find((i: any) => i[config.matchKey] === key);

      if (item) {
        setSelectedItem({
          name,
          type,
          description: (item as any).description || '',
          dataVariables: convertDataVariables((item as any).data_variables),
          price: (item as any).cost,
          itemKey: key,
          isCurrentlyOwned: (item as any).is_currently_owned,
          expiration: (item as any).expiration || undefined,
          explanation: (item as any).explanation,
        });
      } else {
        setSelectedItem(createEmptySelectedItem(name, type, key));
      }
    }
  }, [
    priceData,
    selectedItemKey,
    isCalculatingPrices,
    convertDataVariables,
    createEmptySelectedItem,
  ]);

  // Handler to select item for viewing details (NOT for adding to cart)
  const handleItemSelect = useCallback(
    (itemKey: string, type: 'dataset' | 'intelligence' | 'report', name: string) => {
      // ONLY set selected item key for viewing - don't add to cart
      setSelectedItemKey({ key: itemKey, type, name });
    },
    []
  );

  // Can always calculate cost if we have categories loaded and location set
  const canCalculateCost = useMemo(
    () => Object.keys(categories).length > 0 && checkout.country_name && checkout.city_name,
    [categories, checkout.country_name, checkout.city_name]
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

  // Handlers for CategoriesBrowserSubCategories component
  const handleToggleCategory = useCallback(
    (category: string) => {
      if (openedCategories.includes(category)) {
        setOpenedCategories(openedCategories.filter(x => x !== category));
      } else {
        setOpenedCategories([...openedCategories, category]);
      }
    },
    [openedCategories]
  );

  const getTypeCounts = useCallback(
    (type: string) => {
      // For checkout, we only care about "included" (in cart)
      // Return [1] if in cart, [] if not
      const isInCart = checkout.datasets.includes(type);
      return {
        includedCount: isInCart ? [1] : [],
        excludedCount: [],
      };
    },
    [checkout.datasets]
  );

  const handleRemoveType = useCallback(
    (type: string, _layerId: number, _isExcluded: boolean) => {
      // Remove from cart
      if (checkout.datasets.includes(type)) {
        dispatch({ type: 'toggleDataset', payload: type });
      }
    },
    [checkout.datasets, dispatch]
  );

  const handleAddToIncluded = useCallback(
    (type: string) => {
      // Add to cart
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
      if (!checkout.datasets.includes(type)) {
        dispatch({ type: 'toggleDataset', payload: type });
      }
      // Also select for viewing
      const formattedName = formatSubcategoryName(type);
      handleItemSelect(type, 'dataset', formattedName);
    },
    [checkout, dispatch, openModal, handleItemSelect]
  );

  // Fetch prices for display - fetch only relevant items based on active view
  useEffect(() => {
    if (!canCalculateCost || !authResponse?.localId) {
      return; // Don't clear priceData, just don't fetch if conditions not met
    }

    // Determine which prices to fetch based on the active view
    if (activeView === 'area') {
      // For area intelligence, fetch only intelligences
      const timeoutId = setTimeout(() => {
        fetchAreaPrices();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (activeView === 'reports' && hasInitializedReports) {
      // For reports, fetch only reports
      const timeoutId = setTimeout(() => {
        fetchReportPrices();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (activeView === 'datasets' && hasInitializedDatasets && openedCategories.length > 0) {
      // For datasets, only fetch if at least one category is opened
      const timeoutId = setTimeout(() => {
        fetchDatasetPrices();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [
    activeView,
    hasInitializedDatasets,
    hasInitializedReports,
    openedCategories.length,
    canCalculateCost,
    authResponse?.localId,
    fetchAreaPrices,
    fetchDatasetPrices,
    fetchReportPrices,
  ]);

  // Calculate cart cost when checkout state changes (for cart management)
  useEffect(() => {
    if (!authResponse?.localId) {
      return;
    }

    // Only calculate if there are items in cart
    const hasCartItems =
      checkout.datasets.length > 0 || checkout.intelligences.length > 0 || checkout.report !== '';

    if (hasCartItems) {
      const timeoutId = setTimeout(() => {
        calculateCartCost();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setCartCostResponse(null);
    }
  }, [
    checkout.datasets,
    checkout.intelligences,
    checkout.report,
    checkout.country_name,
    checkout.city_name,
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

  console.log('selectedItem', selectedItem);
  console.log('checkout.datasets', checkout.datasets);
  console.log(
    `include selectedItem?.type === "dataset"
                ? checkout.datasets.includes(selectedItem.itemKey || "")`,
    checkout.datasets.includes(selectedItem?.itemKey || '')
  );

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
                      {isCalculatingPrices ? (
                        <Skeleton className="w-full h-4" />
                      ) : (
                        <div className="text-xs text-gray-500 line-clamp-1">
                          {population_intelligence?.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mt-1">
                    Price:{' '}
                    {isCalculatingPrices ? (
                      <Skeleton className="w-10 h-4" />
                    ) : population_intelligence ? (
                      formatPrice(population_intelligence?.cost || 0)
                    ) : (
                      'TBD'
                    )}
                  </div>
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
                      {isCalculatingPrices ? (
                        <Skeleton className="w-full h-4" />
                      ) : (
                        <div className="text-xs text-gray-500 line-clamp-1">
                          {income_intelligence?.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mt-1 flex">
                    Price:{' '}
                    {isCalculatingPrices ? (
                      <Skeleton className="w-10 h-4" />
                    ) : income_intelligence ? (
                      formatPrice(income_intelligence?.cost || 0)
                    ) : (
                      'TBD'
                    )}
                  </div>
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
                          {isCalculatingPrices ? (
                            <span className="text-2xl animate-pulse">Loading...</span>
                          ) : priceData?.report_purchase_items?.find(
                              r => r.report_tier === tier.reportKey
                            ) ? (
                            formatPrice(
                              priceData.report_purchase_items.find(
                                r => r.report_tier === tier.reportKey
                              )?.cost || 0
                            )
                          ) : (
                            formatPrice(tier.price)
                          )}
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
            <div className="w-full px-4 sm:px-8 lg:px-12">
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

                <CategoriesBrowserSubCategories
                  categories={filteredCategories}
                  openedCategories={openedCategories}
                  onToggleCategory={handleToggleCategory}
                  getTypeCounts={getTypeCounts}
                  onRemoveType={handleRemoveType}
                  onAddToIncluded={handleAddToIncluded}
                  // onAddToExcluded={handleAddToExcluded}
                  getPrice={(type: string) => {
                    if (isCalculatingPrices) {
                      return <Skeleton className="w-10 h-4" />;
                    }
                    const priceItem = priceData?.dataset_purchase_items?.find(
                      d => d.dataset_name === type
                    );
                    return priceItem ? formatPrice(priceItem.cost) : 'TBD';
                  }}
                  onTypeClick={(type: string) => {
                    const formattedName = formatSubcategoryName(type);
                    handleItemSelect(type, 'dataset', formattedName);
                  }}
                  hideAddRemoveButtons={true}
                />
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
          isLoading={isCalculatingPrices && !!selectedItemKey}
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

      {/* View Checkout Button - Fixed at bottom center - Show only if user has selected items */}
      {(checkout.datasets.length > 0 || checkout.intelligences.length > 0 || checkout.report) && (
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
