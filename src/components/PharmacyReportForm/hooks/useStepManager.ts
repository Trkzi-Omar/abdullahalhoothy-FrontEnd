import { useState, useCallback } from 'react';
import { PharmacyReportData } from '../types';
import { TOTAL_STEPS } from '../constants';

export const useStepManager = (formData: PharmacyReportData) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const validateCurrentStep = useCallback(
    (step: number): boolean => {
      const metricsSum = Object.values(formData.evaluation_metrics).reduce(
        (sum, value) => sum + value,
        0
      );

      switch (step) {
        case 1:
          return !!formData.city_name;
        case 2:
          return (
            metricsSum === 100 && Object.values(formData.evaluation_metrics).every(v => v >= 0)
          );
        case 3:
          return true; // Custom locations are optional
        case 4:
          return true; // Current location is optional
        default:
          return false;
      }
    },
    [formData.city_name, formData.evaluation_metrics]
  );

  const goToNextStep = useCallback(() => {
    if (validateCurrentStep(currentStep)) {
      setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep]);
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    }
  }, [currentStep, validateCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step <= currentStep || completedSteps.includes(step - 1)) {
        setCurrentStep(step);
      }
    },
    [currentStep, completedSteps]
  );

  return {
    currentStep,
    completedSteps,
    setCompletedSteps,
    validateCurrentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  };
};
