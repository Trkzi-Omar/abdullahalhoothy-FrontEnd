import { useEffect } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import { useMapContext } from '../../context/MapContext';
export function useMapStyle() {
  const { mapRef, shouldInitializeFeatures } = useMapContext();
  const map = mapRef.current;
  const { setGeoPoints } = useCatalogContext();
  const { currentStyle } = useCatalogContext();

  useEffect(() => {
    if (!shouldInitializeFeatures || !map) return;

    const handleStyleLoad = () => {
      setGeoPoints(prevGeoPoints => prevGeoPoints.map(layer => ({ ...layer })));
    };

    map.once('styledata', handleStyleLoad);

    return () => {
      map?.off('styledata', handleStyleLoad);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef, currentStyle, shouldInitializeFeatures, setGeoPoints]);
}
