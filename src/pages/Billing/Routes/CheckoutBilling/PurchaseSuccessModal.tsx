import React from 'react';
import { MdCheckCircleOutline } from 'react-icons/md';
import { formatSubcategoryName } from '../../../../utils/helperFunctions';
import type {
  DatasetItem,
  IntelligenceItem,
} from '../../../../components/CustomReportForm/services/reportPricingService';

interface PurchaseSuccessModalProps {
  purchaseData: {
    overall_status: string;
    report?: {
      status: string;
      charged_usd: number;
      current_credits: number;
      message: string;
    };
    intelligences?: Array<{
      intelligence: IntelligenceItem;
      status: string;
      message: string;
    }>;
    datasets?: Array<{
      dataset: DatasetItem;
      status: string;
      message: string;
    }>;
  };
}

const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({ purchaseData }) => {
  const formatPrice = (value: number) =>
    `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const hasReport = purchaseData.report && Object.keys(purchaseData.report).length > 0;
  const hasIntelligences = purchaseData.intelligences && purchaseData.intelligences.length > 0;
  const hasDatasets = purchaseData.datasets && purchaseData.datasets.length > 0;

  return (
    <div className="flex flex-col max-h-[80vh] w-full max-w-3xl">
      {/* Header */}
      <div className="flex flex-col items-center justify-center p-6 border-b border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <MdCheckCircleOutline className="text-green-500 text-6xl mb-3" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Payment Successful!</h2>
        <p className="text-sm text-gray-600">Your purchase has been completed successfully</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 mt-5 border border-gray-200">
        <div className="space-y-6">
          {/* Report Section */}
          {hasReport && purchaseData.report && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#115740] rounded-full"></span>
                Report
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      {purchaseData.report.message}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-[#115740]">
                      {formatPrice(purchaseData.report.charged_usd)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Intelligences Section */}
          {hasIntelligences && purchaseData.intelligences && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#115740] rounded-full"></span>
                Area Intelligence ({purchaseData.intelligences.length})
              </h3>
              <div className="space-y-3">
                {purchaseData.intelligences.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-900 mb-2">
                          {item.intelligence.intelligence_name} Intelligence
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.intelligence.description}
                        </p>
                        <p className="text-xs text-gray-500 italic">
                          {item.intelligence.explanation}
                        </p>
                        {item.intelligence.expiration && (
                          <p className="text-xs text-gray-500 mt-2">
                            Expires: {new Date(item.intelligence.expiration).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        {item.intelligence.free_as_part_of_package ? (
                          <div className="text-lg font-bold text-green-600">Free</div>
                        ) : (
                          <div className="text-lg font-bold text-[#115740]">
                            {formatPrice(item.intelligence.cost)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-700 bg-blue-50 border border-blue-100 rounded-md p-3">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datasets Section */}
          {hasDatasets && purchaseData.datasets && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#115740] rounded-full"></span>
                Datasets ({purchaseData.datasets.length})
              </h3>
              <div className="space-y-3">
                {purchaseData.datasets.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            DATASET
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 mb-2">
                          {formatSubcategoryName(item.dataset.dataset_name)}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{item.dataset.description}</p>
                        <p className="text-xs text-gray-500 italic">{item.dataset.explanation}</p>
                        {item.dataset.expiration && (
                          <p className="text-xs text-gray-500 mt-2">
                            Expires: {new Date(item.dataset.expiration).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        {item.dataset.free_as_part_of_package ? (
                          <div className="text-lg font-bold text-green-600">Free</div>
                        ) : (
                          <div className="text-lg font-bold text-[#115740]">
                            {formatPrice(item.dataset.cost)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-700 bg-blue-50 border border-blue-100 rounded-md p-3">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!hasReport && !hasIntelligences && !hasDatasets && (
            <div className="text-center py-8 text-gray-500">
              <p>No purchase details available</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Thank you for your purchase! You can now access your new data and reports.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccessModal;
