import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  reportPricingService,
  TierPricingParams,
  LocationPricingParams,
  AdditionalCostParams,
} from '../services/reportPricingService';

// ===========================
// Hook 1: useTierPricing
// ===========================

export interface UseTierPricingParams {
  country: string | null;
  city: string | null;
  datasets: string[];
  enabled?: boolean;
}

export interface UseTierPricingReturn {
  basicPrice: number | null;
  standardPrice: number | null;
  premiumPrice: number | null;
  tierAvailability: {
    basic: boolean;
    standard: boolean;
    premium: boolean;
  };
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching pricing for all three report tiers (basic, standard, premium)
 * Makes 3 parallel API calls but automatically deduplicates requests
 */
export function useTierPricing(params: UseTierPricingParams): UseTierPricingReturn {
  const { authResponse } = useAuth();
  const [basicPrice, setBasicPrice] = useState<number | null>(null);
  const [standardPrice, setStandardPrice] = useState<number | null>(null);
  const [premiumPrice, setPremiumPrice] = useState<number | null>(null);
  const [tierAvailability, setTierAvailability] = useState<{
    basic: boolean;
    standard: boolean;
    premium: boolean;
  }>({
    basic: true,
    standard: true,
    premium: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchTierPrices = useCallback(async () => {
    if (!authResponse?.localId || !params.country || !params.city) {
      setBasicPrice(null);
      setStandardPrice(null);
      setPremiumPrice(null);
      return;
    }

    if (params.enabled === false) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestParams: TierPricingParams = {
        user_id: authResponse.localId,
        country_name: params.country,
        city_name: params.city,
        datasets: params.datasets,
      };

      const response = await reportPricingService.fetchTierPricing(requestParams);

      if (isMountedRef.current) {
        setBasicPrice(response.basic);
        setStandardPrice(response.standard);
        setPremiumPrice(response.premium);
        setTierAvailability(response.availability);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err as Error);
        setBasicPrice(null);
        setStandardPrice(null);
        setPremiumPrice(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [authResponse?.localId, params.country, params.city, params.enabled]);

  // Fetch on mount and when dependencies change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTierPrices();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchTierPrices]);

  return {
    basicPrice,
    standardPrice,
    premiumPrice,
    tierAvailability,
    isLoading,
    error,
    refetch: fetchTierPrices,
  };
}

// ===========================
// Hook 2: useLocationPricing
// ===========================

export interface UseLocationPricingParams {
  country: string | null;
  city: string | null;
  datasets: string[];
  reportType: string; // e.g., 'single_location_premium'
  enabled?: boolean;
  onLoadingChange?: (isLoading: boolean, priceAvailable: boolean) => void;
}

export interface UseLocationPricingReturn {
  price: number | null;
  comingSoon: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching location report pricing
 */
export function useLocationPricing(params: UseLocationPricingParams): UseLocationPricingReturn {
  const { authResponse } = useAuth();
  const [price, setPrice] = useState<number | null>(null);
  const [comingSoon, setComingSoon] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchLocationPrice = useCallback(async () => {
    if (!authResponse?.localId || !params.country || !params.city) {
      setPrice(null);
      return;
    }

    if (params.enabled === false) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Notify parent of loading state change
    if (params.onLoadingChange) {
      params.onLoadingChange(true, false);
    }

    try {
      const requestParams: LocationPricingParams = {
        user_id: authResponse.localId,
        country_name: params.country,
        city_name: params.city,
        datasets: params.datasets,
        reportType: params.reportType,
      };

      const response = await reportPricingService.fetchLocationPricing(requestParams);

      if (isMountedRef.current) {
        setPrice(response.price);
        setComingSoon(response.comingSoon);

        // Notify parent of successful load
        if (params.onLoadingChange) {
          params.onLoadingChange(false, response.price !== null);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err as Error);
        setPrice(null);

        // Notify parent of error
        if (params.onLoadingChange) {
          params.onLoadingChange(false, false);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [authResponse?.localId, params.country, params.city, params.reportType, params.enabled]);

  // Fetch on mount and when dependencies change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLocationPrice();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchLocationPrice]);

  return {
    price,
    comingSoon,
    isLoading,
    error,
    refetch: fetchLocationPrice,
  };
}

// ===========================
// Hook 3: useAdditionalCost
// ===========================

export interface UseAdditionalCostParams {
  country: string | null;
  city: string | null;
  datasets: string[];
  reportTier: string;
  enabled?: boolean;
}

export interface UseAdditionalCostReturn {
  cost: number | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching additional cost for extra datasets
 * Used on the attributes step to show pricing for selected categories
 */
export function useAdditionalCost(params: UseAdditionalCostParams): UseAdditionalCostReturn {
  const { authResponse } = useAuth();
  const [cost, setCost] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchAdditionalCost = useCallback(async () => {
    // Don't calculate if no datasets or missing location
    if (!authResponse?.localId || !params.country || !params.city || params.datasets.length === 0) {
      setCost(null);
      return;
    }

    if (params.enabled === false) {
      setCost(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestParams: AdditionalCostParams = {
        user_id: authResponse.localId,
        country_name: params.country,
        city_name: params.city,
        datasets: params.datasets,
        reportTier: params.reportTier,
      };

      const additionalCost = await reportPricingService.fetchAdditionalCost(requestParams);

      if (isMountedRef.current) {
        setCost(additionalCost);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err as Error);
        setCost(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [authResponse?.localId, params.country, params.city, params.reportTier, params.enabled]);

  // Fetch on mount and when dependencies change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAdditionalCost();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchAdditionalCost]);

  return {
    cost,
    isLoading,
    error,
    refetch: fetchAdditionalCost,
  };
}

// ===========================
// Helper: Format Price
// ===========================

/**
 * Helper function to format price values
 */
export function formatPrice(value: number | null, isLoading: boolean = false): string {
  if (isLoading) {
    return '...';
  }
  if (value === null) {
    return 'N/A';
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
