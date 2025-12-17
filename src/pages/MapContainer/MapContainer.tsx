import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import './MapContainer.css';

import { useMapInitialization } from '../../hooks/map/useMapInitialization';
import { useMapBounds } from '../../hooks/map/useMapBounds';
import { useMapControls } from '../../hooks/map/useMapControls';
import { useMapLayers } from '../../hooks/map/useMapLayers';
import { usePolygonHandlers } from '../../hooks/map/usePolygonHandlers';
import { useLegendManager } from '../../hooks/map/useLegendManager';
import { useMapStyle } from '../../hooks/map/useMapStyle';
import StatisticsPopups from '../../components/Map/StatisticsPopups';
import BenchmarkControl from '../../components/Map/BenchmarkControl';
import { AreaIntelligeneControl } from '../../components/Map/AreaIntelligenceControl';
import SavedLocations from '../../components/Map/SavedLocations';
import { useMapContext } from '../../context/MapContext';
import { CaseStudyPanel } from '../../components/CaseStudy/CaseStudyPanel';
function Container() {
  const { shouldInitializeFeatures, mapContainerRef } = useMapContext();

  useMapInitialization();
  useMapBounds();
  useMapControls();
  useMapLayers();
  usePolygonHandlers();
  useLegendManager();
  useMapStyle();

  return (
    <>
      <div className="flex-1 relative w-full h-full" id="map-container">
        <div className="w-full h-full overflow-hidden" ref={mapContainerRef} />
        <StatisticsPopups />
        {shouldInitializeFeatures && (
          <>
            <div className="absolute top-4 left-4 flex items-center gap-2 z-[1]">
              <AreaIntelligeneControl />
              <BenchmarkControl />
            </div>
            <SavedLocations />
          </>
        )}
        <CaseStudyPanel />
      </div>
    </>
  );
}

export default function MapContainer() {
  return <Container />;
}
