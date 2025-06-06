import React from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import StatisticsPopup from './StatisticsPopup';

export default function StatisticsPopups() {
  const { polygons } = useCatalogContext();
  if (!polygons) return null;

  const polygonsStatisticsPopups = polygons.filter(polygon => polygon.isStatisticsPopupOpen);
  return (
    <>
      {polygonsStatisticsPopups.map((polygon, index) => (
        <StatisticsPopup key={`statistics-popup-${polygon.id}`} polygon={polygon} />
      ))}
    </>
  );
}
