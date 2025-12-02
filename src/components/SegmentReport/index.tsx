import { useEffect, useState } from 'react';
import { CustomSegmentReportResponse } from '../../types';
import ScrollableSegments from './ScrollableSegments';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { HttpReq } from '../../services/apiService';
import urls from '../../urls.json';
import { useAuth } from '../../context/AuthContext';
import DetailedSegment from './DetailedSegment';

function SmartSegmentReport() {
  const [segmentReportData, setSegmentReport] = useState<CustomSegmentReportResponse | null>(null);
  const [segmentReportLoading, setSegmentReportLoading] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const { authResponse } = useAuth();
  const idToken = authResponse?.idToken;

  async function getSegmentReport() {
    await HttpReq(
      urls.fetch_smart_segment_report,
      setSegmentReport,
      (message: string) => {
        console.log(message);
      },
      (message: string) => {
        console.log(message);
      },
      setSegmentReportLoading,
      (error: Error | null) => {
        console.log(error);
      },
      'get',
      null,
      idToken
    );
  }

  useEffect(() => {
    if (!idToken) return;
    getSegmentReport().then(() => {
      if (segmentReportData) setSelectedSegmentId(segmentReportData[0].segment_id);
    });
  }, [idToken]);

  // auto select first segment on segmentReportData change
  useEffect(() => {
    if (!segmentReportData) return;
    setSelectedSegmentId(segmentReportData[0].segment_id);
  }, [segmentReportData]);

  const lite_segments =
    (Array.isArray(segmentReportData) ? segmentReportData : [])?.map(segment => ({
      name: segment.name,
      icon: segment.icon,
      id: segment.segment_id,
    })) || [];

  const selectedSegment = segmentReportData?.find(seg => seg.segment_id === selectedSegmentId);

  return (
    <div className="px-4 py-6 space-y-6 w-full min-w-0 max-h-screen overflow-y-auto">
      {/* Scrollable Segments */}
      <ScrollableSegments
        segments={lite_segments}
        selectedSegmentId={selectedSegmentId}
        onSegmentSelect={setSelectedSegmentId}
      />

      {/* Segment Detail Panel */}
      {selectedSegment && (
        <DetailedSegment
          segmentReportData={segmentReportData}
          selectedSegmentId={selectedSegmentId}
          setSelectedSegmentId={setSelectedSegmentId}
        />
      )}
    </div>
  );
}

export default SmartSegmentReport;
