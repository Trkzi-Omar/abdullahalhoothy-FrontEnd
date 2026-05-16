import { CustomSegment, CustomSegmentReportResponse } from '../../types';
import ScrollableSegments from './ScrollableSegments';
import DetailedSegment from './DetailedSegment';
import SegmentReportSkeleton from './SegmentReportSkeleton';
import i18n from '../../i18n';

interface SmartSegmentReportProps {
  segmentReportData: CustomSegmentReportResponse | null;
  segmentReportLoading: boolean;
  selectedSegment: CustomSegment | null;
  onSegmentSelect: (id: string | null) => void;
}

function SmartSegmentReport({
  segmentReportData,
  segmentReportLoading,
  selectedSegment,
  onSegmentSelect,
}: SmartSegmentReportProps) {
  const lite_segments =
    (Array.isArray(segmentReportData) ? segmentReportData : [])?.map(segment => ({
      name: i18n.language?.startsWith('ar') && segment.name_ar ? segment.name_ar : segment.name,
      icon: segment.icon,
      id: segment.segment_id,
    })) || [];

  if (segmentReportLoading) {
    return <SegmentReportSkeleton />;
  }

  return (
    <div className="px-4  space-y-2 w-full min-w-0 animate-fade-in-up">
      {/* Scrollable Segments */}
      <ScrollableSegments
        segments={lite_segments}
        selectedSegmentId={selectedSegment?.segment_id || null}
        onSegmentSelect={onSegmentSelect}
      />

      {/* Segment Detail Panel */}
      {selectedSegment && (
        <DetailedSegment
          segmentReportData={segmentReportData}
          selectedSegmentId={selectedSegment.segment_id}
          setSelectedSegmentId={onSegmentSelect}
        />
      )}
    </div>
  );
}

export default SmartSegmentReport;
