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
        >
          <FiChevronRight className="w-6 h-6 " />
        </button>
      </div>
      <div className="overflow-hidden max-w-3xl mx-auto">
        {/* Tabs */}
        <div className="bg-[#f5f5f5]">
          <div className="grid grid-cols-3 border-b-2 border-gray-100">
            <button className="px-2 relative text-[#582c83] font-semibold text-sm py-6 bg-[#e3dbea] border-r-[1px] border-gray-300">
              WHO THEY ARE
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#582c83]"></div>
            </button>
            <button className="relative group px-2 text-gray-600 hover:text-[#582c83] font-semibold text-sm py-6 border-r-[1px] border-gray-300">
              HOW THEY THINK
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#582c83] scale-0 origin-center transition-transform duration-300 group-hover:scale-100"></div>
            </button>

            <button className="relative group px-2 text-gray-600 hover:text-[#582c83] font-semibold text-sm py-6">
              HOW THEY LIVE
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#582c83] scale-0 origin-center transition-transform duration-300 group-hover:scale-100"></div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          {/* Left Column - Description */}
          <div className="">
            <p className="leading-relaxed">
              {selectedSegment.description}. This group typically falls within the{' '}
              <span className="font-semibold">{selectedSegment.demographic_profile.age_range}</span>{' '}
              age range with a household size of{' '}
              <span className="font-semibold">
                {selectedSegment.demographic_profile.household_size}
              </span>
              . Their lifestyle is described as{' '}
              <span className="font-semibold">{selectedSegment.demographic_profile.lifestyle}</span>
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
                AVERAGE HOUSEHOLD INCOME
              </div>
              <div className="text-gray-900 font-semibold text-base capitalize">
                {selectedSegment.demographic_profile.income}
              </div>
            </div>

            {/* Average Household Net Worth */}
            <div>
              <div className="text-[#582c83] text-xs font-semibold mb-2 tracking-wide">
                AVERAGE HOUSEHOLD NET WORTH
              </div>
              <div className="text-gray-900 font-semibold text-base capitalize">
                {selectedSegment.attributes.target_income_level}
              </div>
            </div>

            {/* Tenure */}
            <div>
              <div className="text-[#582c83] text-xs font-semibold mb-2 tracking-wide">TENURE</div>
              <div className="text-gray-900 font-semibold text-base">
                {selectedSegment.demographic_profile.lifestyle}
              </div>
            </div>

            {/* Education */}
            <div>
              <div className="text-[#582c83] text-xs font-semibold mb-2 tracking-wide">
                EDUCATION
              </div>
              <div className="text-gray-900 font-semibold text-base">
                {selectedSegment.demographic_profile.spending_habits}
              </div>
            </div>

            {/* Occupation */}
            <div>
              <div className="text-[#582c83] text-xs font-semibold mb-2 tracking-wide">
                OCCUPATION
              </div>
              <div className="text-gray-900 font-semibold text-base">
                {selectedSegment.description}
              </div>
            </div>

            {/* Diversity */}
            <div>
              <div className="text-[#582c83] text-xs font-semibold mb-2 tracking-wide">
                DIVERSITY
              </div>
              <div className="text-gray-900 font-semibold text-base">
                {(selectedSegment.attributes.evaluation_metrics.demographics * 100).toFixed(0)}%
              </div>
            </div>

            {/* Urbanity */}
            <div>
              <div className="text-[#582c83] text-xs font-semibold mb-2 tracking-wide">
                URBANITY
              </div>
              <div className="text-gray-900 font-semibold text-base">
                {selectedSegment.attributes.analysis_radius}m
              </div>
            </div>

            {/* Family Life */}
            <div>
              <div className="text-[#582c83] text-xs font-semibold mb-2 tracking-wide">
                FAMILY LIFE
              </div>
              <div className="text-gray-900 font-semibold text-base">
                {selectedSegment.demographic_profile.household_size}
              </div>
            </div>

            {/* Home Type */}
            <div>
              <div className="text-[#582c83] text-xs font-semibold mb-2 tracking-wide">
                HOME TYPE
              </div>
              <div className="text-gray-900 font-semibold text-base">
                {selectedSegment.demographic_profile.age_range}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailedSegment;
