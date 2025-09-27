// Main component
export { default as PharmacyReportForm } from './PharmacyReportFormRefactored';

// Types
export * from './types';

// Constants
export * from './constants';

// Hooks
export { usePharmacyForm } from './hooks/usePharmacyForm';
export { useStepManager } from './hooks/useStepManager';
export { useReportGeneration } from './hooks/useReportGeneration';

// Components
export { ProgressIndicator } from './components/ProgressIndicator';
export { BasicInformationStep } from './components/BasicInformationStep';
export { EvaluationMetricsStep } from './components/EvaluationMetricsStep';
export { CustomLocationsStep } from './components/CustomLocationsStep';
export { CurrentLocationStep } from './components/CurrentLocationStep';
export { NavigationButtons } from './components/NavigationButtons';
export { ReportGenerationLoader } from './components/ReportGenerationLoader';
export { LoadingDemo } from './components/LoadingDemo';
export { ResponseDemo } from './components/ResponseDemo';

// Utils
export { getMetricIcon } from './utils/metricIcons';

// Services
export { submitPharmacyReport, FormSubmissionFactory } from './services/formSubmissionService';
