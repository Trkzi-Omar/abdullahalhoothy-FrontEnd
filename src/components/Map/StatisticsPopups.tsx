import { useCatalogContext } from '../../context/CatalogContext';
import StatisticsPopup from './StatisticsPopup';
import { PolygonFeature } from '../../types/allTypesAndInterfaces';

export default function StatisticsPopups() {
  const { polygons } = useCatalogContext();
  if (!polygons) return null;
  const polygonsStatisticsPopups = polygons.filter(
    (polygon: PolygonFeature) => polygon.isStatisticsPopupOpen
  );
  return (
    <>
      {polygonsStatisticsPopups.map((polygon, index) => (
        <StatisticsPopup key={`statistics-popup-${polygon.id}`} polygon={polygon} />
      ))}
    </>
  );
}
