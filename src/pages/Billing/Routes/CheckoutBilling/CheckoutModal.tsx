import React, { useCallback } from 'react';
import { MdClose, MdCheckCircleOutline, MdErrorOutline } from 'react-icons/md';
import { formatSubcategoryName } from '../../../../utils/helperFunctions';
import { useBillingContext, type ReportTier } from '../../../../context/BillingContext';
import { useUIContext } from '../../../../context/UIContext';
import { useAuth } from '../../../../context/AuthContext';
import apiRequest from '../../../../services/apiRequest';
import urls from '../../../../urls.json';

interface CheckoutModalProps {
  onClose: () => void;
  cartCostResponse: {
    data?: {
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
    };
  } | null;
  isCalculatingCost: boolean;
  onPurchaseComplete: () => void;
}

const REPORT_TIERS = [
  { reportKey: 'premium' as ReportTier, name: 'Premium Tier' },
  { reportKey: 'standard' as ReportTier, name: 'Standard Tier' },
  { reportKey: 'basic' as ReportTier, name: 'Basic Tier' },
];

function CheckoutModal({
  onClose,
  cartCostResponse,
  isCalculatingCost,
  onPurchaseComplete,
}: CheckoutModalProps) {
  const { checkout, dispatch } = useBillingContext();
  const { openModal } = useUIContext();
  const { authResponse } = useAuth();
  const [isPurchasing, setIsPurchasing] = React.useState(false);

  const formatPrice = useCallback(
    (value: number) =>
      `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    []
  );

  const handleIntelligenceToggle = useCallback(
    (service: 'population' | 'income') => {
      const formatted = service === 'population' ? 'Population' : 'Income';
      dispatch({ type: 'toggleIntelligence', payload: formatted });
    },
    [dispatch]
  );

  const handleDatasetToggle = useCallback(
    (type: string) => {
      dispatch({ type: 'toggleDataset', payload: type });
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

  const handlePurchase = useCallback(async () => {
    if (!authResponse?.localId) {
      return;
    }

    if (
      checkout.datasets.length === 0 &&
      checkout.intelligences.length === 0 &&
      checkout.report === ''
    ) {
      return;
    }

    setIsPurchasing(true);

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
        datasets: checkout.datasets,
        intelligences: checkout.intelligences,
        displayed_price: cartCostResponse?.data?.total_cost || 0,
      };

      if (checkout.report) {
        requestBody.report = checkout.report;
      }

      const response = await apiRequest({
        url: urls.purchase_items,
        method: 'POST',
        body: requestBody,
        isAuthRequest: true,
      });

      const successMessage =
        response?.data?.message || 'Your purchase has been completed successfully.';

      openModal(
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <MdCheckCircleOutline className="text-green-500 text-6xl mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600">{successMessage}</p>
        </div>,
        {
          darkBackground: true,
          isSmaller: true,
          hasAutoSize: true,
        }
      );

      onPurchaseComplete();
      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);

      let errorMessage = 'An error occurred while processing your purchase.';

      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {
          response?: { data?: { message?: string; detail?: string; error?: string } | string };
        };
        const errorData = apiError.response?.data;

        if (errorData && typeof errorData === 'object') {
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message.replace(/\s*\(Status:\s*\d+\)/g, '');
      }

      openModal(
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <MdErrorOutline className="text-red-500 text-6xl mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-600">{errorMessage}</p>
        </div>,
        {
          darkBackground: true,
          isSmaller: true,
          hasAutoSize: true,
        }
      );
    } finally {
      setIsPurchasing(false);
    }
  }, [authResponse?.localId, checkout, cartCostResponse, openModal, onPurchaseComplete, onClose]);

  const hasApiItems =
    cartCostResponse?.data &&
    ((cartCostResponse.data.intelligence_purchase_items?.length ?? 0) > 0 ||
      (cartCostResponse.data.dataset_purchase_items?.length ?? 0) > 0 ||
      (cartCostResponse.data.report_purchase_items?.length ?? 0) > 0);

  const hasCheckoutItems =
    checkout.datasets.length > 0 || checkout.intelligences.length > 0 || checkout.report !== '';

  const isEmpty = !hasApiItems && !hasCheckoutItems;

  const apiItemCount =
    (cartCostResponse?.data?.intelligence_purchase_items?.length ?? 0) +
    (cartCostResponse?.data?.dataset_purchase_items?.length ?? 0) +
    (cartCostResponse?.data?.report_purchase_items?.length ?? 0);
  const checkoutItemCount =
    checkout.datasets.length + checkout.intelligences.length + (checkout.report ? 1 : 0);
  const totalItems = apiItemCount > 0 ? apiItemCount : checkoutItemCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Checkout</h2>
            <span className="text-sm text-gray-500">
              {totalItems} item{totalItems === 1 ? '' : 's'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Support Note */}
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mb-6">
            <p className="text-xs text-gray-500 leading-relaxed">
              Questions? We're happy to help — reach us at{' '}
              <a href="tel:+966558188632" className="text-[#115740] font-medium hover:underline">
                +966 (55) 818 - 8632
              </a>
            </p>
          </div>

          {isEmpty ? (
            <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500">
              <svg
                className="w-24 h-24 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm">
                Select services from Area Intelligence, Datasets, or Reports to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Render items from API response or fallback to checkout state */}
              {hasApiItems ? (
                <>
                  {cartCostResponse?.data?.intelligence_purchase_items
                    ?.filter(item => item.intelligence_name)
                    .map(item => (
                      <div
                        key={item.intelligence_name}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              area
                            </span>
                            <span className="text-sm text-gray-300">•</span>
                            <span className="text-sm text-gray-500">
                              {item.intelligence_name || 'Unknown'}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.intelligence_name || 'Unknown'} Intelligence
                          </h3>
                          <p className="text-sm text-gray-500">{item.explanation}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {item.free_as_part_of_package ? (
                            <span className="text-lg font-semibold text-green-600">Free</span>
                          ) : (
                            <span className="text-lg font-semibold text-gray-900">
                              {formatPrice(item.cost)}
                            </span>
                          )}
                          <button
                            type="button"
                            className="text-xs text-red-500 hover:text-red-700"
                            onClick={() =>
                              item.intelligence_name &&
                              handleIntelligenceToggle(
                                item.intelligence_name.toLowerCase() as 'population' | 'income'
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  {cartCostResponse?.data?.dataset_purchase_items
                    ?.filter(item => item.dataset_name)
                    .map(item => (
                      <div
                        key={item.dataset_name}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              dataset
                            </span>
                            <span className="text-sm text-gray-300">•</span>
                            <span className="text-sm text-gray-500">
                              {formatSubcategoryName(item.dataset_name || '')}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {formatSubcategoryName(item.dataset_name || '')}
                          </h3>
                          <p className="text-sm text-gray-500">{item.explanation}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {item.free_as_part_of_package ? (
                            <span className="text-lg font-semibold text-green-600">Free</span>
                          ) : (
                            <span className="text-lg font-semibold text-gray-900">
                              {formatPrice(item.cost)}
                            </span>
                          )}
                          <button
                            type="button"
                            className="text-xs text-red-500 hover:text-red-700"
                            onClick={() => handleDatasetToggle(item.dataset_name)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  {cartCostResponse?.data?.report_purchase_items?.map((item, index) => {
                    const tierName = item.report_tier
                      ? REPORT_TIERS.find(t => t.reportKey === item.report_tier)?.name ||
                        `${item.report_tier.charAt(0).toUpperCase() + item.report_tier.slice(1)} Tier`
                      : 'Report';
                    return (
                      <div
                        key={`report-${index}`}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              report
                            </span>
                            <span className="text-sm text-gray-300">•</span>
                            <span className="text-sm text-gray-500 capitalize">
                              {item.report_tier || 'report'}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {tierName} Report
                          </h3>
                          <p className="text-sm text-gray-500">{item.explanation}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {formatPrice(item.cost)}
                          </span>
                          {item.report_tier && (
                            <button
                              type="button"
                              className="text-xs text-red-500 hover:text-red-700"
                              onClick={() => handleReportToggle(item.report_tier as ReportTier)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  {checkout.intelligences.map(service => (
                    <div
                      key={service}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            area
                          </span>
                          <span className="text-sm text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{service}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {service} Intelligence
                        </h3>
                        <p className="text-sm text-gray-500">Calculating price...</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:text-red-700"
                          onClick={() =>
                            handleIntelligenceToggle(
                              service.toLowerCase() as 'population' | 'income'
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {checkout.datasets.map(dataset => (
                    <div
                      key={dataset}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            dataset
                          </span>
                          <span className="text-sm text-gray-300">•</span>
                          <span className="text-sm text-gray-500">
                            {formatSubcategoryName(dataset)}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {formatSubcategoryName(dataset)}
                        </h3>
                        <p className="text-sm text-gray-500">Calculating price...</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:text-red-700"
                          onClick={() => handleDatasetToggle(dataset)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {checkout.report &&
                    (() => {
                      const tierName =
                        REPORT_TIERS.find(t => t.reportKey === checkout.report)?.name ||
                        `${checkout.report.charAt(0).toUpperCase() + checkout.report.slice(1)} Tier`;
                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-lg p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                report
                              </span>
                              <span className="text-sm text-gray-300">•</span>
                              <span className="text-sm text-gray-500 capitalize">
                                {checkout.report}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {tierName} Report
                            </h3>
                            <p className="text-sm text-gray-500">Calculating price...</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              type="button"
                              className="text-xs text-red-500 hover:text-red-700"
                              onClick={() => handleReportToggle(checkout.report)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-lg font-semibold text-gray-900">
                {cartCostResponse?.data?.total_cost
                  ? formatPrice(cartCostResponse.data.total_cost)
                  : '$0.00'}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={handlePurchase}
                disabled={isPurchasing || isCalculatingCost || isEmpty}
                className="flex-1 bg-[#115740] text-white py-3 rounded-lg font-semibold hover:bg-[#0d4632] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPurchasing ? 'Processing...' : 'Purchase Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;
