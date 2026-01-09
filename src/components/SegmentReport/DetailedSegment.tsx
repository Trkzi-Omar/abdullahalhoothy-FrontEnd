import React from 'react';
import { FaFile } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { CustomSegment } from '../../types';

interface DetailedSegmentProps {
  segmentReportData: CustomSegment[] | null;
  selectedSegmentId: string | null;
  setSelectedSegmentId: (id: string) => void;
}

function DetailedSegment({
  segmentReportData,
  selectedSegmentId,
  setSelectedSegmentId,
}: DetailedSegmentProps) {
  const [activeTab, setActiveTab] = React.useState<
    'who_they_are' | 'evaluation_metrics' | 'how_they_live'
  >('who_they_are');
  const selectedSegment = segmentReportData?.find(seg => seg.segment_id === selectedSegmentId);

  if (!selectedSegment)
    return (
      <div className="flex items-center justify-center py-16">
        <div className="border rounded-xl px-8 py-10 text-center bg-white  shadow-sm">
          <div className="text-5xl  mb-3">
            <FaFile className="text-center mx-auto text-gray-400" />{' '}
          </div>

          <h3 className="text-xl font-semibold text-neutral-800 ">Nothing Here Yet</h3>

          <p className="text-sm text-neutral-500 mt-2">
            This section doesn't have any data available.
          </p>
        </div>
      </div>
    );

  const handlePrevious = () => {
    if (!segmentReportData) return;
    const currentIndex = segmentReportData.findIndex(seg => seg.segment_id === selectedSegmentId);
    if (currentIndex > 0) {
      setSelectedSegmentId(segmentReportData[currentIndex - 1].segment_id);
    }
  };

  const handleNext = () => {
    if (!segmentReportData) return;
    const currentIndex = segmentReportData.findIndex(seg => seg.segment_id === selectedSegmentId);
    if (currentIndex < segmentReportData.length - 1) {
      setSelectedSegmentId(segmentReportData[currentIndex + 1].segment_id);
    }
  };

  return (
    <div>
      {/* Header with Navigation */}
      <div className="flex items-center justify-between py-6 bg-white">
        <button
          onClick={handlePrevious}
          disabled={segmentReportData?.findIndex(seg => seg.segment_id === selectedSegmentId) === 0}
          className="p-3 rounded-full border-2 border-[#582c83] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[#582c83] hover:bg-[#582c83] hover:text-white"
          type="button"
        >
          <FiChevronLeft className="w-6 h-6 " />
        </button>

        <div className="text-center flex-1 px-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex items-center justify-center bg-[#582c83] text-white font-normal text-2xl  py-1.5 px-2">
              {(
                (segmentReportData?.findIndex(seg => seg.segment_id === selectedSegmentId) ?? 0) + 1
              )
                .toString()
                .padStart(2, '0')}
            </div>
            <h2 className="text-3xl font-bold text-[#582c83] flex items-center gap-2">
              {selectedSegment.name}
            </h2>
          </div>
          <p className="text-gray-700 text-base mb-2">{selectedSegment.description}</p>
        </div>

        <button
          onClick={handleNext}
          disabled={
            segmentReportData?.findIndex(seg => seg.segment_id === selectedSegmentId) ===
            (segmentReportData?.length ?? 0) - 1
          }
          className="p-3 rounded-full border-2 border-[#582c83] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[#582c83] hover:bg-[#582c83] hover:text-white"
          type="button"
        >
          <FiChevronRight className="w-6 h-6 " />
        </button>
      </div>
      <div className="overflow-hidden max-w-3xl mx-auto">
        {/* Tabs */}
        <div className="bg-[#f5f5f5]">
          <div className="grid grid-cols-3 border-b-2 border-gray-100">
            <button
              onClick={() => setActiveTab('who_they_are')}
              className={`px-2 relative font-semibold text-sm py-6 border-r-[1px] border-gray-300 ${
                activeTab === 'who_they_are'
                  ? 'text-[#582c83] bg-[#e3dbea]'
                  : 'text-gray-600 hover:text-[#582c83]'
              }`}
              type="button"
            >
              WHO THEY ARE
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-[#582c83] transition-transform duration-300 ${
                  activeTab === 'who_they_are' ? 'scale-100' : 'scale-0'
                }`}
              ></div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('evaluation_metrics')}
              className={`relative group px-2 font-semibold text-sm py-6 border-r-[1px] border-gray-300 ${
                activeTab === 'evaluation_metrics'
                  ? 'text-[#582c83] bg-[#e3dbea]'
                  : 'text-gray-600 hover:text-[#582c83]'
              }`}
            >
              Evaluation Metrics
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-[#582c83] transition-transform duration-300 ${
                  activeTab === 'evaluation_metrics' ? 'scale-100' : 'scale-0 group-hover:scale-100'
                }`}
              ></div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('how_they_live')}
              className={`relative group px-2 font-semibold text-sm py-6 ${
                activeTab === 'how_they_live'
                  ? 'text-[#582c83] bg-[#e3dbea]'
                  : 'text-gray-600 hover:text-[#582c83]'
              }`}
            >
              HOW THEY LIVE
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-[#582c83] transition-transform duration-300 ${
                  activeTab === 'how_they_live' ? 'scale-100' : 'scale-0 group-hover:scale-100'
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-8 min-h-[300px]">
          {activeTab === 'who_they_are' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Description */}
              <div className="">
                <p className="leading-relaxed">
                  {selectedSegment.description}. This group typically falls within the{' '}
                  <span className="font-semibold">
                    {selectedSegment.demographic_profile.age_range}
                  </span>{' '}
                  age range with a household size of{' '}
                  <span className="font-semibold">
                    {selectedSegment.demographic_profile.household_size}
                  </span>
                  . Their lifestyle is described as{' '}
                  <span className="font-semibold">
                    {selectedSegment.demographic_profile.lifestyle}
                  </span>
                  , and they tend to spend on{' '}
                  <span className="font-semibold">
                    {selectedSegment.demographic_profile.spending_habits}
                  </span>
                  .
                </p>
              </div>

              {/* Right Column - Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6">
                {/* Average Household Income */}
                <div>
                  <div className="text-[#582c83] text-xs font-semibold mb-2 tracking-wide">
                    AVERAGE INCOME
                  </div>
                  <div className="text-gray-900 font-semibold text-base capitalize">
                    {selectedSegment.demographic_profile.income}
                  </div>
                </div>

                {/* Family Life */}
                <div>
                  <div className="text-[#582c83] text-xs font-semibold mb-2 tracking-wide">
                    FAMILY SIZE
                  </div>
                  <div className="text-gray-900 font-semibold text-base">
                    {selectedSegment.demographic_profile.household_size}
                  </div>
                </div>

                {/* Home Type */}
                <div>
                  <div className="text-[#582c83] text-xs font-semibold mb-2 tracking-wide">
                    AVERAGE AGE
                  </div>
                  <div className="text-gray-900 font-semibold text-base">
                    {selectedSegment.demographic_profile.age_range}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evaluation_metrics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(selectedSegment.attributes.evaluation_metrics).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="relative">
                        <div className="text-[#582c83] text-xs font-bold mb-3 tracking-wider uppercase">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <div className="text-4xl font-bold text-gray-900 group-hover:text-[#582c83] transition-colors">
                            {(value * 100).toFixed(0)}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">/ 100</div>
                        </div>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#582c83] to-[#7a3fa8] h-full rounded-full transition-all duration-500"
                            style={{ width: `${(value * 100).toFixed(0)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {activeTab === 'how_they_live' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-[#582c83] mb-2">
                  Lifestyle & Shopping Patterns
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {selectedSegment.attributes.cross_shopping_categories &&
                  selectedSegment.attributes.cross_shopping_categories.length > 0 && (
                    <div className="bg-gradient-to-br from-white to-blue-50 border-l-4 border-blue-500 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-blue-700 font-bold text-base tracking-wide">
                            Cross Shopping Categories
                          </h4>
                          <p className="text-xs text-gray-600">Alternative shopping destinations</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSegment.attributes.cross_shopping_categories.map(
                          (category, index) => (
                            <span
                              key={index}
                              className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                            >
                              {category}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                {selectedSegment.attributes.complementary_categories &&
                  selectedSegment.attributes.complementary_categories.length > 0 && (
                    <div className="bg-gradient-to-br from-white to-green-50 border-l-4 border-green-500 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-green-700 font-bold text-base tracking-wide">
                            Complementary Categories
                          </h4>
                          <p className="text-xs text-gray-600">
                            Businesses that enhance the experience
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSegment.attributes.complementary_categories.map(
                          (category, index) => (
                            <span
                              key={index}
                              className="px-4 py-2 bg-white border border-green-200 text-green-700 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                            >
                              {category}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailedSegment;
