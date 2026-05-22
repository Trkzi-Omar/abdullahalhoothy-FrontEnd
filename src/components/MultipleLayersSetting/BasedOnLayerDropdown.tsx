import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import { BasedOnLayerDropdownProps } from '../../types/allTypesAndInterfaces';
import { formatSubcategoryName } from '../../utils/helperFunctions';
import { HexColorPicker } from 'react-colorful';
import { t } from '../../i18n';


interface ExtendedBasedOnLayerDropdownProps extends BasedOnLayerDropdownProps {
  onRecolorColorChange?: (color: string) => void;
}

export default function BasedOnLayerDropdown({
  layerIndex,
  onRecolorColorChange,
  isPropertyOnly = false,
  onPropertyOnlyChange,
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
    id: layer.layer_id,
    name: layer.layer_name || `Layer ${layer.layerId}`,
  }));

  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const availableTypes = [
    ...new Set(
      geoPoints
        .flatMap(layer => layer.features.flatMap(feature => feature.properties.types))
        .filter((type): type is string => typeof type === 'string' && type.length > 0)
    ),
  ];

  const [isOpen, setIsOpen] = useState(false);
  const [enableSecondSentence, setEnableSecondSentence] = useState(false);
  const [propertyValue, setPropertyValue] = useState('');
  const [nameInputMode, setNameInputMode] = useState<'includes' | 'excludes'>('includes');

  const pickerRef = useRef<HTMLDivElement>(null);

  const currentLayerName = geoPoints[layerIndex]?.layer_name || `Layer ${layerIndex + 1}`;

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
    const targetLayerId = isPropertyOnly
      ? geoPoints[layerIndex]?.layer_id
      : selectedOption === 'recolor'
        ? geoPoints[layerIndex]?.layer_id
        : basedOnLayerId;

    const filteredMetrics = geoPoints
      .filter(layer => layer.layer_id === targetLayerId)
      .map(layer => layer.properties)
      .flat()
      .filter(metric => metric !== null);

    return Array.from(
      new Set(
        filteredMetrics.filter(
          (metric): metric is string => typeof metric === 'string' && metric.length > 0
        )
      )
    );
  }, [geoPoints, basedOnLayerId, selectedOption, layerIndex, isPropertyOnly]);

  const [inputValue, setInputValue] = useState('');
  const [threshold, setThreshold] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const normalizeNameInput = (value: string) => value.trim().replace(/^['"]+|['"]+$/g, '');

  const formatNameChipLabel = (value: string) => {
    const trimmed = normalizeNameInput(value);
    return trimmed.startsWith('-') ? trimmed.slice(1).trimStart() : trimmed;
  };

  const isExcludedName = (value: string) => normalizeNameInput(value).startsWith('-');

  const prepareNameInput = (value: string) => {
    const normalizedValue = normalizeNameInput(value);

    if (!normalizedValue) {
      return '';
    }

    if (normalizedValue.startsWith('-')) {
      return normalizedValue;
    }

    return nameInputMode === 'excludes' ? `-${normalizedValue}` : normalizedValue;
  };

  const appendNameInputs = (values: string[]) => {
    const nextValues = values.map(prepareNameInput).filter(Boolean);
    if (nextValues.length > 0) {
      setNameInputs([...nameInputs, ...nextValues]);
      setInputValue('');
    }
  };

  const renderNameModeSelector = () => (
    <select
      value={nameInputMode}
      onChange={e => setNameInputMode(e.target.value as 'includes' | 'excludes')}
      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[110px]"
    >
      <option value="includes">{t("includes")}</option>
      <option value="excludes">{t("excludes")}</option>
    </select>
  );

  const renderNameTextInput = () => (
    <input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onPaste={e => {
        const text = e.clipboardData.getData('text');
        const parts = text
          .split(/[\n,]+/)
          .map(s => prepareNameInput(s))
          .filter(Boolean);
        if (parts.length >= 1) {
          e.preventDefault();
          appendNameInputs(parts);
        }
      }}
      className="bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[120px] outline-none"
      placeholder={t("type-and-press-comma")}
    />
  );

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
      setNameInputMode('includes');
      if (setPropertyThreshold) {
        setPropertyThreshold('');
      }
    }
  };

  const handlePropertyOnlyToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    if (onPropertyOnlyChange) {
      onPropertyOnlyChange(enabled);
    }

    if (enabled) {
      setCoverageValue('');
      setBasedOnLayerId(null);
      setEnableSecondSentence(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim() !== '') {
        appendNameInputs([inputValue]);
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

  const renderPropertyOnlyFilter = () => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-700">{t("keep-only")}</span>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
          {currentLayerName}
        </span>
        <span className="text-gray-700">{t("and-where")}</span>
        <select
          value={basedOnProperty || ''}
          onChange={handleMetricChange}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
        >
          <option value="">{t("select-property-optional")}</option>
          {metrics.map(metric => (
            <option key={metric} value={metric}>
              {formatSubcategoryName(metric)}
            </option>
          ))}
        </select>

        {basedOnProperty && (
          <>
            {basedOnProperty !== 'name' && (
              <>
                <select
                  value={comparisonType}
                  onChange={handleComparisonTypeChange}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="less">{t("less")}</option>
                  <option value="more">{t("more")}</option>
                </select>
                <span className="text-gray-700">{t("than")}</span>
              </>
            )}
            {basedOnProperty === "popularity_score_category" ? (
              <select
                value={threshold}
                onChange={handleSelectThresholdChange}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
              >
                <option value="">{t("any-value")}</option>
                <option value="High">{t("high")}</option>
                <option value="Very High">{t("very-high")}</option>
                <option value="Low">{t("low")}</option>
                <option value="Very Low">{t("very-low")}</option>
              </select>
            ) : basedOnProperty === "primaryType" ? (
              <select
                value={threshold}
                onChange={handleSelectThresholdChange}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
              >
                <option value="">{t("any-type")}</option>
                {availableTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (char: string) => char.toUpperCase())}
                  </option>
                ))}
              </select>
            ) : basedOnProperty === "name" ? (
              <div className="flex flex-wrap items-start gap-2">
                {renderNameModeSelector()}
                <div className="flex flex-wrap gap-2 border border-gray-300 p-2 rounded-md bg-white">
                  {nameInputs
                    .filter(name => name.trim() !== '')
                    .map((name, index) => (
                      <div
                        key={index}
                        className={`flex items-center border-2 rounded-xl px-2 py-0 text-xs ${isExcludedName(name) ? 'text-red-700 border-red-300 bg-red-50' : 'text-green-700 border-green-300 bg-green-50'}`}
                      >
                        {formatNameChipLabel(name)}
                        <button
                          onClick={() => handleRemoveName(index)}
                          className={`ms-2 ${isExcludedName(name) ? 'text-red-700' : 'text-green-700'} font-bold text-xs shadow-sm p-1`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  {renderNameTextInput()}
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={threshold}
                onChange={handleInputThresholdChange}
                placeholder={`any ${basedOnProperty ? basedOnProperty.replace(/_/g, ' ') : ''}`}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
              />
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderDistanceFilter = () => (
    <>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-700">{t("keep-only")}</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
            {currentLayerName}
          </span>
          <span className="text-gray-700">{t("that-are")}</span>
          <select
            value={comparisonType}
            onChange={handleComparisonTypeChange}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="less">{t("less")}</option>
            <option value="more">{t("more")}</option>
          </select>
          <span className="text-gray-700">{t("than")}</span>
          <input
            type="number"
            value={coverageValue}
            onChange={handleCoverageValueChange}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <select
            value={coverageType}
            onChange={handleCoverageTypeChange}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="radius">{t("kilometers")}</option>
            <option value="drive_time">{t("minutes-drive")}</option>
          </select>
          <span className="text-gray-700">{t("from")}</span>
          <select
            value={basedOnLayerId || ''}
            onChange={handleSelectChange}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
          >
            <option value="">{t("select-layer")}</option>
            {availableLayers.map(layer => {
              const isSelf = layer.id === geoPoints[layerIndex]?.layer_id;
              return (
                <option key={layer.id} value={layer.id}>
                  {(layer.name.length > 15
                    ? `${layer.name.substring(0, 15)}...`
                    : layer.name
                  ).concat(isSelf ? "(Self)" : '')}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="enableSecondFilter"
          checked={enableSecondSentence}
          onChange={handleSecondSentenceToggle}
          className="me-2"
        />
        <label htmlFor="enableSecondFilter" className="text-sm text-gray-700">{t("add-additional-filter-condition")}</label>
      </div>

      {enableSecondSentence && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-700">{t("and-where")}</span>
            <select
              value={basedOnProperty || ''}
              onChange={handleMetricChange}
              disabled={!basedOnLayerId}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 disabled:text-gray-500 min-w-[120px]"
            >
              <option value="">{t("select-property-optional")}</option>
              {metrics.map(metric => (
                <option key={metric} value={metric}>
                  {formatSubcategoryName(metric)}
                </option>
              ))}
            </select>

            {/* Only show the value input if a property is selected */}
            {basedOnProperty && (
              <>
                <span className="text-gray-700">{t("is")}</span>
                {basedOnProperty ==="popularity_score_category" ? (
                  <select
                    value={propertyValue}
                    onChange={handlePropertyValueSelectChange}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                  >
                    <option value="">{t("any-value")}</option>
                    <option value="High">{t("high")}</option>
                    <option value="Very High">{t("very-high")}</option>
                    <option value="Low">{t("low")}</option>
                    <option value="Very Low">{t("very-low")}</option>
                  </select>
                ) : basedOnProperty ==="primaryType" ? (
                  <select
                    value={propertyValue}
                    onChange={handlePropertyValueSelectChange}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                  >
                    <option value="">{t("any-type")}</option>
                    {availableTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (char: string) => char.toUpperCase())}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={propertyValue}
                    onChange={handlePropertyValueChange}
                    placeholder={`any ${basedOnProperty ? basedOnProperty.replace(/_/g, ' ') : ''}`}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );

  const renderPropertyOnlyRecolor = () => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-700">{t("recolor")}</span>
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
          {currentLayerName}
        </span>
        <span className="text-gray-700">{t("and-where")}</span>
        <select
          value={basedOnProperty || ''}
          onChange={handleMetricChange}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
        >
          <option value="">{t("select-property-optional")}</option>
          {metrics.map(metric => (
            <option key={metric} value={metric}>
              {formatSubcategoryName(metric)}
            </option>
          ))}
        </select>

        {basedOnProperty && (
          <>
            {basedOnProperty !== 'name' && (
              <>
                <select
                  value={comparisonType}
                  onChange={handleComparisonTypeChange}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="less">{t("less")}</option>
                  <option value="more">{t("more")}</option>
                </select>
                <span className="text-gray-700">{t("than")}</span>
              </>
            )}
            {basedOnProperty === "popularity_score_category" ? (
              <select
                value={threshold}
                onChange={handleSelectThresholdChange}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
              >
                <option value="">{t("any-value")}</option>
                <option value="High">{t("high")}</option>
                <option value="Very High">{t("very-high")}</option>
                <option value="Low">{t("low")}</option>
                <option value="Very Low">{t("very-low")}</option>
              </select>
            ) : basedOnProperty === "primaryType" ? (
              <select
                value={threshold}
                onChange={handleSelectThresholdChange}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
              >
                <option value="">{t("any-type")}</option>
                {availableTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (char: string) => char.toUpperCase())}
                  </option>
                ))}
              </select>
            ) : basedOnProperty === "name" ? (
              <div className="flex flex-wrap items-start gap-2">
                {renderNameModeSelector()}
                <div className="flex flex-wrap gap-2 border border-gray-300 p-2 rounded-md bg-white">
                  {nameInputs
                    .filter(name => name.trim() !== '')
                    .map((name, index) => (
                      <div
                        key={index}
                        className={`flex items-center border-2 rounded-xl px-2 py-0 text-xs ${isExcludedName(name) ? 'text-red-700 border-red-300 bg-red-50' : 'text-green-700 border-green-300 bg-green-50'}`}
                      >
                        {formatNameChipLabel(name)}
                        <button
                          onClick={() => handleRemoveName(index)}
                          className={`ms-2 ${isExcludedName(name) ? 'text-red-700' : 'text-green-700'} font-bold text-xs shadow-sm p-1`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  {renderNameTextInput()}
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={threshold}
                onChange={handleInputThresholdChange}
                placeholder={`any ${basedOnProperty ? basedOnProperty.replace(/_/g, ' ') : ''}`}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
              />
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderDistanceRecolor = () => (
    <>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-700">{t("recolor")}</span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
            {currentLayerName}
          </span>
          <span className="text-gray-700">{t("that-are")}</span>
          <select
            value={comparisonType}
            onChange={handleComparisonTypeChange}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="less">{t("less")}</option>
            <option value="more">{t("more")}</option>
          </select>
          <span className="text-gray-700">{t("than")}</span>
          <input
            type="number"
            value={coverageValue}
            onChange={handleCoverageValueChange}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <select
            value={coverageType}
            onChange={handleCoverageTypeChange}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="radius">{t("kilometers")}</option>
            <option value="drive_time">{t("minutes-drive")}</option>
          </select>
          <span className="text-gray-700">{t("from")}</span>
          <select
            value={basedOnLayerId || ''}
            onChange={handleSelectChange}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
          >
            <option value="">{t("select-layer")}</option>
            {availableLayers.map(layer => {
              const isSelf = layer.id === geoPoints[layerIndex]?.layer_id;
              return (
                <option key={layer.id} value={layer.id}>
                  {(layer.name.length > 15
                    ? `${layer.name.substring(0, 15)}...`
                    : layer.name
                  ).concat(isSelf ? "(Self)" : '')}
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
          className="me-2"
        />
        <label htmlFor="enableSecondRecolor" className="text-sm text-gray-700">{t("add-additional-recolor-condition")}</label>
      </div>

      {/* Second Sentence (Optional) - Only show when enabled */}
      {enableSecondSentence && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-700">{t("and-where")}</span>
            <select
              value={basedOnProperty || ''}
              onChange={handleMetricChange}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
            >
              <option value="">{t("select-property-optional")}</option>
              {metrics.map(metric => (
                <option key={metric} value={metric}>
                  {formatSubcategoryName(metric)}
                </option>
              ))}
            </select>

            {/* Only show the value input if a property is selected */}
            {basedOnProperty && (
              <>
                <span className="text-gray-700">{t("is")}</span>
                {basedOnProperty ==="popularity_score_category" ? (
                  <select
                    value={threshold}
                    onChange={handleSelectThresholdChange}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                  >
                    <option value="">{t("any-value")}</option>
                    <option value="High">{t("high")}</option>
                    <option value="Very High">{t("very-high")}</option>
                    <option value="Low">{t("low")}</option>
                    <option value="Very Low">{t("very-low")}</option>
                  </select>
                ) : basedOnProperty ==="primaryType" ? (
                  <select
                    value={threshold}
                    onChange={handleSelectThresholdChange}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                  >
                    <option value="">{t("any-type")}</option>
                    {availableTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (char: string) => char.toUpperCase())}
                      </option>
                    ))}
                  </select>
                ) : basedOnProperty ==="name" ? (
                  <div className="flex flex-wrap items-start gap-2">
                    {renderNameModeSelector()}
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
                              className="ms-2 text-red-500 font-bold text-xs shadow-sm p-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      {renderNameTextInput()}
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={threshold}
                    onChange={handleInputThresholdChange}
                    placeholder={`any ${basedOnProperty ? basedOnProperty.replace(/_/g, ' ') : ''}`}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );

  // Render for FILTER option - sentence-like interface
  if (selectedOption === 'filter') {
    return (
      <div className="ms-2.5 flex flex-col space-y-4">
        <div className="flex items-center gap-2 text-xs text-[#555]">
          <input
            id={`property-only-filter-${layerIndex}`}
            type="checkbox"
            checked={isPropertyOnly}
            onChange={handlePropertyOnlyToggle}
            className="w-[11px] h-[11px] cursor-pointer accent-[#28a745]"
          />
          <label htmlFor={`property-only-filter-${layerIndex}`}>
            {t('property-only-no-distance')}
          </label>
        </div>
        {isPropertyOnly ? renderPropertyOnlyFilter() : renderDistanceFilter()}
      </div>
    );
  }

  // Render for RECOLOR option - sentence-like interface similar to filter
  if (selectedOption === 'recolor') {
    return (
      <div className="ms-2.5 flex flex-col space-y-4">
        <div className="flex items-center gap-2 text-xs text-[#555]">
          <input
            id={`property-only-recolor-${layerIndex}`}
            type="checkbox"
            checked={isPropertyOnly}
            onChange={handlePropertyOnlyToggle}
            className="w-[11px] h-[11px] cursor-pointer accent-[#28a745]"
          />
          <label htmlFor={`property-only-recolor-${layerIndex}`}>
            {t('property-only-no-distance')}
          </label>
        </div>

        {isPropertyOnly ? renderPropertyOnlyRecolor() : renderDistanceRecolor()}

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-700">{t("using-color")}</span>
            <div className="relative" ref={pickerRef}>
              <button
                className="w-16 h-8 rounded-md border border-gray-300 shadow-sm"
                style={{ backgroundColor: selectedColor }}
                onClick={() => setIsOpen(!isOpen)}
              />
              {isOpen && (
                <div className="absolute top-10 start-0 bg-white p-2 border border-gray-300 shadow-lg rounded-md z-50">
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
