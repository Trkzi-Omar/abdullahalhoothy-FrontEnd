import { useLayerContext } from '../../context/LayerContext';
import { Progress } from '../common';
import { useCatalogContext } from '../../context/CatalogContext';
import { FiInfo } from 'react-icons/fi';

function DatasetModalContent() {
  const { reqFetchDataset, layerDataMap } = useLayerContext();
  const { geoPoints } = useCatalogContext();

  // Get layers from reqFetchDataset
  const layers = reqFetchDataset.layers || [];

  return (
    <div className="py-4 px-2 space-y-10">
      {layers.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No categories available</p>
      ) : (
        <div className="space-y-4">
          {layers.map(layer => {
            const layerData = layerDataMap[layer.id];
            const progress = layerData?.progress || 0;

            // Find layer name from geoPoints which has prdcer_layer_name
            const geoPointData = geoPoints.find(gp => String(gp.layerId) === String(layer.id));
            const layerName = geoPointData?.prdcer_layer_name || `Layer ${layer.id}`;

            return (
              <div key={layer.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{layerName}</h4>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <span className="text-sm font-semibold text-[#115740]">{progress}%</span>
                  </div>
                </div>

                <Progress value={progress} className="h-2" />
              </div>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 border border-blue-200">
        <FiInfo className="text-blue-600 text-xl" />
        <p className="text-sm text-blue-700 font-medium">
          Save the layer and then retrieve the data from Get Layers.
        </p>
      </div>
    </div>
  );
}

export default DatasetModalContent;
