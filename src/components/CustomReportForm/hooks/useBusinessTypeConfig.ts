import { useState, useEffect } from 'react';
import { businessMetricsService, BusinessTypeConfig } from '../services/businessMetricsService';

interface UseBusinessTypeConfigReturn {
  config: BusinessTypeConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useBusinessTypeConfig = (businessType: string): UseBusinessTypeConfigReturn => {
  const [config, setConfig] = useState<BusinessTypeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    if (!businessType) return;

    setLoading(true);
    setError(null);

    try {
      const businessConfig = await businessMetricsService.fetchBusinessTypeConfig(businessType);
      setConfig(businessConfig);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load business type configuration';
      setError(errorMessage);
      console.error('Error loading business type config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [businessType]);

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
  };
};
