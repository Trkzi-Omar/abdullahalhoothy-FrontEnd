import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { PharmacyReportData, FormErrors, MetricKey } from '../types';
import { INITIAL_FORM_DATA } from '../constants';

export const usePharmacyForm = () => {
  const { authResponse } = useAuth();
  const [formData, setFormData] = useState<PharmacyReportData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Set user_id when component mounts
  useEffect(() => {
    if (authResponse && 'localId' in authResponse) {
      setFormData(prev => ({
        ...prev,
        user_id: authResponse.localId,
      }));
    }
  }, [authResponse]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate city selection
    if (!formData.city_name) {
      newErrors.city_name = 'Please select a city';
    }

    // Validate evaluation metrics sum to 100%
    const metricsSum = Object.values(formData.evaluation_metrics).reduce(
      (sum, value) => sum + value,
      0
    );
    if (metricsSum !== 100) {
      newErrors.evaluation_metrics = `Evaluation metrics must sum to 100%. Current sum: ${metricsSum}%`;
    }

    // Validate individual metrics are not negative
    Object.entries(formData.evaluation_metrics).forEach(([key, value]) => {
      if (value < 0) {
        newErrors[`metrics_${key}`] = `${key} cannot be negative`;
      }
    });

    // Custom locations and current location are optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[field]) {
        return {
          ...prev,
          [field]: '',
        };
      }
      return prev;
    });
  }, []);

  const handleMetricsChange = useCallback((metric: MetricKey, value: number) => {
    setFormData(prev => ({
      ...prev,
      evaluation_metrics: {
        ...prev.evaluation_metrics,
        [metric]: value,
      },
    }));

    // Clear metrics error when user changes values
    setErrors(prev => {
      if (prev.evaluation_metrics) {
        return {
          ...prev,
          evaluation_metrics: '',
        };
      }
      return prev;
    });
  }, []);

  const addCustomLocation = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      custom_locations: [...prev.custom_locations, { lat: 0, lng: 0 }],
    }));
  }, []);

  const removeCustomLocation = useCallback(
    (index: number) => {
      if (formData.custom_locations.length > 1) {
        setFormData(prev => ({
          ...prev,
          custom_locations: prev.custom_locations.filter((_, i) => i !== index),
        }));
      }
    },
    [formData.custom_locations.length]
  );

  const handleCustomLocationSelect = useCallback(
    (index: number, newLocation: { lat: number; lng: number }) => {
      setFormData(prev => ({
        ...prev,
        custom_locations: prev.custom_locations.map((loc, i) => (i === index ? newLocation : loc)),
      }));

      // Clear location error when user changes values
      setErrors(prev => {
        if (prev[`custom_location_${index}`]) {
          return {
            ...prev,
            [`custom_location_${index}`]: '',
          };
        }
        return prev;
      });
    },
    []
  );

  const handleCurrentLocationSelect = useCallback((newLocation: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      current_location: newLocation,
    }));

    // Clear current location error when user changes values
    setErrors(prev => {
      if (prev.current_location) {
        return {
          ...prev,
          current_location: '',
        };
      }
      return prev;
    });
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    submitError,
    setSubmitError,
    setIsSubmitting,
    validateForm,
    handleInputChange,
    handleMetricsChange,
    addCustomLocation,
    removeCustomLocation,
    handleCustomLocationSelect,
    handleCurrentLocationSelect,
  };
};
