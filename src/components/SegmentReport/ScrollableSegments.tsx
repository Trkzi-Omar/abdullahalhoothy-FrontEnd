import ScrollContainer from 'react-indiana-drag-scroll';
import { useEffect, useRef } from 'react';
import urls from '../../urls.json';

interface ScrollableSegmentsProps {
  segments: Array<{
    name: string;
    icon: string;
    id: string;
  }>;
  selectedSegmentId: string | null;
  onSegmentSelect: (id: string) => void;
}

function ScrollableSegments({
  segments,
  selectedSegmentId,
  onSegmentSelect,
}: ScrollableSegmentsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedCardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to center the selected segment
  useEffect(() => {
    if (selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedSegmentId]);

  return (
    <div className="w-full max-w-full overflow-hidden">
      <ScrollContainer
        innerRef={scrollContainerRef}
        className="flex gap-8 cursor-grab active:cursor-grabbing scrollbar-hide p-5"
        hideScrollbars={true}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          display: 'flex',
          width: '100%',
        }}
      >
        {segments.map((segment, index) => {
          const isSelected = segment.id === selectedSegmentId;

          return (
            <div
              key={segment.id}
              ref={isSelected ? selectedCardRef : null}
              onClick={() => onSegmentSelect(segment.id)}
              className={`flex-shrink-0 size-[180px] relative group cursor-pointer transition-all shadow-[0_3px_14px_#31045e99]  ${
                isSelected ? 'scale-[1.03] hover:scale-110' : 'hover:scale-[1.03]'
              }`}
            >
              {/* Card Container */}
              <div
                className={`relative w-full  overflow-hidden shadow-md hover:shadow-xl transition-all ${
                  isSelected ? ' outline-[4px] outline-[#582c83] outline' : ''
                }`}
              >
                {/* Segment Image */}
                <div className="relative bg-gradient-to-br from-purple-600 to-purple-800 w-full">
                  <img
                    src={urls.REACT_APP_API_URL.replace('/fastapi', '') + '/' + segment.icon}
                    alt={segment.name}
                    className="w-full h-full"
                    onError={e => {
                      // Fallback gradient if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {/* Numbered Badge */}
                  <div className="absolute top-0 left-0 bg-[#582c83] text-white text-xs font-semibold size-[18px] text-center">
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                </div>

                {/* Card Footer with Title */}
                <div
                  className={`px-3 py-2 text-center transition-colors  bg-[linear-gradient(180deg,#582c8300_20%,#582c83_100%)] absolute bottom-0 left-0 h-full flex items-end justify-center w-full`}
                >
                  <h3 className="text-sm font-semibold truncate text-white">{segment.name}</h3>
                </div>
              </div>
            </div>
          );
        })}
      </ScrollContainer>
    </div>
  );
}

export default ScrollableSegments;
