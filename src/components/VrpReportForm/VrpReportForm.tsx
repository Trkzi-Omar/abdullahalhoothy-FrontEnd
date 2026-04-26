import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../../services/apiRequest';
import urls from '../../urls.json';

import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import {
  BusinessCategoryMetrics,
  CustomReportData,
  FormErrors,
  UserProfile,
} from '../../types/allTypesAndInterfaces';
import { ReportSubmissionRequestBody } from '../../types/reportSubmission';
import { CustomSegment, CustomSegmentReportResponse } from '../../types';
import { getTotalSteps, getInitialFormData, getStepDefinitions } from './constants';
import { useBusinessTypeConfig } from './hooks/useBusinessTypeConfig';
import { useAdditionalCost } from './hooks/useReportPricing';

// Import step components
import BasicInformationStep from './components/BasicInformationStep';
import SetAttributeStep from './components/AttributesStep';
import { formatBusinessTypeForApi } from './utils/businessTypeApi';

import {toLonLat} from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import Control from 'ol/control/Control';
import Draw from 'ol/interaction/Draw';
import {Stroke, Circle, Fill, Style} from 'ol/style';
import {defaults as defaultControls } from 'ol/control/defaults';
import { useMap, Map, View, TileLayer, VectorLayer } from 'react-openlayers';
import 'react-openlayers/dist/index.css';
import { t } from '../../i18n';

const DRAW_CONTROL_STYLE = `
.draw-control { top: 65px; inset-inline-start: .5em; }
.draw-control-S { top: 95px; inset-inline-start: .5em; }
.draw-control-E { top: 125px; inset-inline-start: .5em; }
.draw-control-active > button { outline: 1px solid black; }
`;

type FormInputValue = CustomReportData[keyof CustomReportData];

type ApiErrorShape = {
  response?: {
    data?: { message?: string; detail?: string; error?: string } | string;
  };
  message?: string;
};

const extractErrorMessage = (error: unknown): string => {
  let errorMessage = t("an-unexpected-error-occurred-please-try-again");

  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as ApiErrorShape;
    const errorData = apiError.response?.data;

    if (errorData && typeof errorData === 'object') {
      errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
    } else if (typeof errorData === 'string') {
      errorMessage = errorData;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message.replace(/\s*\(Status:\s*\d+\)/g, '');
  }

  return errorMessage;
};

const isPaymentIntentErrorMessage = (errorMessage: string): boolean =>
  (errorMessage.includes('PaymentIntent') || errorMessage.includes('payment method')) &&
  (errorMessage.includes('missing a payment method') ||
    errorMessage.includes('missing payment method') ||
    errorMessage.includes('You cannot confirm this PaymentIntent'));


class DrawControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options?: { letter?: string; target?: HTMLElement }) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = options.letter;

    const element = document.createElement('div');
    element.className = 'draw-control ol-unselectable ol-control draw-control-'+options.letter;
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', function() {
    	Array.from(document.querySelectorAll(".draw-control-active"))
	    	.forEach(v => element !== v && v.classList.toggle("draw-control-active"));
    	element.classList.toggle("draw-control-active");
    	button.dispatchEvent(new CustomEvent("toggleDraw", {bubbles: true}))
    }, false);
  }
}

const drawStyle = new Style({
	stroke: new Stroke({color: "yellow"}),
	fill: new Fill({color: "#FFFFFF7F"}),
	image: new Circle({
		stroke: new Stroke({color: "yellow"}),
		fill: new Fill({color: "#FFFFFF7F"}),
		radius: 5,
	}),
})
const startStyle = new Style({
	stroke: new Stroke({color: "cyan"}),
	fill: new Fill({color: "#FFFFFF7F"}),
	image: new Circle({
		stroke: new Stroke({color: "cyan"}),
		fill: new Fill({color: "#FFFFFF7F"}),
		radius: 5,
	}),
})
const endStyle = new Style({
	stroke: new Stroke({color: "magenta"}),
	fill: new Fill({color: "#FFFFFF7F"}),
	image: new Circle({
		stroke: new Stroke({color: "magenta"}),
		fill: new Fill({color: "#FFFFFF7F"}),
		radius: 5,
	}),
});

type VrpMapDrawProps = {
  source: VectorSource;
  handleInputChange: (field: string, value: FormInputValue) => void;
};

const VrpMapDraw = ({source, handleInputChange}: VrpMapDrawProps) => {
  const map = useMap();
  const [drawers] = useState(() => [
	  new Draw({
	  	source: source,
			type: "Polygon",
			freehand: true,
			geometryName: "draw",
			style: drawStyle,
	  }),
		new Draw({
	  	source: source,
			type: "Point",
			geometryName: "start",
			style: startStyle,
	  }),
		new Draw({
	  	source: source,
			type: "Point",
			geometryName: "end",
			style: endStyle,
	  }),
  ]);
  const [draw, setDraw] = useState(0);
  useEffect(() => {
  	drawers.map(v => {
	  	v.addEventListener("drawend", (ev) => {
	  		const e = ev.target;
	  		if(e.geometryName_ === "draw") {
		  		const tmpCoords = ev.feature.getGeometry().getCoordinates()[0]
			  		.map(v => toLonLat(v));
		  		handleInputChange("polygon", {
			      "type": "Feature",
			      "properties": {},
			      "geometry": {
			        "coordinates": [[tmpCoords]],
			      }
		      });
	      } else {
		  		const tmpCoords = toLonLat(ev.feature.getGeometry().getCoordinates());
		  		handleInputChange(e.geometryName_, tmpCoords);
	      }
	  	})
	  	
		  v.addEventListener("drawstart", (ev) => {
		  	const e = ev.target;
	      source.getFeatures().filter(v => v.geometryName_ === e.geometryName_)
		      .map(v => source.removeFeature(v));
		  	// source.clear();
		  	return true
		  });
  	});
  }, [drawers, handleInputChange, source]);
  useEffect(() => {
  	if(!map) return;
  	// [drawClass, drawPointClass].map(draw ? map.addInteraction : map.removeInteraction);
  	drawers.map(v => map.removeInteraction(v)); 
  	if(draw > 0)
	  	map.addInteraction(drawers[draw-1]);
  	map.targetElement_.addEventListener("toggleDraw", (e) => {
  		const letter = e.target.innerText;
  		if(letter === "P")
	  		setDraw(draw === 1 ? 0 : 1)
	  	else if(letter === "S")
	  		setDraw(draw === 2 ? 0 : 2)
	  	else if(letter === "E")
	  		setDraw(draw === 3 ? 0 : 3);
  	})
  }, [draw, drawers, map]);
  return 
};

const VrpMap = ({handleInputChange}: { handleInputChange: VrpMapDrawProps['handleInputChange'] }) => {
  const mapRef = useRef();
  const drawSource = new VectorSource({wrapX: false});
	return (
		<>
		<style>{DRAW_CONTROL_STYLE}</style>
	  <Map ref={mapRef} controls={defaultControls().extend(["P", "S", "E"].map(v => new DrawControl({
	  	'letter': v,
	  })))}>
	    <TileLayer source={new OSM()} />
	    <VectorLayer 
	      source={drawSource}
	      style={(feature) => {
	      	const name = feature.geometryName_;
	      	if(name === "draw")
	      		return drawStyle;
	      	else if(name === "start")
	      	 	return startStyle;
	      	else if(name === "end")
	      	 	return endStyle;
	      }}
	    />
	    <VrpMapDraw source={drawSource} handleInputChange={handleInputChange} />
	    <View center={[0, 0]} zoom={4}/>
	  </Map>
	  </>
  )
};

const formDataKeys = ["start", "end", "polygon", "country_name", "city_name"];
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
  useEffect(() => {
  	if(!formData) return;
  	const obj = {};
  	formDataKeys.map(v =>
  		obj[v] = formData[v]);
  	obj["excluded_categories"] = formData["complementary_categories"];
  	obj["category"] = formData["Type"];
  	console.log(obj);
  }, [formData]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setCompletedSteps] = useState<number[]>([]);
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
  const [reportType] = useState<'full' | 'location' | null>(null);
  const [hasUsedFreeLocationReport, setHasUsedFreeLocationReport] = useState<boolean>(false);

  // Segment Report State
  const [segmentReportData, setSegmentReport] = useState<CustomSegmentReportResponse | null>(null);
  const [segmentReportLoading, setSegmentReportLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<CustomSegment | null>(null);
  const [segmentReportError, setSegmentReportError] = useState<boolean>(false);

  // Payment method state
  const [showPaymentMethodForm, setShowPaymentMethodForm] = useState(false);
  const [, setPendingSubmission] = useState<ReportSubmissionRequestBody | null>(null);
  const [phoneVerified] = useState(false);
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
  }, [authResponse, formData]);

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

  const loadBusinessMetrics = useCallback(async (businessTypeValue: string) => {
    try {
      const res = await apiRequest({
        url: `${urls.business_category_metrics}/${businessTypeValue}`,
        method: 'get',
      });
      const data = res.data?.data;
      // Only store the metrics data, don't automatically populate formData
      // Categories should be selected by user or come from selected segment
      setBusinessMetrics(data);
    } catch (error) {
      console.error('Error loading business metrics:', error);
    }
  }, []);

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
  }, [businessConfig, businessType, businessMetrics?.business_type, loadBusinessMetrics]);

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

  const handleCategoryLoad = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    handleCategoryLoad();
  }, [handleCategoryLoad]);


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
    getSegmentReport,
  ]);

  const validateForm = useCallback((): boolean => {
    if (!formData) return false;

    // Validate report type is selected
    if (!reportType) {
      setErrors(prev => ({ ...prev, report_type: t("please-select-a-report-type") }));
      return false;
    }

    const newErrors: FormErrors = {};

    // Validate city selection
    if (!formData.city_name) {
      newErrors.city_name = t("please-select-a-city");
    }

    if (!formData.Type?.trim()) {
      newErrors.Type = t("please-select-or-enter-a-business-type");
    }

    // In advanced mode, validate report tier selection
    if (isAdvancedMode && !formData.report_tier) {
      newErrors.report_tier = t("please-select-a-report-tier");
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
        newErrors.evaluation_metrics = t("evaluation-metrics-must-sum-to-1-0-current-sum", { sum: metricsSum.toFixed(2) });
      }

      // Validate individual metrics are not negative
      Object.entries(formData.evaluation_metrics).forEach(([key, value]) => {
        if (value < 0) {
          newErrors[`metrics_${key}`] = t("metric-cannot-be-negative", { metric: key });
        }
      });

      // Validate delivery/dine-in weights
      const deliverySum = (formData.delivery_weight || 0) + (formData.dine_in_weight || 0);
      if (Math.abs(deliverySum - 1) > 0.001) {
        newErrors.delivery_weight = t("weights-must-sum-to-100");
      }
    }

    // Current location is optional for all report types

    // Custom locations are required for location reports, optional for full reports
    if (reportType === 'location') {
      const hasValidCustomLocation = formData.custom_locations.some(
        loc => loc.lat !== 0 && loc.lng !== 0
      );
      if (!hasValidCustomLocation) {
        newErrors.custom_locations = t("please-select-a-location-to-evaluate");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isAdvancedMode, reportType]);

  // Separate validation function that doesn't update state (for use during render)
  const handleInputChange = (field: string, value: FormInputValue) => {
    setFormData(prev =>
      prev
        ? {
            ...prev,
            [field]: value,
            ...(field === 'Type'
              ? {
                  potential_business_type: value,
                }
              : {}),
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

  const handleAttributeChange = (key: string, value: number | string | string[]) => {
    setFormData(prev =>
      prev
        ? {
            ...prev,
            [key]: value,
          }
        : null
    );
  };

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

  const apiBusinessType = useMemo(() => {
    if (!formData) return undefined;

    return formatBusinessTypeForApi(
      formData.potential_business_type || formData.Type || businessType,
      categories
    );
  }, [formData, businessType, categories]);

  // Use the new pricing hook for additional cost calculation
  useAdditionalCost({
    country: formData?.country_name || null,
    city: formData?.city_name || null,
    datasets: allDatasets,
    reportTier:
      reportType === 'location' ? 'single_location_premium' : formData?.report_tier || 'premium',
    report_potential_business_type: apiBusinessType,
    enabled: isAttributesStep && allDatasets.length > 0,
  });

  const handleSubmit = useCallback(async (reportTierOverride?: 'basic' | 'standard' | 'premium') => {
    if (!formData || !validateForm()) {
      return;
    }

    // Additional safety check for report type
    if (!reportType) {
      setSubmitError(t("please-select-a-report-type-before-submitting"));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    let submissionData: ReportSubmissionRequestBody | null = null;

    try {
      // Prepare form data with default values for optional locations
      submissionData = {
        user_id: formData.user_id,
        city_name: formData.city_name,
        country_name: formData.country_name,
        potential_business_type: apiBusinessType || businessType,
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
          reportType === 'location'
            ? 'single_location_premium'
            : reportTierOverride || formData.report_tier || 'premium',
        report_potential_business_type: apiBusinessType || businessType,
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
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      const isPaymentIntentError = isPaymentIntentErrorMessage(errorMessage);

      if (isPaymentIntentError) {
        // Store submission data for retry after payment method is added
        if (submissionData) {
          setPendingSubmission(submissionData);
        }
        // Show payment method form instead of error
        setShowPaymentMethodForm(true);
        setSubmitError(null);
      } else {
        setSubmitError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    apiBusinessType,
    businessType,
    formData,
    hasUsedFreeLocationReport,
    navigate,
    reportType,
    validateForm,
  ]);

  // Show loading state while fetching business configuration
  if (configLoading && !businessConfig) {
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

            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("preparing-your-report")}</h2>
            <p className="text-gray-600 mb-4">{t("setting-up-the-form-for-your")}{' '}{businessType}{' '}{t("location-analysis")}</p>

            {/* Loading dots animation */}
            <div className="flex justify-center gap-1">
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
  if (configError && !businessConfig) {
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
              {isNotSupportedError ?t("business-type-not-available") :t("configuration-error")}
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
            >{t("go-back")}</button>
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

            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("almost-ready")}</h2>
            <p className="text-gray-600 mb-4">{t("finalizing-your")}{' '}{businessType}{' '}{t("report-setup")}</p>

            {/* Loading dots animation */}
            <div className="flex justify-center gap-1">
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

  // Check if we're on the last step (report-tier)
  const isLastStep = false;
  
  return (
    <main className="fixed inset-0 w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header - No background, hide title on last step */}
      <div className="px-4 pt-2 pb-1 text-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
          >
            <FaArrowLeft className="w-3 h-3 me-1 rtl:rotate-180" />
            <span>{t("back")}</span>
          </button>
          {!isLastStep && <div className="w-16"></div>} {/* Spacer for centering */}
        </div>
      </div>

      {/* Content Area - No scrolling, fits viewport */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className={`flex-1 ${isLastStep ? 'overflow-hidden' : 'overflow-y-auto'} px-4 sm:px-6 py-4 ${formData && currentStep > 0 && !isLastStep ? 'pb-24' : ''}`}>
	          <form className="h-full flex flex-col" onSubmit={e => {
              e.preventDefault();
              handleSubmit();
            }}>
            {/* Current Step Content */}
            <div className={`flex-1 gap-2 py-4 flex flex-col ${isLastStep ? 'overflow-hidden' : ''}`}>
              {<BasicInformationStep
				        formData={formData}
				        errors={errors}
				        onInputChange={handleInputChange}
				        isAdvancedMode={isAdvancedMode}
				        onToggleAdvancedMode={setIsAdvancedMode}
				        disabled={isSubmitting}
				        categories={categories}
				      />}

		          <SetAttributeStep
		            onInputChange={handleAttributeChange}
		            inputCategories={categories}
		            formData={formData}
		          />
				      <div className="flex-1 relative w-full h-full min-h-[80vmin]" id="map-container">
				        <div className="w-full h-full overflow-hidden [&>.ol-map]:size-full">
				        	<VrpMap handleInputChange={handleInputChange} />
							  </div>
				      </div>
            </div>

            {/* Processing Status */}
            {isSubmitting && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-4">
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
                  <div className="ms-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{t("generating-your")}{' '}{businessType}{' '}{t("report")}</p>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">{t("3-15-min")}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{t("report-generation-in-progress-you-can-always-find-the-report-link-in-your-profil")}</p>
                  </div>
                </div>
              </div>
            )}


            {/* Submit Error - Only show if not showing payment method form */}
            {submitError && !showPaymentMethodForm && (
              <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaExclamationTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ms-3 flex-1">
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

          </form>
        </div>
      </div>

    </main>
  );
};

export default function VrpReportForm() {
		return <CustomReportForm />;
}
