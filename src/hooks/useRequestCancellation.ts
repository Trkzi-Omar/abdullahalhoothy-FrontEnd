import { useEffect, MutableRefObject } from 'react';
import axios, { CancelTokenSource } from 'axios';

interface CancellationConfig {
  cancelSourcesRef: MutableRefObject<CancelTokenSource[]>;
  conditions?: {
    dependencies: unknown[];
    shouldCancel: (...deps: unknown[]) => boolean;
    message?: string;
  };
  cleanupOnUnmount?: boolean;
}

export const useRequestCancellation = ({
  cancelSourcesRef,
  conditions,
  cleanupOnUnmount = true
}: CancellationConfig) => {
  // Handle conditional cancellation
  useEffect(() => {
    if (conditions) {
      const { dependencies, shouldCancel, message = 'Requests cancelled due to condition change' } = conditions;
      
      if (shouldCancel(...dependencies)) {
        cancelAllRequests(message);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, conditions ? conditions.dependencies : []);

  // Cleanup on unmount
  useEffect(() => {
    if (cleanupOnUnmount) {
      return () => {
        cancelAllRequests('Component unmounted');
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCancelToken = () => {
    const source = axios.CancelToken.source();
    cancelSourcesRef.current?.push(source);
    return source;
  };

  const cancelRequest = (source: CancelTokenSource, message: string = 'Request cancelled') => {
    source.cancel(message);
    if (cancelSourcesRef.current) {
      cancelSourcesRef.current = cancelSourcesRef.current.filter(s => s !== source);
    }
  };

  const cancelAllRequests = (message: string = 'All requests cancelled') => {
    if (cancelSourcesRef.current) {
      cancelSourcesRef.current.forEach(source => source.cancel(message));
      cancelSourcesRef.current = [];
    }
  };
  const isCancellationError = (error: unknown) => {
   return  axios.isCancel(error);
  };
  return {
    createCancelToken,
    cancelRequest,
    cancelAllRequests,
    isCancellationError
  };
};
