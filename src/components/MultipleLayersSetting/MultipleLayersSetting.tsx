import React, { useState, useEffect, useRef } from 'react';
import { FaTrash } from 'react-icons/fa';
import ColorSelect from '../ColorSelect/ColorSelect';
import { useCatalogContext } from '../../context/CatalogContext';
import { MultipleLayersSettingProps, DisplayType } from '../../types/allTypesAndInterfaces';
import DropdownColorSelect from '../ColorSelect/DropdownColorSelect';
import { IoIosArrowDropdown } from 'react-icons/io';
import { RiCloseCircleLine } from 'react-icons/ri';
import urls from '../../urls.json';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../services/apiRequest';
import BasedOnLayerDropdown from './BasedOnLayerDropdown';
import { toast } from 'sonner';

const initialBasedon = 'radius';
const initialRadius = 1000;

const getFormattedThreshold = (value: string, basedOn: string | null) => {
  if (
    basedOn === 'id' ||
    basedOn === 'address' ||
    basedOn === 'phone' ||
    basedOn === 'priceLevel' ||
    basedOn === 'primaryType' ||
    basedOn === '' ||
    basedOn === 'popularity_score_category'
  ) {
    return value;
  }

  if (
    basedOn === 'rating' ||
    basedOn === 'heatmap_weight' ||
    basedOn === 'user_ratings_total' ||
    basedOn === 'popularity_score'
  ) {
    return parseFloat(value) || 0;
  }

  return value;
};

function MultipleLayersSetting(props: MultipleLayersSettingProps) {
  const { layerIndex } = props;
  const {
    geoPoints,
    setGeoPoints,
    updateLayerDisplay,
    updateLayerHeatmap,
    restoreLayer,
    isAdvanced,
    setIsAdvanced,
    openDropdownIndices,
    setOpenDropdownIndices,
    updateDropdownIndex,
    setColors,
    setReqGradientColorBasedOnZone,
    colors,
    chosenPallet,
    setChosenPallet,
    selectedBasedon,
    setSelectedBasedon,
    layerColors,
    setLayerColors,
    setGradientColorBasedOnZone,
    setIsAdvancedMode,
    setIsRadiusMode,
    updateLayerGrid,
    updateLayerColor,
    basedOnLayerId,
    basedOnProperty,
    setIsLoading,
    isLoading,
    handleFilteredZone,
    handleNameBasedColorZone,
    nameInputs,
    setNameInputs,
    selectedOption,
    setSelectedOption,
    coverageType,
    setCoverageType,
    coverageValue,
    setCoverageValue,
    propertyThreshold,
    setPropertyThreshold,
    comparisonType,
  } = useCatalogContext();
  const layer = geoPoints[layerIndex];

  const { layer_name, layer_legend, is_zone_layer, display, is_heatmap, is_grid, city_name } =
    layer;
  const [, setIsZoneLayer] = useState(is_zone_layer);
  const [isDisplay, setIsDisplay] = useState(display);
  const [isHeatmap, setIsHeatmap] = useState(is_heatmap);
  const [isGrid, setIsGrid] = useState(is_grid);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { authResponse } = useAuth();
  const [, setIsError] = useState<Error | null>(null);
  const [radiusInput, setRadiusInput] = useState<number | string>(layer.radius_meters || '');

  // Add state for the recolor color selection
  const [recolorSelectedColor, setRecolorSelectedColor] = useState<string>('#ff0000');

  const dropdownIndex = layerIndex ?? -1;
  const isOpen = openDropdownIndices[1] === dropdownIndex;

  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [deletedTimestamp, setDeletedTimestamp] = useState<number | null>(null);

  const [displayType, setDisplayType] = useState(
    layer.is_gradient
      ? DisplayType.REGULAR // Force REGULAR if gradient
      : isGrid
        ? DisplayType.GRID
        : isHeatmap
          ? DisplayType.HEATMAP
          : DisplayType.REGULAR
  );

  useEffect(function () {
    handleGetGradientColors();
    setSelectedBasedon(layer.basedon || initialBasedon);
    // Only set initial values if they exist, otherwise keep empty
    if (layer.radius_meters) {
      setRadiusInput(layer.radius_meters);
      setCoverageValue(String(layer.radius_meters));
    }
  }, []);

  useEffect(
    function () {
      setIsZoneLayer(layer.is_zone_layer);
      setIsDisplay(layer.display);
      setIsHeatmap(layer.is_heatmap);
    },
    [layer.is_zone_layer, layer.display, layer.is_heatmap]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsAdvanced(false);
        updateDropdownIndex(1, null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setOpenDropdownIndices]);

  function handleDisplayChange() {
    updateLayerDisplay(layerIndex, !isDisplay);
    setIsDisplay(!isDisplay);
  }

  function handleHeatMapChange() {
    if (isGrid) {
      setIsGrid(false);
    }
    updateLayerHeatmap(layerIndex, !isHeatmap);
    setIsHeatmap(!isHeatmap);
  }

  function handleRemoveLayer() {
    setIsAdvancedMode(prev => {
      const newMode = { ...prev };
      delete newMode[`circle-layer-${layerIndex}`];
      return newMode;
    });

    // Remove this layer from gradient colors
    setGradientColorBasedOnZone(prev => prev.filter(item => item.layerId !== layerIndex));

    // Remove this layer from geoPoints
    setGeoPoints(prev => prev.filter((_, index) => index !== layerIndex));

    // Remove this layer's color
    setLayerColors(prev => {
      const newColors = { ...prev };
      delete newColors[layerIndex];
      return newColors;
    });

    // Reset chosen pallet only if it was this layer
    if (chosenPallet === layerIndex) {
      setChosenPallet(null);
    }
  }

  function toggleDropdown(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();

    if (isOpen) {
      updateDropdownIndex(1, null);
    } else {
      updateDropdownIndex(1, dropdownIndex);
    }
  }

  async function handleGetGradientColors() {
    try {
      const res = await apiRequest({
        url: urls.fetch_gradient_colors,
        method: 'get',
      });
      setColors(res.data.data);
    } catch (error) {
      setIsError(error instanceof Error ? error : new Error(String(error)));
      console.error('error fetching gradient colors', error);
    }
  }

  function handleApplayeradius(newRadius: number | string) {
    if (!newRadius) {
      return null;
    } else {
      setIsRadiusMode(true);
      const layer_id =
        layerIndex == 0
          ? geoPoints[0]?.layer_id
          : layerIndex == 1
            ? geoPoints[1]?.layer_id
            : '';
      const change_layer_id =
        layerIndex == 0
          ? geoPoints[1]?.layer_id
          : layerIndex == 1
            ? geoPoints[0]?.layer_id
            : '';

      const updatedLayer = {
        ...geoPoints[layerIndex],
        radius_meters: newRadius || 1000,
      };
      setGeoPoints(prev => {
        const updated = [...prev];
        updated[layerIndex] = updatedLayer;
        return updated;
      });

      setReqGradientColorBasedOnZone({
        layer_id,
        user_id: authResponse?.localId || '',
        color_grid_choice: colors[chosenPallet || 0],
        change_layer_id,
        change_layer_name: geoPoints[layerIndex]?.layer_name || `Layer ${layerIndex}`,
        based_on_layer_id: layer_id,
        based_on_layer_name: geoPoints[layerIndex]?.layer_name || `Layer ${layerIndex}`,
        threshold: getFormattedThreshold(propertyThreshold, basedOnProperty),
        coverage_value: newRadius,
        coverage_property: selectedBasedon,
        color_based_on: basedOnProperty || '',
      });
    }
  }

  function handleGridChange() {
    if (isHeatmap) {
      updateLayerHeatmap(layerIndex, false);
      setIsHeatmap(false);
    }
    updateLayerGrid(layerIndex, !isGrid);
    setIsGrid(!isGrid);
  }

  function handleRadiusInputChange(newRadius: number | string) {
    setRadiusInput(newRadius);
    setCoverageValue(String(newRadius));

    setReqGradientColorBasedOnZone((prev: any) => ({
      ...prev,
      offset_value: newRadius,
    }));
  }

  const handleColorChange = (color: string) => {
    if (layerIndex !== undefined) {
      // Update layerColors state
      setLayerColors(prev => ({
        ...prev,
        [layerIndex]: color,
      }));

      // Update geoPoints to change the map
      setGeoPoints(prev => {
        const updated = [...prev];
        updated[layerIndex] = {
          ...updated[layerIndex],
          points_color: color,
        };
        return updated;
      });

      // Update map color
      updateLayerColor(layerIndex, color);
    }
  };

  // Callback to handle recolor color changes from BasedOnLayerDropdown
  const handleRecolorColorChange = (color: string) => {
    setRecolorSelectedColor(color);
  };

  const handleThresholdChange = (value: string) => {
    setPropertyThreshold(value);
  };

  const handleApplyFilter = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Validate required fields
    if (!coverageValue || !basedOnLayerId) {
      toast.error('Please fill in all required fields (distance and layer)');
      return;
    }

    setIsLoading(true);

    try {
      const currentLayer = geoPoints[layerIndex];
      const baseLayer = geoPoints.find(layer => layer.layer_id === basedOnLayerId);
      const selectedColors = colors[chosenPallet || 0];

      if (!currentLayer || !baseLayer || !selectedColors) {
        console.error('Missing required fields');
        toast.error('Missing required fields for filtering');
        return;
      }

      const filterRequest = {
        layer_id: currentLayer.layer_id,
        user_id: authResponse?.localId || '',
        color_grid_choice: selectedColors,
        change_layer_id: currentLayer.layer_id,
        change_layer_name: currentLayer.layer_name || `Layer ${currentLayer.layerId}`,
        change_layer_current_color: currentLayer.points_color || '#000000', // Send current color
        based_on_layer_id: baseLayer.layer_id,
        based_on_layer_name: baseLayer.layer_name || `Layer ${baseLayer.layerId}`,
        coverage_property: coverageType,
        coverage_value: parseInt(coverageValue) || 0,
        color_based_on: basedOnProperty || '',
        list_names: nameInputs.filter(name => name.trim() !== ''),
        threshold: getFormattedThreshold(propertyThreshold, basedOnProperty),
        change_layer_new_color: recolorSelectedColor, // Use the selected color
        comparison_type: comparisonType, // Add comparison_type to the request
      };

      console.log('Filter Request:', filterRequest);

      const filterResponse = await handleFilteredZone(filterRequest);

      if (!filterResponse || filterResponse.length === 0) {
        toast.error('No features found based on the given criteria.');
        return;
      }

      setGeoPoints(prevGeoPoints =>
        prevGeoPoints.map(layer => {
          const matchedFilterData = filterResponse.filter(
            filter => filter.bknd_dataset_id === layer.layer_id
          );

          if (matchedFilterData.length > 0) {
            const mergedFeatures = matchedFilterData.flatMap(filter => filter.features || []);

            return {
              ...layer,
              features: mergedFeatures,
              points_color: matchedFilterData[0].points_color || layer.points_color,
            };
          }

          return layer; // Keep other layers unchanged
        })
      );
    } catch (error: any) {
      console.error('Filter error:', error);
      toast.error('Server error (500). Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplayerecolor = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Validate required fields for recolor
    if (!coverageValue || !basedOnLayerId) {
      toast.error('Please fill in all required fields (distance and layer)');
      return;
    }

    setIsLoading(true);

    try {
      const currentLayer = geoPoints[layerIndex];
      const baseLayer = geoPoints.find(layer => layer.layer_id === basedOnLayerId);
      const currentLayerId = currentLayer.layer_id;
      const selectedColors = colors[chosenPallet || 0];

      if (!currentLayer || !baseLayer || !selectedColors) {
        toast.error('Missing required fields for recoloring');
        return;
      }

      // Prepare Gradient API request
      const gradientRequest = {
        layer_id: currentLayer.layer_id,
        user_id: authResponse?.localId || '',
        color_grid_choice: selectedColors,
        change_layer_id: currentLayer.layer_id,
        change_layer_name: currentLayer.layer_name || `Layer ${currentLayer.layerId}`,
        change_layer_current_color: currentLayer.points_color || '#000000', // Send current color
        based_on_layer_id: baseLayer.layer_id,
        based_on_layer_name: baseLayer.layer_name || `Layer ${baseLayer.layerId}`,
        coverage_property: coverageType,
        threshold: getFormattedThreshold(propertyThreshold, basedOnProperty),
        coverage_value: parseInt(coverageValue) || 0,
        color_based_on: basedOnProperty || '',
        list_names: nameInputs.filter(name => name.trim() !== ''),
        change_layer_new_color: recolorSelectedColor, // Use the selected recolor color
        comparison_type: comparisonType, // Add comparison_type to the request
      };

      console.log('Recolor Request:', gradientRequest);

      setReqGradientColorBasedOnZone(gradientRequest);

      //  Call Gradient API
      const gradientData = await handleNameBasedColorZone(gradientRequest);

      if (!gradientData || gradientData.length === 0) {
        throw new Error('No gradient data received.');
      }

      // Process gradient data for UI update
      const combinedFeatures = gradientData.flatMap(group =>
        group.features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            gradient_color: group.points_color,
            gradient_legend: group.layer_legend,
          },
        }))
      );

      setGeoPoints(prev => {
        return prev.map(point => {
          if (point.layer_id === currentLayerId) {
            return {
              ...point,
              layer_name: gradientData[0]?.layer_name,
              layer_legend: gradientData.map(g => g.layer_legend).join(' | '),
              records_count: gradientData.reduce((sum, g) => sum + g.records_count, 0),
              features: combinedFeatures,
              gradient_groups: gradientData.map(group => ({
                color: group.points_color || '#000000',
                legend: group.layer_legend || '',
                count: group.records_count,
              })),
              is_gradient: true,
              gradient_based_on: basedOnLayerId || '',
            };
          }
          return point;
        });
      });
    } catch (error) {
      console.error('Error applying dynamic color:', error);
      setIsError(error instanceof Error ? error : new Error('Failed to apply dynamic color'));
      toast.error('Failed to apply recoloring');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetricChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedBasedon(value);
    setCoverageType(value);

    setGeoPoints(prev =>
      prev.map((point, idx) => (idx === layerIndex ? { ...point, basedon: value } : point))
    );
  };

  // Handler for coverage type changes from BasedOnLayerDropdown
  const handleCoverageTypeChange = (type: string) => {
    setCoverageType(type);
  };

  // Handler for coverage value changes from BasedOnLayerDropdown
  const handleCoverageValueChange = (value: string) => {
    setCoverageValue(value);
  };

  useEffect(() => {
    const initialColor = layer?.points_color;
    if (initialColor && layerColors[layerIndex] !== initialColor) {
      setLayerColors(prev => ({
        ...prev,
        [layerIndex]: initialColor,
      }));
    }
  }, [layer, layerIndex, layerColors]);

  useEffect(() => {
    const currentLayer = geoPoints[layerIndex];
    if (currentLayer?.points_color && layerColors[layerIndex] !== currentLayer.points_color) {
      setLayerColors(prev => ({
        ...prev,
        [layerIndex]: currentLayer.points_color,
      }));
    }
  }, [geoPoints, layerIndex, layerColors]);

  const handleDisplayTypeChange = (newType: (typeof DisplayType)[keyof typeof DisplayType]) => {
    if (layer.is_gradient) return;

    const isHeatmapNew = newType === DisplayType.HEATMAP;
    const isGridNew = newType === DisplayType.GRID;

    setDisplayType(newType);
    setIsHeatmap(isHeatmapNew);
    setIsGrid(isGridNew);

    if (isHeatmapNew) {
      setGeoPoints(prev =>
        prev.map((point, idx) => {
          if (idx === layerIndex) {
            return {
              ...point,
              is_heatmap: true,
              features: point.features.map(feature => ({
                ...feature,
                properties: {
                  ...feature.properties,
                  heatmap_weight: 1,
                },
              })),
            };
          }
          return point;
        })
      );
    }

    updateLayerHeatmap(layerIndex, isHeatmapNew);
    updateLayerGrid(layerIndex, isGridNew);
  };

  return (
    <div className="w-full">
      {!isOpen && (
        <div
          className={
            'flex justify-between items-center gap-2.5 py-6 px-3.5 border border-[#ddd] rounded-lg mt-5 bg-white shadow relative transition-all duration-300 h-20 w-full'
          }
        >
          <button
            className="bg-transparent border-none text-[#ff4d4f] text-base cursor-pointer absolute top-[2px] right-[2px] rounded-full h-5 w-5 flex justify-center items-center transition-colors duration-300 hover:bg-[#ff4d4f] hover:text-white"
            onClick={handleRemoveLayer}
          >
            <FaTrash />
          </button>

          <div className="font-bold text-[#333] w-[105px] overflow-hidden">
            <span className="text-sm text-[#333] block truncate" title={layer_name}>
              {layer_name || layer_legend}
            </span>
          </div>
          <div className="flex">
            <ColorSelect layerId={layerIndex} onColorChange={handleColorChange} />
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={isDisplay}
                onChange={handleDisplayChange}
                className="w-[11px] h-[11px] cursor-pointer accent-[#28a745]"
              />
              <p className="text-[11px] my-[2px] text-[#555] whitespace-nowrap">Visible</p>
            </div>
          </div>

          <div
            onClick={e => {
              setIsAdvanced(!isAdvanced);
              if (layerIndex != undefined) {
                setIsAdvancedMode(prev => ({
                  ...prev,
                  [`circle-layer-${layerIndex}`]: true,
                }));
              }
              toggleDropdown(e);
            }}
            ref={buttonRef}
            className="text-xl cursor-pointer"
          >
            <IoIosArrowDropdown />
          </div>
        </div>
      )}

      {isOpen && (
        <div className=" w-full">
          <div className="flex flex-col gap-2 mt-4   py-3 px-4 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            <div className="flex justify-between items-center">
              <p className="text-base mb-0 capitalize font-medium">
                {layer_name || layer_legend}
              </p>
              <div className="flex items-center  gap-2">
                <p className="text-xs mb-0 font-medium">Advanced</p>
                <div
                  onClick={e => {
                    setIsAdvanced(!isAdvanced);
                    toggleDropdown(e);
                  }}
                  className="text-lg cursor-pointer"
                  ref={buttonRef}
                >
                  <RiCloseCircleLine />
                </div>
              </div>
            </div>

            <p className="text-sm mb-0 font-medium">Change display type</p>

            <div
              className={`flex gap-2 ms-2.5 text-sm ${layer.is_gradient ? 'cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="regular-display"
                  name="display-type"
                  value={DisplayType.REGULAR}
                  checked={layer.is_gradient || displayType === DisplayType.REGULAR}
                  onChange={e =>
                    handleDisplayTypeChange(
                      e.target.value as (typeof DisplayType)[keyof typeof DisplayType]
                    )
                  }
                  className="w-[11px] h-[11px] cursor-pointer accent-[#28a745]"
                  disabled={layer.is_gradient}
                />
                <label
                  htmlFor="regular-display"
                  className={`my-[2px] whitespace-nowrap cursor-pointer ${
                    layer.is_gradient ? 'text-gray-400' : 'text-[#555]'
                  }`}
                >
                  Points
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="heatmap-display"
                  name="display-type"
                  value={DisplayType.HEATMAP}
                  checked={!layer.is_gradient && displayType === DisplayType.HEATMAP}
                  onChange={e =>
                    handleDisplayTypeChange(
                      e.target.value as (typeof DisplayType)[keyof typeof DisplayType]
                    )
                  }
                  className="w-[11px] h-[11px] cursor-pointer accent-[#28a745]"
                  disabled={layer.is_gradient}
                />
                <label
                  htmlFor="heatmap-display"
                  className={`my-[2px] whitespace-nowrap cursor-pointer ${
                    layer.is_gradient ? 'text-gray-400' : 'text-[#555]'
                  }`}
                >
                  Heatmap
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="grid-display"
                  name="display-type"
                  value={DisplayType.GRID}
                  checked={!layer.is_gradient && displayType === DisplayType.GRID}
                  onChange={e =>
                    handleDisplayTypeChange(
                      e.target.value as (typeof DisplayType)[keyof typeof DisplayType]
                    )
                  }
                  className="w-[11px] h-[11px] cursor-pointer accent-[#28a745]"
                  disabled={layer.is_gradient}
                />
                <label
                  htmlFor="grid-display"
                  className={`my-[2px] whitespace-nowrap cursor-pointer ${
                    layer.is_gradient ? 'text-gray-400' : 'text-[#555]'
                  }`}
                >
                  Grid
                </label>
              </div>
            </div>
            <div className="flex  justify-between items-center">
              <p className="font-semibold"></p>
              <div className="flex border-b">
                <button
                  onClick={() => setSelectedOption('recolor')}
                  className={`px-4 py-2 text-sm font-medium flex text-center items-center gap-2 border-b-2 ${
                    selectedOption === 'recolor'
                      ? 'border-primary text-primary font-bold' // Active tab styling
                      : 'border-transparent text-gray-500 hover:text-black'
                  }`}
                >
                  Recolor
                </button>
                <button
                  onClick={() => setSelectedOption('filter')}
                  className={`px-4 py-2 text-sm font-medium flex items-center text-center gap-2 border-b-2 ${
                    selectedOption === 'filter'
                      ? 'border-primary text-primary font-bold' // Active tab styling
                      : 'border-transparent text-gray-500 hover:text-black'
                  }`}
                >
                  Filter
                </button>
              </div>
            </div>

            <p className="text-sm mt-2 mb-0 font-medium"></p>

            <BasedOnLayerDropdown
              layerIndex={layerIndex}
              onRecolorColorChange={handleRecolorColorChange}
            />

            <div>
              {selectedOption === 'recolor' ? (
                <button
                  onClick={e => handleApplayerecolor(e)}
                  disabled={isLoading}
                  className="w-full h-7 text-sm bg-[#115740] text-white font-semibold rounded-md hover:bg-[#123f30] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Applying...
                    </span>
                  ) : (
                    'Recolor'
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={e => handleApplyFilter(e)}
                    disabled={isLoading}
                    className="w-full h-7 text-sm bg-[#115740] text-white font-semibold rounded-md hover:bg-[#123f30] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Applying...
                      </span>
                    ) : (
                      'Filter'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add restore prompt */}
      {showRestorePrompt && deletedTimestamp && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 flex items-center gap-4">
          <span>Layer removed.</span>
          <button
            onClick={() => {
              restoreLayer(deletedTimestamp);
              setShowRestorePrompt(false);
            }}
            className="text-[#115740] hover:text-[#123f30] font-medium"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

export default MultipleLayersSetting;
