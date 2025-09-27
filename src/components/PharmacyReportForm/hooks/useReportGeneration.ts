import { useState, useCallback } from 'react';
import { PharmacyReportData, ReportGenerationResponse } from '../types';
import { submitPharmacyReport } from '../services/formSubmissionService';

export const useReportGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [generationResult, setGenerationResult] = useState<ReportGenerationResponse | null>(null);

  const startGeneration = useCallback(
    async (formData: PharmacyReportData): Promise<ReportGenerationResponse> => {
      setIsGenerating(true);
      setGenerationError(null);
      setIsCancelled(false);
      setGenerationResult(null);

      try {
        const result = await submitPharmacyReport(formData);
        setIsGenerating(false);
        setGenerationResult(result);

        // If the result indicates an error, set the error state
        if (!result.success && result.error) {
          setGenerationError(result.error);
          throw new Error(result.error);
        }

        return result;
      } catch (error) {
        setIsGenerating(false);
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred while generating the report';
        setGenerationError(errorMessage);
        throw error;
      }
    },
    []
  );

  const cancelGeneration = useCallback(() => {
    setIsCancelled(true);
    setIsGenerating(false);
    setGenerationError('Report generation was cancelled by the user');
  }, []);

  const resetGeneration = useCallback(() => {
    setIsGenerating(false);
    setGenerationError(null);
    setIsCancelled(false);
    setGenerationResult(null);
  }, []);

  return {
    isGenerating,
    generationError,
    isCancelled,
    generationResult,
    startGeneration,
    cancelGeneration,
    resetGeneration,
  };
};
