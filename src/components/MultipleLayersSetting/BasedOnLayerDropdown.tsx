import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import { BasedOnLayerDropdownProps } from '../../types/allTypesAndInterfaces';
import { formatSubcategoryName } from '../../utils/helperFunctions';
import { HexColorPicker } from 'react-colorful';

interface ExtendedBasedOnLayerDropdownProps extends BasedOnLayerDropdownProps {
  onRecolorColorChange?: (color: string) => void;
}

export default function BasedOnLayerDropdown({ 
  layerIndex, 
  onRecolorColorChange 
}: ExtendedBasedOnLayerDropdownProps) {
  const {
    basedOnLayerId,
    setBasedOnLayerId,
    geoPoints,
    basedOnProperty,
    setBasedOnProperty,
    nameInputs,
    setNameInputs,
    selectedOption,
    onColorChange,
    setPropertyThreshold,
    coverageType,
    setCoverageType,
    coverageValue,
    setCoverageValue,
    comparisonType,
    setComparisonType,
  } = useCatalogContext();
  
  const availableLayers = geoPoints.map(layer => ({
    id: layer.prdcer_lyr_id,
    name: layer.prdcer_layer_name || `Layer ${layer.layerId}`,
  }));
  
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const filterableProperties = [
    'id',
    'phone',
    'address',
    'priceLevel',
    'primaryType',
    'rating',
    'heatmap_weight',
    'user_ratings_total',
    'popularity_score_category',
    'popularity_score',
  ];
  const availableTypes = [
    ...new Set(
      geoPoints.flatMap(layer => layer.features.flatMap(feature => feature.properties.types))
    ),
  ];

  const [isOpen, setIsOpen] = useState(false);
  const [enableSecondSentence, setEnableSecondSentence] = useState(false);
  const [propertyValue, setPropertyValue] = useState('');

  const pickerRef = useRef<HTMLDivElement>(null);

  const currentLayerName = geoPoints[layerIndex]?.prdcer_layer_name || `Layer ${layerIndex + 1}`;

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (onColorChange) {
      onColorChange(color);
    }
    // Call the recolor callback if it exists
    if (onRecolorColorChange) {
      onRecolorColorChange(color);
    }
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation();
    setBasedOnLayerId(event.target.value);
  };

  const handleMetricChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation();
    setBasedOnProperty(event.target.value);
    setNameInputs(['']);
    setPropertyValue('');
  };

  // Handler for comparison type change
  const handleComparisonTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setComparisonType(event.target.value as 'more' | 'less');
  };

  // For recolor mode, use current layer's properties. For filter mode, use comparison layer's properties
  const metrics = useMemo(() => {
    const targetLayerId = selectedOption === 'recolor' ? geoPoints[layerIndex]?.prdcer_lyr_id : basedOnLayerId;
    
    const filteredMetrics = geoPoints
      .filter(layer => layer.prdcer_lyr_id === targetLayerId)
      .map(layer => layer.properties)
      .flat()
      .filter(metric => metric !== null);

    return Array.from(new Set(filteredMetrics));
  }, [geoPoints, basedOnLayerId, selectedOption, layerIndex]);

  const [inputValue, setInputValue] = useState('');
  const [threshold, setThreshold] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThreshold = e.target.value;
    setThreshold(newThreshold);

    if (setPropertyThreshold) {
      setPropertyThreshold(newThreshold);
    }
  };

  const handleSelectThresholdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newThreshold = e.target.value;
    setThreshold(newThreshold);

    if (setPropertyThreshold) {
      setPropertyThreshold(newThreshold);
    }
  };

  const handleCoverageTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setCoverageType(newType);
  };

  const handleCoverageValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCoverageValue(newValue);
  };

  const handlePropertyValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPropertyValue(e.target.value);
  };

  const handlePropertyValueSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPropertyValue(e.target.value);
  };

  const handleSecondSentenceToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setEnableSecondSentence(enabled);
    if (!enabled) {
      // Clear the additional filter properties when disabled
      setBasedOnProperty('');
      setPropertyValue('');
      if (setPropertyThreshold) {
        setPropertyThreshold('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim() !== '') {
        setNameInputs([...nameInputs, inputValue.trim()]);
        setInputValue('');
      }
    }
  };

  const handleRemoveName = (index: number) => {
    setNameInputs(nameInputs.filter((_, i) => i !== index));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!pickerRef.current) {
        return;
      }

      if (!pickerRef.current.contains(event.target as Node)) {
        console.log('Closing picker...');
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Render for FILTER option - sentence-like interface
  if (selectedOption === 'filter') {
    return (
      <div className="ms-2.5 flex flex-col space-y-4">
        {/* First Sentence - Always available for filtering */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-700">Keep only</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
              {currentLayerName}
            </span>
            <span className="text-gray-700">that are</span>
            <select
              value={comparisonType}
              onChange={handleComparisonTypeChange}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="less">less</option>
              <option value="more">more</option>
            </select>
            <span className="text-gray-700">than</span>
            <input
              type="number"
              value={coverageValue}
              onChange={handleCoverageValueChange}
              placeholder=""
              className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <select
              value={coverageType}
              onChange={handleCoverageTypeChange}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="radius">kilometers</option>
              <option value="drive_time">minutes drive</option>
            </select>
            <span className="text-gray-700">from</span>
            <select
              value={basedOnLayerId || ''}
              onChange={handleSelectChange}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
            >
              <option value="">select layer</option>
              {availableLayers.map(layer => {
                const isSelf = layer.id === geoPoints[layerIndex]?.prdcer_lyr_id;
                return (
                  <option key={layer.id} value={layer.id}>
                    {(layer.name.length > 15
                      ? `${layer.name.substring(0, 15)}...`
                      : layer.name
                    ).concat(isSelf ? ' (Self)' : '')}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Toggle for second sentence */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableSecondFilter"
            checked={enableSecondSentence}
            onChange={handleSecondSentenceToggle}
            className="mr-2"
          />
          <label htmlFor="enableSecondFilter" className="text-sm text-gray-700">
            Add additional filter condition
          </label>
        </div>

        {/* Second Sentence (Optional) - Only show when enabled */}
        {enableSecondSentence && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-700">And where</span>
              <select
                value={basedOnProperty || ''}
                onChange={handleMetricChange}
                disabled={!basedOnLayerId}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 disabled:text-gray-500 min-w-[120px]"
              >
                <option value="">select property (optional)</option>
                {metrics.map(metric => (
                  <option key={metric} value={metric}>
                    {formatSubcategoryName(metric)}
                  </option>
                ))}
              </select>

              {/* Only show the value input if a property is selected */}
              {basedOnProperty && (
                <>
                  <span className="text-gray-700">is</span>
                  {basedOnProperty === 'popularity_score_category' ? (
                    <select
                      value={propertyValue}
                      onChange={handlePropertyValueSelectChange}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                    >
                      <option value="">any value</option>
                      <option value="High">High</option>
                      <option value="Very High">Very High</option>
                      <option value="Low">Low</option>
                      <option value="Very Low">Very Low</option>
                    </select>
                  ) : basedOnProperty === 'primaryType' ? (
                    <select
                      value={propertyValue}
                      onChange={handlePropertyValueSelectChange}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                    >
                      <option value="">any type</option>
                      {availableTypes.map((type, index) => (
                        <option key={index} value={type}>
                          {type
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (char: any) => char.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={propertyValue}
                      onChange={handlePropertyValueChange}
                      placeholder={`any ${basedOnProperty.replace(/_/g, ' ')}`}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render for RECOLOR option - sentence-like interface similar to filter
  if (selectedOption === 'recolor') {
    return (
      <div className="ms-2.5 flex flex-col space-y-4">
        {/* First Sentence - Always available for recoloring */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-700">Recolor</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
              {currentLayerName}
            </span>
            <span className="text-gray-700">that are</span>
            <select
              value={comparisonType}
              onChange={handleComparisonTypeChange}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="less">less</option>
              <option value="more">more</option>
            </select>
            <span className="text-gray-700">than</span>
            <input
              type="number"
              value={coverageValue}
              onChange={handleCoverageValueChange}
              placeholder=""
              className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <select
              value={coverageType}
              onChange={handleCoverageTypeChange}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="radius">kilometers</option>
              <option value="drive_time">minutes drive</option>
            </select>
            <span className="text-gray-700">from</span>
            <select
              value={basedOnLayerId || ''}
              onChange={handleSelectChange}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
            >
              <option value="">select layer</option>
              {availableLayers.map(layer => {
                const isSelf = layer.id === geoPoints[layerIndex]?.prdcer_lyr_id;
                return (
                  <option key={layer.id} value={layer.id}>
                    {(layer.name.length > 15
                      ? `${layer.name.substring(0, 15)}...`
                      : layer.name
                    ).concat(isSelf ? ' (Self)' : '')}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Toggle for second sentence */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableSecondRecolor"
            checked={enableSecondSentence}
            onChange={handleSecondSentenceToggle}
            className="mr-2"
          />
          <label htmlFor="enableSecondRecolor" className="text-sm text-gray-700">
            Add additional recolor condition
          </label>
        </div>

        {/* Second Sentence (Optional) - Only show when enabled */}
        {enableSecondSentence && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-700">And where</span>
              <select
                value={basedOnProperty || ''}
                onChange={handleMetricChange}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
              >
                <option value="">select property (optional)</option>
                {metrics.map(metric => (
                  <option key={metric} value={metric}>
                    {formatSubcategoryName(metric)}
                  </option>
                ))}
              </select>

              {/* Only show the value input if a property is selected */}
              {basedOnProperty && (
                <>
                  <span className="text-gray-700">is</span>
                  {basedOnProperty === 'popularity_score_category' ? (
                    <select
                      value={threshold}
                      onChange={handleSelectThresholdChange}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                    >
                      <option value="">any value</option>
                      <option value="High">High</option>
                      <option value="Very High">Very High</option>
                      <option value="Low">Low</option>
                      <option value="Very Low">Very Low</option>
                    </select>
                  ) : basedOnProperty === 'primaryType' ? (
                    <select
                      value={threshold}
                      onChange={handleSelectThresholdChange}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                    >
                      <option value="">any type</option>
                      {availableTypes.map((type, index) => (
                        <option key={index} value={type}>
                          {type
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (char: any) => char.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  ) : basedOnProperty === 'name' ? (
                    <div className="flex flex-wrap gap-2 border border-gray-300 p-2 rounded-md bg-white">
                      {nameInputs
                        .filter(name => name.trim() !== '')
                        .map((name, index) => (
                          <div
                            key={index}
                            className="flex items-center text-black border-2 rounded-xl px-2 py-0 text-xs"
                          >
                            {name}
                            <button
                              onClick={() => handleRemoveName(index)}
                              className="ml-2 text-red-500 font-bold text-xs shadow-sm p-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className="bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[120px] outline-none"
                        placeholder="Type and press comma..."
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={threshold}
                      onChange={handleInputThresholdChange}
                      placeholder={`any ${basedOnProperty.replace(/_/g, ' ')}`}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Color Selection - Always show for recolor */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-700">Using color</span>
            <div className="relative" ref={pickerRef}>
              <button
                className="w-16 h-8 rounded-md border border-gray-300 shadow-sm"
                style={{ backgroundColor: selectedColor }}
                onClick={() => setIsOpen(!isOpen)}
              />
              {isOpen && (
                <div className="absolute top-10 left-0 bg-white p-2 border border-gray-300 shadow-lg rounded-md z-50">
                  <HexColorPicker color={selectedColor} onChange={handleColorChange} />
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">{selectedColor}</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to original render (shouldn't reach here with current options)
  return null;
}