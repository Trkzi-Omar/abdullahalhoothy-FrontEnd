import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import { BasedOnLayerDropdownProps } from '../../types/allTypesAndInterfaces';
import { formatSubcategoryName } from '../../utils/helperFunctions';
import { HexColorPicker } from 'react-colorful';

export default function BasedOnLayerDropdown({
  layerIndex,
  nameInputs,
  setNameInputs,
  selectedOption,
  onColorChange,
  setPropertyThreshold,
  coverageType,
  setCoverageType,
  coverageValue,
  setCoverageValue,
}: BasedOnLayerDropdownProps) {
  const { basedOnLayerId, setBasedOnLayerId, geoPoints, basedOnProperty, setBasedOnProperty } =
    useCatalogContext();
  const availableLayers = geoPoints.map(layer => ({
    id: layer.prdcer_lyr_id,
    name: layer.prdcer_layer_name || `Layer ${layer.layerId}`,
  }));
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
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
  const [localCoverageType, setLocalCoverageType] = useState('radius');
  const [localCoverageValue, setLocalCoverageValue] = useState(''); // Changed to empty string
  const [enableSecondSentence, setEnableSecondSentence] = useState(false);
  const [propertyValue, setPropertyValue] = useState('');

  const pickerRef = useRef<HTMLDivElement>(null);

  // Get current layer name
  const currentLayerName = geoPoints[layerIndex]?.prdcer_layer_name || `Layer ${layerIndex + 1}`;

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (onColorChange) {
      onColorChange(color);
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

  const metrics = useMemo(() => {
    const filteredMetrics = geoPoints
      .filter(layer => layer.prdcer_lyr_id === basedOnLayerId)
      .map(layer => layer.properties)
      .flat()
      .filter(metric => metric !== null);

    return Array.from(new Set(filteredMetrics));
  }, [geoPoints, basedOnLayerId]);

  const handleNameChange = (index: number, value: string) => {
    const updatedNames = [...nameInputs];
    updatedNames[index] = value;
    setNameInputs(updatedNames);
  };

  const handleAddNameField = () => {
    setNameInputs([...nameInputs, '']);
  };

  const handleRemoveNameField = (index: number) => {
    setNameInputs(nameInputs.filter((_, i) => i !== index));
  };

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
    if (setCoverageType) {
      setCoverageType(newType);
    } else {
      setLocalCoverageType(newType);
    }
  };

  const handleCoverageValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (setCoverageValue) {
      setCoverageValue(newValue);
    } else {
      setLocalCoverageValue(newValue);
    }
  };

  const handlePropertyValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPropertyValue(e.target.value);
  };

  const handlePropertyValueSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPropertyValue(e.target.value);
  };

  // Handle enabling/disabling the second sentence
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

  // Use provided coverage values or fall back to local state - but don't fall back to defaults
  const currentCoverageType = coverageType !== undefined ? coverageType : localCoverageType;
  const currentCoverageValue = coverageValue !== undefined ? coverageValue : localCoverageValue;

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
            <span className="text-gray-700">that are within</span>
            <input
              type="number"
              value={currentCoverageValue}
              onChange={handleCoverageValueChange}
              placeholder=""
              className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <select
              value={currentCoverageType}
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
                          {type.replace(/_/g, ' ').replace(/\b\w/g, (char: any) => char.toUpperCase())}
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

  // Original render for RECOLOR option
  return (
    <>
      <div className="ms-2.5 flex flex-col">
        <label
          htmlFor="basedOnLayerDropdown"
          className="text-[11px] my-[2px] text-[#555] whitespace-nowrap text-sm"
        >
          Compare with Layer
        </label>
        <select
          id="basedOnLayerDropdown"
          value={basedOnLayerId || ''}
          onChange={handleSelectChange}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-2 transition duration-150 ease-in-out"
        >
          <option value="" disabled>
            Select a layer
          </option>
          {availableLayers.map(layer => {
            const isSelf = layer.id === geoPoints[layerIndex]?.prdcer_lyr_id;
            return (
              <option key={layer.id} value={layer.id}>
                {(layer.name.length > 20
                  ? `${layer.name.substring(0, 12)}...${layer.name.substring(layer.name.length - 12)}`
                  : layer.name
                ).concat(isSelf ? ' (Self)' : '')}
              </option>
            );
          })}
        </select>
      </div>
      <div className="ms-2.5 flex flex-col">
        <label
          htmlFor="basedOnPropertyDropdown"
          className="text-[11px] my-[2px] text-[#555] whitespace-nowrap text-sm"
        >
          Based on
        </label>
        <select
          id="basedOnPropertyDropdown"
          value={basedOnProperty || ''}
          disabled={!basedOnLayerId}
          onChange={handleMetricChange}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-2 transition duration-150 ease-in-out disabled:bg-gray-200 disabled:text-gray-500"
        >
          <option value="" disabled>
            Select a metric
          </option>
          {metrics.map(metric => {
            return (
              <option
                key={metric}
                value={metric}
              >
                {formatSubcategoryName(metric)}
              </option>
            );
          })}
        </select>

        {basedOnProperty === 'name' && (
          <>
            <div className="flex flex-col mt-2">
              <label className="text-[11px] text-[#555] whitespace-nowrap text-sm">
                Enter Names
              </label>

              <div className="flex flex-wrap gap-2 border border-gray-300 p-2 rounded-md bg-gray-50">
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
                  className="bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[120px] outline-none"
                  placeholder="Type and press comma..."
                />
              </div>
            </div>

            <div className="mt-3 relative " ref={pickerRef}>
              <label className="text-[11px] text-[#555] whitespace-nowrap text-sm flex flex-col">
                Pick a Color
              </label>
              <div>
                <button
                  className="w-full h-10 rounded-md border border-gray-300"
                  style={{ backgroundColor: selectedColor }}
                  onClick={() => setIsOpen(!isOpen)}
                />
              </div>
              {isOpen && (
                <div className="absolute mt-2 bg-white p-2 border border-gray-300 shadow-md rounded-md z-50">
                  <HexColorPicker color={selectedColor} onChange={handleColorChange} />
                </div>
              )}
            </div>
          </>
        )}

        {basedOnProperty && filterableProperties.includes(basedOnProperty) && (
          <>
            <div className="flex flex-col mt-2">
              <label className="text-[11px] text-[#555] whitespace-nowrap text-sm">
                {`Enter ${basedOnProperty
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (char: any) => char.toUpperCase())}`}
              </label>

              <div className="flex flex-wrap gap-2 border border-gray-300 p-2 rounded-md bg-gray-50">
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

                {basedOnProperty === 'popularity_score_category' ? (
                  <select
                    value={threshold}
                    onChange={handleSelectThresholdChange}
                    className="bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[120px] outline-none p-1 rounded-md"
                  >
                    <option value="">Select Category</option>
                    <option value="High">High</option>
                    <option value="Very High">Very High</option>
                    <option value="Low">Low</option>
                    <option value="Very Low">Very Low</option>
                  </select>
                ) : basedOnProperty === 'primaryType' ? (
                  <select
                    value={threshold}
                    onChange={handleSelectThresholdChange}
                    className="bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[120px] outline-none p-1 rounded-md"
                  >
                    <option value="">Select Primary Type</option>
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
                    value={threshold}
                    onChange={handleInputThresholdChange}
                    className="bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[120px] outline-none"
                    placeholder={`Enter ${basedOnProperty
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (char: any) =>
                        char.toUpperCase()
                      )}${basedOnProperty === 'rating' ? ' up to 5' : ''}`}
                  />
                )}
              </div>
            </div>

            {basedOnProperty && basedOnProperty !== 'name' && selectedOption !== 'recolor' && (
              <div className="mt-3 relative " ref={pickerRef}>
                <label className="text-[11px] text-[#555] whitespace-nowrap text-sm flex flex-col">
                  Pick a Color
                </label>
                <div>
                  <button
                    className="w-full h-10 rounded-md border border-gray-300"
                    style={{ backgroundColor: selectedColor }}
                    onClick={() => setIsOpen(!isOpen)}
                  />
                </div>
                {isOpen && (
                  <div className="absolute mt-2 bg-white p-2 border border-gray-300 shadow-md rounded-md z-50">
                    <HexColorPicker color={selectedColor} onChange={handleColorChange} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}