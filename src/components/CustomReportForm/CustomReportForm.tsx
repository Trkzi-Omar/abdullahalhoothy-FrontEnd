import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../../services/apiRequest';
import urls from '../../urls.json';
import './CustomReportForm.css';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import {
  BusinessCategoryMetrics,
  CustomReportData,
  FormErrors,
  MetricKey,
  UserProfile,
} from '../../types/allTypesAndInterfaces';
import { ReportSubmissionRequestBody } from '../../types/reportSubmission';
import { CustomSegment, CustomSegmentReportResponse } from '../../types';
import { getTotalSteps, getInitialFormData, getStepDefinitions } from './constants';
import { useBusinessTypeConfig } from './hooks/useBusinessTypeConfig';
import { useAdditionalCost } from './hooks/useReportPricing';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import InlinePaymentMethod from './components/InlinePaymentMethod';

// Import step components
import BasicInformationStep from './components/BasicInformationStep';
import { EvaluationMetricsStep } from './components/EvaluationMetricsStep';
import CustomLocationsStep from './components/CustomLocationsStep';
import CurrentLocationStep from './components/CurrentLocationStep';
import ProgressIndicator from './components/ProgressIndicator';
import FormNavigation from './components/FormNavigation';
import SetAttributeStep from './components/AttributesStep';
import ReportTierStep from './components/ReportTierStep';
import SmartSegmentReport from '../SegmentReport';
import ReportTypeSelectionStep from './components/ReportTypeSelectionStep';
import DeliveryInStoreStep from './components/DeliveryInStoreStep';
import PhoneVerificationStep from './components/PhoneVerificationStep';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CustomReportForm = () => {
  // STEP INDEXING CONVENTION:
  // - Step 0: Report Type Selection (special case)
  // - Steps 1+: Actual form steps (1-indexed for display)
  // - Use getActualStepContent(step, reportType) to map step number to content
  // - Step definitions are 0-indexed arrays representing 1-indexed steps

  const { authResponse } = useAuth();
  const navigate = useNavigate();
  // TODO: Dynamic business type from URL params - currently disabled
  // const { businessType } = useParams<{ businessType: string }>();

  const [categories, setCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState<CustomReportData | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessCategoryMetrics | null>(null);
  const businessType = formData?.Type || 'pharmacy';

  // Fetch business type configuration from API
  const {
    config: businessConfig,
    loading: configLoading,
    error: configError,
  } = useBusinessTypeConfig(businessType);

  // New state for report type selection
  const [reportType, setReportType] = useState<'full' | 'location' | null>(null);
  const [hasUsedFreeLocationReport, setHasUsedFreeLocationReport] = useState<boolean>(false);
  const [locationPriceAvailable, setLocationPriceAvailable] = useState<boolean>(true);

  // Segment Report State
  const [segmentReportData, setSegmentReport] = useState<CustomSegmentReportResponse | null>(null);
  const [segmentReportLoading, setSegmentReportLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<CustomSegment | null>(null);
  const [segmentReportError, setSegmentReportError] = useState<boolean>(false);

  // Payment method state
  const [showPaymentMethodForm, setShowPaymentMethodForm] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<ReportSubmissionRequestBody | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  // Track if phone verification was needed at the start (to prevent dynamic step changes)
  const [needsPhoneVerificationInitial, setNeedsPhoneVerificationInitial] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Ref to track previous mode/reportType to prevent race conditions
  const prevModeRef = useRef({ isAdvancedMode, reportType });

  // Set user_id when component mounts
  useEffect(() => {
    if (authResponse && 'localId' in authResponse && formData && !formData.user_id) {
      setFormData(prev =>
        prev
          ? {
              ...prev,
              user_id: authResponse.localId,
            }
          : null
      );
    }
  }, [authResponse, formData?.user_id]);

  // Fetch user profile to check free location report status and get phone number
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authResponse?.localId) return;

      try {
        const response = await apiRequest({
          url: urls.user_profile,
          method: 'POST',
          isAuthRequest: true,
          body: { user_id: authResponse.localId },
        });

        const profile: UserProfile = response?.data?.data || response?.data;
        const hasUsedFree = profile?.has_used_free_location_report || false;
        setHasUsedFreeLocationReport(hasUsedFree);
        const phone = profile?.phone || null;
        setUserPhone(phone);
        
        // Set phone verification need based on whether phone exists
        // Check if phone is null, undefined, empty string, or just whitespace
        const needsVerification = !phone || (phone && typeof phone === 'string' && phone.trim() === '');
        setNeedsPhoneVerificationInitial(needsVerification);
        setProfileLoaded(true);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Default to false if error (user can still try to claim free report)
        setHasUsedFreeLocationReport(false);
        // If profile fetch fails, assume phone verification is needed to be safe
        setNeedsPhoneVerificationInitial(true);
        setProfileLoaded(true);
      }
    };

    fetchUserProfile();
  }, [authResponse?.localId]);

  const loadBusinessMetrics = async (businessType: string) => {
    try {
      const res = await apiRequest({
        url: `${urls.business_category_metrics}/${businessType}`,
        method: 'get',
      });
      const data = res.data?.data;
      // Only store the metrics data, don't automatically populate formData
      // Categories should be selected by user or come from selected segment
      setBusinessMetrics(data);
    } catch (error) {
      console.error('Error loading business metrics:', error);
    }
  };

  // Initialize form data when business configuration is loaded
  useEffect(() => {
    if (businessConfig) {
      const initialData = getInitialFormData(businessType, businessConfig);

      setFormData(initialData);

      // prevent fetching same type multiple times
      if (businessType != businessMetrics?.business_type) {
        loadBusinessMetrics(businessType);
      }
    }
  }, [businessConfig, businessType]);

  useEffect(() => {
    if (selectedSegment) {
      //  set evolution metrics, categories, and demographics
      // Use ONLY the segment's categories, don't combine with business metrics
      const segmentCompetition = [
        // ...(selectedSegment.attributes.competition_categories || []), // this will be removed from api
        ...(businessMetrics?.competition_categories || []),
      ];
      const segmentComplementary = [
        ...(selectedSegment.attributes.complementary_categories || []),
        ...(businessMetrics?.complementary_categories || []),
      ];
      const segmentCrossShopping = [
        ...(selectedSegment.attributes.cross_shopping_categories || []),
        ...(businessMetrics?.cross_shopping_categories || []),
      ];

      setFormData(prev =>
        prev
          ? {
              ...prev,
              evaluation_metrics: selectedSegment.attributes.evaluation_metrics,
              target_age: selectedSegment.attributes.target_age,
              target_income: selectedSegment.attributes.target_income_level,
              competition_categories: segmentCompetition,
              complementary_categories: segmentComplementary,
              cross_shopping_categories: segmentCrossShopping,
              ecosystem_string_name: selectedSegment.name,
            }
          : null
      );

      // setBusinessMetrics(prev =>
      //   prev
      //     ? {
      //         ...prev,
      //         competition_categories: segmentCompetition,
      //         complementary_categories: segmentComplementary,
      //         cross_shopping_categories: segmentCrossShopping,
      //       }
      //     : null
      // );
    }
  }, [selectedSegment, businessMetrics]);

  const handleCategoryLoad = async () => {
    try {
      const res = await apiRequest({
        url: urls.nearby_categories,
        method: 'get',
      });

      const data = res.data?.data;

      // Extract all subcategory arrays and flatten them
      const allSubcategories = Object.values(data).flat();

      // Ensure they are strings
      const subcategoryList = Array.from(
        new Set(allSubcategories.filter((item): item is string => typeof item === 'string'))
      );
      setCategories(subcategoryList);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    handleCategoryLoad();
  }, []);

  // Calculate if phone verification is needed (for display purposes)
  const needsPhoneVerification = useMemo(() => {
    // Check if user doesn't have a phone number
    return !userPhone || userPhone.trim() === '';
  }, [userPhone]);

  // Handle advanced mode toggle - adjust steps if needed
  useEffect(() => {
    if (!reportType) return;

    const prev = prevModeRef.current;
    const modeChanged = prev.isAdvancedMode !== isAdvancedMode || prev.reportType !== reportType;

    if (!modeChanged) return;

    prevModeRef.current = { isAdvancedMode, reportType };

    // Use initial phone verification need to prevent step count changes mid-flow
    const totalSteps = getTotalSteps(reportType, isAdvancedMode, needsPhoneVerificationInitial);

    // Adjust current step if it exceeds new total
    setCurrentStep(current => {
      if (current > totalSteps) {
        return totalSteps;
      }
      return current;
    });

    // Filter completed steps to only include valid steps
    setCompletedSteps(prev => prev.filter(step => step <= totalSteps));
  }, [isAdvancedMode, reportType, needsPhoneVerificationInitial]);

  // Redirect to phone verification step if needed when profile loads
  useEffect(() => {
    if (!profileLoaded || !reportType || !needsPhoneVerificationInitial || phoneVerified) return;
    
    // Get step definitions to find where phone verification step is
    const stepDefinitions = getStepDefinitions(reportType, isAdvancedMode, needsPhoneVerificationInitial);
    const phoneVerificationStepIndex = stepDefinitions.findIndex(step => step.content === 'phone-verification');
    const reportTierStepIndex = stepDefinitions.findIndex(step => step.content === 'report-tier');
    
    if (phoneVerificationStepIndex === -1) return; // Phone verification step not found
    
    const phoneVerificationStepNumber = phoneVerificationStepIndex + 1; // Convert to 1-indexed
    
    // Get current step content using the updated step definitions
    const currentStepDef = stepDefinitions[currentStep - 1];
    const currentStepContent = currentStepDef?.content || '';
    
    // If user is at Report Tier step or past phone verification step but hasn't verified, redirect them
    if (currentStepContent === 'report-tier' || 
        (currentStep >= phoneVerificationStepNumber && currentStepContent !== 'phone-verification' && reportTierStepIndex !== -1 && currentStep > reportTierStepIndex)) {
      // Redirect to phone verification step
      setCurrentStep(phoneVerificationStepNumber);
    }
  }, [profileLoaded, needsPhoneVerificationInitial, reportType, isAdvancedMode, currentStep, phoneVerified]);

  const getSegmentReport = useCallback(async () => {
    if (!formData?.city_name) return;

    setSegmentReportLoading(true);
    setSegmentReportError(false);
    try {
      const res = await apiRequest({
        url: urls.fetch_smart_segment_report,
      });

      if (res.data.data) {
        setSegmentReport(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedSegment(res.data.data[0]);
        }
      }
    } catch (error) {
      console.error(error);
      setSegmentReportError(true);
    } finally {
      setSegmentReportLoading(false);
    }
  }, [formData?.city_name]);

  const handleSegmentSelect = (segmentId: string | null) => {
    if (!segmentReportData || !segmentId) {
      setSelectedSegment(null);
      return;
    }
    const segment = segmentReportData.find(s => s.segment_id === segmentId);
    setSelectedSegment(segment || null);
  };

  useEffect(() => {
    // Load segment report when user reaches the segment selection step
    if (!reportType || !currentStep) return;

    const stepDefinitions = getStepDefinitions(reportType, isAdvancedMode);
    const stepDef = stepDefinitions[currentStep - 1];

    if (
      stepDef?.content === 'segment-selection' &&
      !segmentReportData &&
      !segmentReportLoading &&
      !segmentReportError
    ) {
      getSegmentReport();
    }
  }, [
    currentStep,
    segmentReportData,
    segmentReportLoading,
    reportType,
    isAdvancedMode,
    segmentReportError,
  ]);

  const validateForm = (): boolean => {
    if (!formData) return false;

    // Validate report type is selected
    if (!reportType) {
      setErrors(prev => ({ ...prev, report_type: 'Please select a report type' }));
      return false;
    }

    const newErrors: FormErrors = {};

    // Validate city selection
    if (!formData.city_name) {
      newErrors.city_name = 'Please select a city';
    }

    // In advanced mode, validate report tier selection
    if (isAdvancedMode && !formData.report_tier) {
      newErrors.report_tier = 'Please select a report tier';
    }

    // In advanced mode, validate evaluation metrics
    // In simple mode, users use default metrics and skip this step
    if (isAdvancedMode) {
      // Validate evaluation metrics sum to 1.0
      const metricsSum = Object.values(formData.evaluation_metrics).reduce(
        (sum, value) => sum + value,
        0
      );
      if (Math.abs(metricsSum - 1) > 0.001) {
        newErrors.evaluation_metrics = `Evaluation metrics must sum to 1.0. Current sum: ${metricsSum.toFixed(2)}`;
      }

      // Validate individual metrics are not negative
      Object.entries(formData.evaluation_metrics).forEach(([key, value]) => {
        if (value < 0) {
          newErrors[`metrics_${key}`] = `${key} cannot be negative`;
        }
      });

      // Validate delivery/dine-in weights
      const deliverySum = (formData.delivery_weight || 0) + (formData.dine_in_weight || 0);
      if (Math.abs(deliverySum - 1) > 0.001) {
        newErrors.delivery_weight = `Weights must sum to 100%`;
      }
    }

    // Current location is optional for all report types

    // Custom locations are required for location reports, optional for full reports
    if (reportType === 'location') {
      const hasValidCustomLocation = formData.custom_locations.some(
        loc => loc.lat !== 0 && loc.lng !== 0
      );
      if (!hasValidCustomLocation) {
        newErrors.custom_locations = 'Please select a location to evaluate';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Separate validation function that doesn't update state (for use during render)
  const validateFormWithoutStateUpdate = (): boolean => {
    if (!formData) return false;

    // Validate city selection
    if (!formData.city_name) {
      return false;
    }

    // In advanced mode, also validate report tier
    if (isAdvancedMode && !formData.report_tier) {
      return false;
    }

    // In advanced mode, validate evaluation metrics
    // In simple mode, users use default metrics and skip this step
    if (isAdvancedMode) {
      // Validate evaluation metrics sum to 100% (now 1.0)
      const metricsSum = Object.values(formData.evaluation_metrics).reduce(
        (sum, value) => sum + value,
        0
      );
      if (Math.abs(metricsSum - 1) > 0.001) {
        return false;
      }

      // Validate individual metrics are not negative
      const hasNegativeMetrics = Object.values(formData.evaluation_metrics).some(
        value => value < 0
      );
      if (hasNegativeMetrics) {
        return false;
      }

      // Validate delivery/dine-in weights
      const deliverySum = (formData.delivery_weight || 0) + (formData.dine_in_weight || 0);
      if (Math.abs(deliverySum - 1) > 0.001) {
        return false;
      }
    }

    // Current location is optional for all report types

    // Custom locations are required for location reports, optional for full reports
    if (reportType === 'location') {
      const hasValidCustomLocation = formData.custom_locations.some(
        loc => loc.lat !== 0 && loc.lng !== 0
      );
      if (!hasValidCustomLocation) {
        return false;
      }
    }

    return true;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : null
    );

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleMetricsChange = (metric: MetricKey, value: number) => {
    setFormData(prev =>
      prev
        ? {
            ...prev,
            evaluation_metrics: {
              ...prev.evaluation_metrics,
              [metric]: value,
            },
          }
        : null
    );

    // Clear metrics error when user changes values
    if (errors.evaluation_metrics) {
      setErrors(prev => ({
        ...prev,
        evaluation_metrics: '',
      }));
    }
  };

  const handleAttributeChange = (key: string, value: number) => {
    setFormData(prev =>
      prev
        ? {
            ...prev,
            [key]: value,
          }
        : null
    );
  };

  // Handle location report price loading state changes
  const handlePriceLoadingChange = useCallback((isLoading: boolean, priceAvailable: boolean) => {
    setLocationPriceAvailable(priceAvailable);
  }, []);

  // Determine if we're on the attributes step
  const stepDefinitions = reportType ? getStepDefinitions(reportType, isAdvancedMode) : [];
  const stepDef = stepDefinitions[currentStep - 1];
  const isAttributesStep = stepDef?.content === 'attributes';

  // Collect all selected datasets from categories (memoized to prevent infinite loops)
  const allDatasets = useMemo(() => {
    const datasets: string[] = [];
    if (formData?.complementary_categories) {
      datasets.push(...formData.complementary_categories);
    }
    if (formData?.competition_categories) {
      datasets.push(...formData.competition_categories);
    }
    if (formData?.cross_shopping_categories) {
      datasets.push(...formData.cross_shopping_categories);
    }
    return datasets;
  }, [
    formData?.complementary_categories,
    formData?.competition_categories,
    formData?.cross_shopping_categories,
  ]);

  // Use the new pricing hook for additional cost calculation
  const { cost: additionalCost, isLoading: isCalculatingCost } = useAdditionalCost({
    country: formData?.country_name || null,
    city: formData?.city_name || null,
    datasets: allDatasets,
    reportTier:
      reportType === 'location' ? 'single_location_premium' : formData?.report_tier || 'premium',
    report_potential_business_type: formData?.Type,
    enabled: isAttributesStep && allDatasets.length > 0,
  });

  const addCustomLocation = () => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      custom_locations: [...prev!.custom_locations, { lat: 0, lng: 0, properties: { price: 0 } }],
    }));
  };

  const removeCustomLocation = (index: number) => {
    if (!formData || formData.custom_locations.length <= 1) return;
    setFormData(prev => ({
      ...prev!,
      custom_locations: prev!.custom_locations.filter((_, i) => i !== index),
    }));
  };

  // Memoized callback for custom location selection
  const handleCustomLocationSelect = useCallback(
    (
      index: number,
      newLocation:
        | { lat: number; lng: number }
        | { lat: number; lng: number; properties?: { price?: number } }
    ) => {
      setFormData(prev =>
        prev
          ? {
              ...prev,
              custom_locations: prev.custom_locations.map((loc, i) =>
                i === index
                  ? {
                      ...newLocation,
                      properties: {
                        price: (newLocation as any).properties?.price ?? loc.properties?.price ?? 0,
                      },
                    }
                  : loc
              ),
            }
          : null
      );

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
    [] // Empty deps OK: uses functional setState, no external dependencies
  );

  // Memoized callback for current location selection
  const handleCurrentLocationSelect = useCallback(
    (
      newLocation:
        | { lat: number; lng: number }
        | { lat: number; lng: number; properties?: { price?: number; avg_order_value?: number } }
    ) => {
      setFormData(prev =>
        prev
          ? {
              ...prev,
              current_location: {
                ...newLocation,
                properties: {
                  price:
                    (newLocation as any).properties?.price ??
                    prev.current_location?.properties?.price ??
                    0,
                  avg_order_value:
                    (newLocation as any).properties?.avg_order_value ??
                    prev.current_location?.properties?.avg_order_value ??
                    30,
                },
              },
            }
          : null
      );

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
    },
    [] // Empty deps OK: uses functional setState, no external dependencies
  );

  const handleSubmit = async () => {
    if (!formData || !validateForm()) {
      return;
    }

    // Additional safety check for report type
    if (!reportType) {
      setSubmitError('Please select a report type before submitting');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare form data with default values for optional locations
      const submissionData: ReportSubmissionRequestBody = {
        user_id: formData.user_id,
        city_name: formData.city_name,
        country_name: formData.country_name,
        potential_business_type: formData.potential_business_type || businessType,
        target_income_level: formData.target_income_level,
        target_age: formData.target_age,
        complementary_categories: formData.complementary_categories,
        cross_shopping_categories: formData.cross_shopping_categories,
        competition_categories: formData.competition_categories,
        delivery_weight: formData.delivery_weight,
        dine_in_weight: formData.dine_in_weight,
        custom_locations: formData.custom_locations.map(loc => ({
          lat: loc.lat || 0,
          lng: loc.lng || 0,
          properties: {
            price: loc.properties?.price || 0,
          },
        })),
        current_location: {
          lat: formData.current_location.lat || 0,
          lng: formData.current_location.lng || 0,
          properties: {
            price: formData.current_location.properties?.price || 0,
            avg_order_value: formData.current_location.properties?.avg_order_value || 30,
          },
        },
        single_location: reportType === 'location',
        report_tier:
          reportType === 'location' ? 'single_location_premium' : formData.report_tier || 'premium',
      };

      const reportUrl = urls.smart_site_report;

      const res = await apiRequest({
        url: reportUrl,
        method: 'Post',
        body: submissionData,
      });

      // Check if we have a report URL to redirect to
      // API response format: res.data.data.metadata.html_file_path
      const reportUrlResponse = res?.data?.data?.html_file_path;

      // Update free report status for location reports
      if (reportType === 'location' && !hasUsedFreeLocationReport) {
        // The backend should have updated the flag
        // Refresh it locally to reflect new state
        setHasUsedFreeLocationReport(true);
      }

      // Redirect to the report URL immediately
      if (reportUrlResponse) {
        //window.location.href = reportUrlResponse;
        navigate(`/${reportUrlResponse.replace(/^\/+/, '')}`);
      } else {
        // Fallback to home if no URL at all
        navigate('/');
      }
    } catch (error: any) {
      // Extract error message from various error formats
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {
          response?: { data?: { message?: string; detail?: string; error?: string } | string };
        };
        const errorData = apiError.response?.data;
        
        if (errorData && typeof errorData === 'object') {
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message.replace(/\s*\(Status:\s*\d+\)/g, '');
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Check if error is related to PaymentIntent missing payment method
      // This handles various error message formats
      const isPaymentIntentError = 
        (errorMessage.includes('PaymentIntent') || errorMessage.includes('payment method')) && 
        (errorMessage.includes('missing a payment method') || 
         errorMessage.includes('missing payment method') ||
         errorMessage.includes('You cannot confirm this PaymentIntent'));
      
      if (isPaymentIntentError) {
        // Store submission data for retry after payment method is added
        setPendingSubmission(submissionData);
        // Show payment method form instead of error
        setShowPaymentMethodForm(true);
        setSubmitError(null);
      } else {
        setSubmitError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry submission after payment method is added
  const retrySubmission = useCallback(async () => {
    if (!pendingSubmission) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setShowPaymentMethodForm(false);

    try {
      const res = await apiRequest({
        url: urls.smart_site_report,
        method: 'Post',
        body: pendingSubmission,
      });

      const reportUrlResponse = res?.data?.data?.html_file_path;

      // Update free report status for location reports
      if (reportType === 'location' && !hasUsedFreeLocationReport) {
        setHasUsedFreeLocationReport(true);
      }

      // Redirect to the report URL immediately
      if (reportUrlResponse) {
        navigate(`/${reportUrlResponse.replace(/^\/+/, '')}`);
      } else {
        navigate('/');
      }
    } catch (error: any) {
      // Extract error message from various error formats
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {
          response?: { data?: { message?: string; detail?: string; error?: string } | string };
        };
        const errorData = apiError.response?.data;
        
        if (errorData && typeof errorData === 'object') {
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message.replace(/\s*\(Status:\s*\d+\)/g, '');
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Check if error is still related to PaymentIntent
      const isPaymentIntentError = 
        (errorMessage.includes('PaymentIntent') || errorMessage.includes('payment method')) && 
        (errorMessage.includes('missing a payment method') || 
         errorMessage.includes('missing payment method') ||
         errorMessage.includes('You cannot confirm this PaymentIntent'));
      
      if (isPaymentIntentError) {
        // Keep payment method form visible
        setShowPaymentMethodForm(true);
        setSubmitError(null);
      } else {
        setSubmitError(errorMessage);
        setShowPaymentMethodForm(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [pendingSubmission, reportType, hasUsedFreeLocationReport, navigate]);

  const metricsSum = formData
    ? Object.values(formData.evaluation_metrics).reduce((sum, value) => sum + value, 0)
    : 0;

  const validateCurrentStep = (step: number): boolean => {
    if (!formData) return false;
    if (step === 0) return true; // Step 0 (report type selection) always valid

    const actualStep = getActualStepContent(step, reportType);

    switch (actualStep) {
      case 'basic-info':
        return !!formData.city_name;

      case 'current-location':
        // Optional for both report types
        return true;

      case 'evaluation-metrics':
        return (
          Math.abs(metricsSum - 1) < 0.001 &&
          Object.values(formData.evaluation_metrics).every(v => v >= 0)
        );

      case 'delivery-in-store':
        const deliverySum = (formData.delivery_weight || 0) + (formData.dine_in_weight || 0);
        return Math.abs(deliverySum - 1) < 0.001;

      case 'custom-locations':
        // Required for location reports, optional for full reports
        if (reportType === 'location') {
          // At least one valid custom location is required
          return formData.custom_locations.some(loc => loc.lat !== 0 && loc.lng !== 0);
        }
        return true; // Optional for full reports

      case 'attributes':
        return true; // Always optional

      case 'segment-selection':
        return true; // Always optional

      case 'phone-verification':
        // Phone verification step is valid only if phone has been verified
        return phoneVerified;

      case 'report-tier':
        // For location reports, ensure pricing is available
        if (reportType === 'location') {
          return locationPriceAvailable;
        }
        // In advanced mode, report tier is required
        // In simple mode, we use backend default, so it's optional
        return isAdvancedMode ? !!formData.report_tier : true;

      default:
        return false;
    }
  };

  const goToNextStep = () => {
    // Prevent advancing from step 0 without selecting report type
    if (currentStep === 0 && !reportType) {
      setSubmitError('Please select a report type to continue');
      return;
    }

    if (validateCurrentStep(currentStep)) {
      const nextStep = currentStep + 1;
      const totalSteps = getTotalSteps(reportType, isAdvancedMode, needsPhoneVerificationInitial);
      
      // If profile hasn't loaded yet and we're about to go to what might be the last step, wait
      if (!profileLoaded && nextStep >= totalSteps - 1) {
        // Don't advance yet, wait for profile to load
        return;
      }
      
      // Check if next step would be Report Tier and phone verification is needed but not completed
      if (needsPhoneVerificationInitial && !phoneVerified) {
        const stepDefinitions = getStepDefinitions(reportType, isAdvancedMode, needsPhoneVerificationInitial);
        const nextStepDef = stepDefinitions[nextStep - 1]; // nextStep is 1-indexed, array is 0-indexed
        const reportTierStepDef = stepDefinitions.find(step => step.content === 'report-tier');
        
        // If next step is Report Tier and phone isn't verified, redirect to phone verification
        if (nextStepDef?.content === 'report-tier' || (reportTierStepDef && nextStep > stepDefinitions.indexOf(reportTierStepDef) + 1)) {
          const phoneVerificationStepIndex = stepDefinitions.findIndex(step => step.content === 'phone-verification');
          if (phoneVerificationStepIndex !== -1) {
            setCurrentStep(phoneVerificationStepIndex + 1); // Convert to 1-indexed
            return;
          }
        }
      }
      
      setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep]);
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const goToPreviousStep = () => {
    const newStep = currentStep - 1;

    // If navigating back to Step 0, reset report type
    if (newStep === 0) {
      setReportType(null);
    }

    setCurrentStep(Math.max(newStep, 0));
  };

  const goToStep = (step: number) => {
    // Prevent navigating to Report Tier if phone verification is needed but not completed
    if (needsPhoneVerificationInitial && !phoneVerified && reportType) {
      const stepDefinitions = getStepDefinitions(reportType, isAdvancedMode, needsPhoneVerificationInitial);
      const targetStepDef = stepDefinitions[step - 1]; // step is 1-indexed, array is 0-indexed
      const reportTierStepDef = stepDefinitions.find(s => s.content === 'report-tier');
      
      // If trying to navigate to Report Tier or past it, redirect to phone verification
      if (targetStepDef?.content === 'report-tier' || (reportTierStepDef && step > stepDefinitions.indexOf(reportTierStepDef) + 1)) {
        const phoneVerificationStepIndex = stepDefinitions.findIndex(s => s.content === 'phone-verification');
        if (phoneVerificationStepIndex !== -1) {
          setCurrentStep(phoneVerificationStepIndex + 1); // Convert to 1-indexed
          return;
        }
      }
    }
    
    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step);
    }
  };

  const handleReportTypeSelect = (type: 'full' | 'location') => {
    setReportType(type);
    setCurrentStep(1); // Move to first actual step
  };

  // Helper function to map step numbers to actual step content based on report type and advanced mode
  // @param step - 1-indexed step number (0 = report type selection, 1+ = form steps)
  // @param reportType - The selected report type
  // @returns The step content identifier (e.g., 'basic-info', 'evaluation-metrics')
  const getActualStepContent = (step: number, reportType: 'full' | 'location' | null): string => {
    if (step === 0) return 'report-type-selection';
    if (!reportType) return '';

    // Get filtered step definitions based on advanced mode and phone verification needs
    // Use initial phone verification need to prevent step changes mid-flow
    const stepDefinitions = getStepDefinitions(reportType, isAdvancedMode, needsPhoneVerificationInitial);
    const stepDef = stepDefinitions[step - 1]; // Convert 1-indexed step to 0-indexed array

    return stepDef?.content || '';
  };

  const renderCurrentStep = () => {
    if (!formData) return null;

    const actualStepContent = getActualStepContent(currentStep, reportType);

    switch (actualStepContent) {
      case 'report-type-selection':
        return (
          <ReportTypeSelectionStep
            onSelectReportType={handleReportTypeSelect}
            disabled={isSubmitting}
            selectedReportType={reportType}
          />
        );

      case 'basic-info':
        return (
          <BasicInformationStep
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            businessConfig={businessConfig}
            isAdvancedMode={isAdvancedMode}
            onToggleAdvancedMode={setIsAdvancedMode}
            disabled={isSubmitting}
            categories={categories}
          />
        );

      case 'segment-selection':
        if (segmentReportError) {
          return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-center shadow-sm border border-red-100">
                <FaExclamationTriangle className="mr-3 h-5 w-5" />
                <span className="font-medium">Failed to load segment report.</span>
              </div>
              <button
                onClick={getSegmentReport}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
              >
                Retry
              </button>
            </div>
          );
        }
        return (
          <SmartSegmentReport
            segmentReportData={segmentReportData}
            segmentReportLoading={segmentReportLoading}
            selectedSegment={selectedSegment}
            onSegmentSelect={handleSegmentSelect}
          />
        );

      case 'evaluation-metrics':
        return (
          <EvaluationMetricsStep
            formData={formData}
            errors={errors}
            onMetricsChange={handleMetricsChange}
            businessType={businessType}
            businessConfig={businessConfig}
            disabled={isSubmitting}
          />
        );

      case 'delivery-in-store':
        return (
          <DeliveryInStoreStep
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            disabled={isSubmitting}
          />
        );

      case 'attributes':
        return (
          <SetAttributeStep
            onInputChange={handleAttributeChange}
            inputCategories={categories}
            formData={formData}
          />
        );

      case 'custom-locations':
        return (
          <CustomLocationsStep
            formData={formData}
            errors={errors}
            onAddCustomLocation={addCustomLocation}
            onRemoveCustomLocation={removeCustomLocation}
            onCustomLocationSelect={handleCustomLocationSelect}
            businessConfig={businessConfig}
            disabled={isSubmitting}
            isRequired={reportType === 'location'}
          />
        );

      case 'current-location':
        return (
          <CurrentLocationStep
            formData={formData}
            errors={errors}
            onLocationSelect={handleCurrentLocationSelect}
            businessType={businessType}
            businessConfig={businessConfig}
            disabled={isSubmitting}
            isRequired={false}
            reportType={reportType || undefined}
          />
        );

      case 'phone-verification':
        return (
          <PhoneVerificationStep
            onVerificationSuccess={async (verifiedPhoneNumber: string) => {
              // Update user phone in profile after successful verification
              if (!authResponse?.localId) return;
              
              try {
                // First fetch current profile to get all required fields
                const profileResponse = await apiRequest({
                  url: urls.user_profile,
                  method: 'POST',
                  isAuthRequest: true,
                  body: { user_id: authResponse.localId },
                });
                
                const currentProfile: UserProfile = profileResponse?.data?.data || profileResponse?.data;
                
                // Save the verified phone number to user profile with all required fields
                await apiRequest({
                  url: urls.update_user_profile,
                  method: 'POST',
                  isAuthRequest: true,
                  body: {
                    user_id: authResponse.localId,
                    phone: verifiedPhoneNumber,
                    username: currentProfile.username || '',
                    email: currentProfile.email || '',
                    show_price_on_purchase: currentProfile.show_price_on_purchase || false,
                  },
                });
                
                // Update local state
                setUserPhone(verifiedPhoneNumber);
                setPhoneVerified(true);
                
                // Mark current step as completed
                setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep]);
                
                // Automatically proceed to next step (use a small delay to ensure state updates)
                setTimeout(() => {
                  goToNextStep();
                }, 300);
              } catch (error) {
                console.error('Error updating user profile with phone number:', error);
                // Still mark as verified and proceed, as OTP verification succeeded
                setPhoneVerified(true);
                setUserPhone(verifiedPhoneNumber);
                setTimeout(() => {
                  goToNextStep();
                }, 500);
              }
            }}
            disabled={isSubmitting}
          />
        );

      case 'report-tier':
        return (
          <ReportTierStep
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isSubmitting}
            reportType={reportType || undefined}
            hasUsedFreeLocationReport={hasUsedFreeLocationReport}
            isAdvancedMode={isAdvancedMode}
            onPriceLoadingChange={handlePriceLoadingChange}
          />
        );

      default:
        return null;
    }
  };

  // Show loading state while fetching business configuration
  if (configLoading) {
    return (
      <main className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            {/* Modern animated loading spinner */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
              <div
                className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-400 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
              ></div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">Preparing Your Report</h2>
            <p className="text-gray-600 mb-4">
              Setting up the form for your {businessType} location analysis...
            </p>

            {/* Loading dots animation */}
            <div className="flex justify-center space-x-1">
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show error state if configuration failed to load
  if (configError) {
    const isNotSupportedError = configError.includes('not yet supported');

    return (
      <main className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div
            className={`border rounded-lg p-6 ${isNotSupportedError ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}
          >
            <FaExclamationTriangle
              className={`w-8 h-8 mx-auto mb-4 ${isNotSupportedError ? 'text-orange-500' : 'text-red-500'}`}
            />
            <h2
              className={`text-xl font-semibold mb-2 ${isNotSupportedError ? 'text-orange-900' : 'text-red-900'}`}
            >
              {isNotSupportedError ? 'Business Type Not Available' : 'Configuration Error'}
            </h2>
            <p className={`mb-4 ${isNotSupportedError ? 'text-orange-700' : 'text-red-700'}`}>
              {configError}
            </p>
            <button
              onClick={() => navigate(-1)}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                isNotSupportedError
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Don't render form until we have both config and formData
  if (!businessConfig || !formData) {
    return (
      <main className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            {/* Modern animated loading spinner */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
              <div
                className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-400 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
              ></div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">Almost Ready</h2>
            <p className="text-gray-600 mb-4">Finalizing your {businessType} report setup...</p>

            {/* Loading dots animation */}
            <div className="flex justify-center space-x-1">
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex justify-center items-start bg-gradient-to-br from-slate-50 to-blue-50 py-2 px-2 sm:py-4 sm:px-4">
      <div className="w-[85vw] max-h-[90dvh] m-auto flex flex-col">
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="bg-gem-gradient px-4 py-3 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center px-2 py-1.5 text-xs font-medium text-white bg-white/20 backdrop-blur-sm border border-white/30 rounded-md hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200"
              >
                <FaArrowLeft className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="text-center flex-1">
                <h1 className="text-lg font-bold">
                  {reportType === 'location'
                    ? 'Evaluate Your Location'
                    : reportType === 'full'
                      ? 'Full Expansion Report'
                      : 'Location Expansion Report'}
                </h1>
              </div>
              <div className="w-16"></div> {/* Spacer for centering */}
            </div>
          </div>

          {/* Progress Indicator - Show when user has selected a report type (step 1+) */}
          {currentStep > 0 && reportType && (
            <div className="flex-shrink-0">
              <ProgressIndicator
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={goToStep}
                disabled={isSubmitting}
                reportType={reportType || undefined}
                isAdvancedMode={isAdvancedMode}
                needsPhoneVerification={needsPhoneVerificationInitial}
              />
            </div>
          )}

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <form className="space-y-4">
              {/* Current Step Content */}
              {renderCurrentStep()}

              {/* Processing Status */}
              {isSubmitting && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-blue-600 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          Generating your {businessType} report...
                        </p>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                          ~3 - 15 min
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Report Generation in progress. You can always find the report link in your profile under reports section.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method Form - Show when PaymentIntent error detected */}
              {showPaymentMethodForm && (
                <div className="mb-4">
                  <Elements stripe={stripePromise}>
                    <InlinePaymentMethod
                      onPaymentMethodAdded={retrySubmission}
                      onCancel={() => {
                        setShowPaymentMethodForm(false);
                        setPendingSubmission(null);
                        setSubmitError(null);
                      }}
                      userPhone={userPhone}
                    />
                  </Elements>
                </div>
              )}

              {/* Submit Error - Only show if not showing payment method form */}
              {submitError && !showPaymentMethodForm && (
                <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-3 flex-1">
                      {submitError.includes('|') ? (
                        <>
                          <h3 className="text-sm font-semibold text-red-800 mb-1">
                            {submitError.split('|')[0]}
                          </h3>
                          <p className="text-sm text-red-700">{submitError.split('|')[1]}</p>
                        </>
                      ) : (
                        <p className="text-sm font-medium">{submitError}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Cost Message for Attributes Step */}
              {(() => {
                const isAttributesStep =
                  getActualStepContent(currentStep, reportType) === 'attributes';
                return (
                  isAttributesStep &&
                  additionalCost !== null &&
                  additionalCost > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-center">
                        {isCalculatingCost ? (
                          <div className="flex items-center text-blue-700">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span className="text-sm font-medium">
                              Calculating additional cost...
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-blue-800">
                            +${additionalCost.toFixed(2)} for extra datasets
                          </p>
                        )}
                      </div>
                    </div>
                  )
                );
              })()}
            </form>
          </div>

          {/* Footer with Navigation Buttons - Hide at Step 0 (report type selection) */}
          {formData && currentStep > 0 && (
            <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
              <FormNavigation
                currentStep={currentStep}
                isSubmitting={isSubmitting}
                onPreviousStep={goToPreviousStep}
                onNextStep={goToNextStep}
                onSubmit={handleSubmit}
                validateCurrentStep={validateCurrentStep}
                validateForm={validateFormWithoutStateUpdate}
                formData={formData}
                reportType={reportType || undefined}
                isAdvancedMode={isAdvancedMode}
                needsPhoneVerification={needsPhoneVerificationInitial}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default CustomReportForm;
