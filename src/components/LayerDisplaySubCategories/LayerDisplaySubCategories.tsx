import { useState } from 'react';
import { formatSubcategoryName, colorOptions, getDefaultLayerColor } from '../../utils/helperFunctions';
import { IoClose } from 'react-icons/io5';
import { MdKeyboardArrowDown, MdRefresh } from 'react-icons/md';
import { LayerDisplaySubCategoriesProps } from '../../types/allTypesAndInterfaces';
import { t } from '../../i18n';

const LayerDisplaySubCategories = ({
  layer,
  layerIndex,
  onRemoveType,
  onNameChange,
  onColorChange,
  onLegendChange,
  onDescriptionChange,
  onActionChange,
  onRefresh,
  isFetching,
  listPrice,
  formatPrice,
  isPriceVisible,
}: LayerDisplaySubCategoriesProps) => {
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const layerColor = layer.points_color || getDefaultLayerColor(layer.id);
  const action = layer.action || 'sample';
  const isFull = action === 'full data';

  return (
    <div
      className="flex flex-col bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-full"
      style={{ borderLeft: `4px solid ${layerColor}` }}
    >
      <div className="flex flex-col w-full">
        <div className="px-4 py-2 border-b border-gray-300 flex items-center justify-between gap-2">
          <label
            className="flex items-center gap-2 text-md font-medium text-black flex-1 min-w-0"
            htmlFor={`selectedCategories-${layer.id}`}
          >
            <span
              className="text-center font-bold rounded-full text-sm border block w-6 h-6 flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: layerColor, borderColor: layerColor }}
            >
              {layer.id}
            </span>
            <input
              type="text"
              className="flex-1 min-w-0 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1"
              defaultValue={layer.name || `Layer ${layerIndex + 1}`}
              onChange={e => onNameChange(layerIndex, e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => onRefresh(layer.id)}
            disabled={isFetching || layer.includedTypes.length === 0}
            className="flex items-center justify-center w-7 h-7 text-gray-700 hover:text-black hover:bg-gray-50 rounded border border-gray-300 bg-white shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={t('refresh-layer')}
            title={t('refresh-layer')}
          >
            <MdRefresh
              className={`text-base ${isFetching ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={() => setIsCustomizeOpen(prev => !prev)}
            className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-black px-2 py-1 rounded border border-gray-300 bg-white shrink-0"
            aria-expanded={isCustomizeOpen}
          >
            {t('customize')}
            <MdKeyboardArrowDown
              className={`text-base transition-transform ${isCustomizeOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <div
          className="px-4 py-2 border-b border-gray-300 bg-white flex items-center justify-between gap-2"
          role="group"
          aria-label={t('data-tier')}
        >
          <div
            className="inline-flex rounded-md border border-gray-300 overflow-hidden text-xs font-semibold shrink-0"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isFull}
              onClick={() => onActionChange(layerIndex, 'sample')}
              className={`px-3 py-1.5 transition-colors ${
                !isFull
                  ? 'bg-[#115740] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('sample')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isFull}
              onClick={() => onActionChange(layerIndex, 'full data')}
              className={`px-3 py-1.5 transition-colors border-s border-gray-300 ${
                isFull
                  ? 'bg-[#115740] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('full-data')}
            </button>
          </div>
          <span className="text-xs font-medium text-gray-700 truncate">
            {!isFull
              ? t('free')
              : isPriceVisible
                ? listPrice > 0
                  ? formatPrice(listPrice)
                  : t('included')
                : ''}
          </span>
        </div>

        {isCustomizeOpen && (
          <div className="px-4 py-3 border-b border-gray-300 bg-white space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('point-color')}
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {colorOptions.map(({ name, hex }) => {
                  const isSelected = layerColor.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={hex}
                      type="button"
                      title={name}
                      onClick={() => onColorChange(layerIndex, hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-gray-800 scale-110 shadow-sm'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: hex }}
                      aria-label={name}
                      aria-pressed={isSelected}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('legend')}
              </label>
              <input
                type="text"
                value={layer.layer_legend || ''}
                onChange={e => onLegendChange(layerIndex, e.target.value)}
                className="block w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder={t('legend')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('description')}
              </label>
              <textarea
                value={layer.layer_description || ''}
                onChange={e => onDescriptionChange(layerIndex, e.target.value)}
                rows={2}
                className="block w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder={t('description')}
              />
            </div>
          </div>
        )}

        <div className="p-2.5 flex gap-2 flex-wrap">
          {layer.includedTypes.map((type: string) => (
            <div
              key={type}
              className="inline-flex items-center gap-2 py-1.5 ps-3 pe-2 text-white rounded text-[14px]"
              style={{ backgroundColor: layerColor, borderColor: layerColor }}
            >
              <span>{formatSubcategoryName(type)}</span>
              <button
                type="button"
                aria-label={t('remove')}
                className="rounded-full p-0.5 hover:bg-black/15 transition-colors"
                onClick={e => {
                  e.preventDefault();
                  onRemoveType(type, layer.id, false);
                }}
              >
                <IoClose className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LayerDisplaySubCategories;
