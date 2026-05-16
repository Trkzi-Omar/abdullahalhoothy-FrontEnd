import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import 'ag-grid-community/styles/ag-grid.css'; // Mandatory CSS required by the grid
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Optional Theme applied to the grid
import { TabularData, Feature } from '../../types/allTypesAndInterfaces';
import { ColDef } from 'ag-grid-community';
import { useCatalogContext } from '../../context/CatalogContext';
import { isIntelligentLayer } from '../../utils/layerUtils';
import { t } from '../../i18n';

// Function to map a feature to tabular data
function mapFeatureToTabularData(feature: Feature): TabularData {
  return {
    name: feature.properties.name,
    formatted_address: feature.properties.address,
    website: feature.properties.website,
    rating: Number(feature.properties.rating),
    user_ratings_total: Number(feature.properties.user_ratings_total),
  };
}

const Dataview: React.FC = () => {
  const [businesses, setBusinesses] = useState<TabularData[]>([]);
  const { geoPoints } = useCatalogContext();
  const columnDefs: ColDef<TabularData>[] = [
    { headerName: t("table-name"), field: 'name', sortable: true, filter: true },
    {
      headerName: t("address"),
      field: 'formatted_address',
      sortable: true,
      filter: true,
    },
    {
      headerName: t("website"),
      field: 'website',
      sortable: true,
      filter: true,
    },
    {
      headerName: t("rating"),
      field: 'rating',
      sortable: true,
    },
    {
      headerName: t("total-rating"),
      field: 'user_ratings_total',
      sortable: true,
    },
  ];

  useEffect(() => {
    if (geoPoints.length > 0) {
      const visibleLayers = geoPoints.filter(mapFeature => !isIntelligentLayer(mapFeature));

      // Use flatMap to combine features from all non-intelligent layers
      const tabularData = visibleLayers.flatMap(mapFeature =>
        mapFeature.features.map(mapFeatureToTabularData)
      );
      setBusinesses(tabularData);
    } else {
      setBusinesses([]);
    }
  }, [geoPoints]);

  return (
    <div className="w-full h-full overflow-y-auto">
      <div
        className="ag-theme-quartz-dark"
        style={{ height: '100%', width: '100%', backgroundColor: '#182230' }}
      >
        <AgGridReact
          columnDefs={columnDefs}
          rowData={businesses}
          pagination={true}
          paginationPageSize={10}
        />
      </div>
    </div>
  );
};

export default Dataview;
