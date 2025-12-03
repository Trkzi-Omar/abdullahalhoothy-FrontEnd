import { Skeleton } from '../common/Skeleton';

function SegmentReportSkeleton() {
  return (
    <div className="px-4 py-6 space-y-6 w-full min-w-0 animate-fade-in-up">
      {/* Scrollable Segments Skeleton */}
      <div className="w-full max-w-full overflow-hidden">
        <div className="flex gap-8 p-5 overflow-hidden">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 size-[180px] relative rounded-none overflow-hidden"
            >
              <Skeleton className="w-full h-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Segment Skeleton */}
      <div>
        {/* Header Skeleton */}
        <div className="flex items-center justify-between py-6 bg-white">
          <Skeleton className="w-12 h-12 rounded-full" />

          <div className="flex-1 px-8 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-10 h-10" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </div>

          <Skeleton className="w-12 h-12 rounded-full" />
        </div>

        <div className="overflow-hidden max-w-3xl mx-auto">
          {/* Tabs Skeleton */}
          <div className="bg-[#f5f5f5]">
            <div className="grid grid-cols-3 border-b-2 border-gray-100">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-16 border-r border-gray-300">
                  <Skeleton className="w-full h-full bg-transparent" />
                </div>
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
            {/* Left Column - Description Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            {/* Right Column - Stats Grid Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6">
              {[...Array(9)].map((_, index) => (
                <div key={index}>
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SegmentReportSkeleton;
