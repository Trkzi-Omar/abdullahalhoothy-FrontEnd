import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  formatSubcategoryName,
  processCityData,
  getDefaultLayerColor,
} from '../../utils/helperFunctions';
import { PiX } from 'react-icons/pi';
import urls from '../../urls.json';
import { CategoryData, Layer } from '../../types/allTypesAndInterfaces';
import { useLayerContext } from '../../context/LayerContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import apiRequest from '../../services/apiRequest';
import LayerDisplaySubCategories from '../LayerDisplaySubCategories/LayerDisplaySubCategories';
import CategoriesBrowserSubCategories from '../CategoriesBrowserSubCategories/CategoriesBrowserSubCategories';
import { useMapContext } from '../../context/MapContext';
import ChatTrigger from '../Chat/ChatTrigger';
import Chat from '../Chat/Chat';
import { topics } from '../../types';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import Modal from '../common/Modal';
import { Spinner } from '../common';
import DatasetModalContent from './DatasetModalContent';

const FetchDatasetForm = () => {
  const nav = useNavigate();

  // LAYER CONTEXT
  const {
    setReqFetchDataset,
    showErrorMessage,
    setShowErrorMessage,
    resetFetchDatasetForm,
    categories,
    setCategories,
    countries,
    setCountries,
    cities,
    handleCountryCitySelection,
    selectedCity,
    setSelectedCity,
    searchType,
    setSearchType,
    textSearchInput,
    setTextSearchInput,
    selectedCountry,
    setSelectedCountry,
    isError,
    setIsError,
    handleSubmitFetchDataset,
    handleFullDataFetchSuccess,
    isLoadingDataset,
    setCitiesData,
  } = useLayerContext();
  // AUTH CONTEXT
  const { authResponse, logout } = useAuth();
  const [isPriceVisible, setIsPriceVisible] = useState<boolean>(false);
  // FETCHED DATA
  const [layers, setLayers] = useState<Layer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [costEstimate, setCostEstimate] = useState<number>(0.0);
  // COLBASE CATEGORY
  const [openedCategories, setOpenedCategories] = useState<string[]>([]);

  // MODAL
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false);

  // USER INPUT
  const [searchQuery, setSearchQuery] = useState('');

  // Add ref for the categories section
  const categoriesRef = useRef<HTMLDivElement>(null);

  const { backendZoom } = useMapContext();

  useEffect(() => {
    resetFetchDatasetForm();
    handleGetCountryCityCategory();
    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    if (!authResponse || !('idToken' in authResponse)) {
      nav('/auth');
      return;
    }

    try {
      const res = await apiRequest({
        url: urls.user_profile,
        method: 'POST',
        isAuthRequest: true,
        body: { user_id: authResponse.localId },
      });
      await setIsPriceVisible(res.data.data.show_price_on_purchase);
    } catch (err) {
      console.error('Unexpected error:', err);
      logout();
      nav('/auth');
    }
  };
  // Get all unique datasets from all layers (only included types)
  const allDatasets = useMemo(() => {
    const datasetsSet = new Set<string>();
    layers.forEach(layer => {
      layer.includedTypes.forEach(type => datasetsSet.add(type));
    });
    return Array.from(datasetsSet).sort();
  }, [layers]);

  // Create a string key for datasets to track changes
  const datasetsKey = useMemo(() => {
    return allDatasets.join(',');
  }, [allDatasets]);

  // Calculate cart cost using the new endpoint
  const calculateCartCost = useCallback(async () => {
    if (!authResponse?.localId) {
      setCostEstimate(0.0);
      return;
    }

    // Don't calculate if there are no datasets or missing location
    if (allDatasets.length === 0 || !selectedCity || !selectedCountry) {
      setCostEstimate(0.0);
      return;
    }

    try {
      const requestBody = {
        user_id: authResponse.localId,
        country_name: selectedCountry,
        city_name: selectedCity,
        datasets: allDatasets,
        intelligences: [] as string[],
        displayed_price: 0,
      };

      const response = await apiRequest({
        url: urls.calculate_cart_cost,
        method: 'POST',
        body: requestBody,
        isAuthRequest: true,
      });

      const totalCost = response.data?.data?.total_cost || 0;
      setCostEstimate(totalCost);
    } catch (error) {
      console.error('Error calculating cart cost:', error);
      setCostEstimate(0.0);
    }
  }, [authResponse?.localId, allDatasets, selectedCity, selectedCountry]);

  // Only calculate cost when datasets change (add/remove) or location changes
  useEffect(() => {
    // Use a small delay to debounce rapid changes
    const timeoutId = setTimeout(() => {
      calculateCartCost();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [datasetsKey, selectedCity, selectedCountry, calculateCartCost]);

  const filteredCategories = Object.entries(categories).reduce((acc, [category, types]) => {
    const filteredTypes = (types as string[]).filter(type =>
      type.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredTypes.length > 0) {
      acc[category] = filteredTypes;
    }
    return acc;
  }, {} as CategoryData);

  async function handleGetCountryCityCategory() {
    try {
      const res = await apiRequest({
        url: urls.country_city,
        method: 'get',
      });
      setCountries(processCityData(res.data.data, setCitiesData));
    } catch (error) {
      if (error instanceof Error) {
        setIsError(error);
      } else {
        setIsError(new Error(String(error)));
      }
    }

    try {
      const res = await apiRequest({
        url: urls.nearby_categories,
        method: 'get',
      });
      setCategories(res.data.data);
    } catch (error) {
      if (error instanceof Error) {
        setIsError(error);
      } else {
        setIsError(new Error(String(error)));
      }
    }
  }
  async function onButtonClick(action: string, event: React.MouseEvent<HTMLButtonElement>) {
    const result = handleSubmitFetchDataset(action, event);

    if (result instanceof Error) {
      setError(result.message);
      return;
    }

    // For full data, wait for loading to complete before showing modal
    if (action === 'full data' && result === true) {
      setIsDatasetModalOpen(true);
    } else if (action === 'sample' && result === true) {
      handleFullDataFetchSuccess();
    }
  }

  function handleClear() {
    // Clear all layers
    setLayers([]);
    // Clear reqFetchDataset
    setReqFetchDataset(prevData => ({
      ...prevData,
      includedTypes: [],
      excludedTypes: [],
      layers: [],
    }));
    // Reset cost estimate
    setCostEstimate(0.0);
  }

  // Add scroll handler function
  const scrollToCategories = (e: React.MouseEvent) => {
    e.preventDefault();
    categoriesRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  // Add new handler to remove type from specific layer
  const removeTypeFromLayer = (type: string, layerId: number, isExcluded: boolean) => {
    const updatedLayers = layers
      .map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            includedTypes: isExcluded
              ? layer.includedTypes
              : layer.includedTypes.filter(t => t !== type),
            excludedTypes: isExcluded
              ? layer.excludedTypes.filter(t => t !== type)
              : layer.excludedTypes,
          };
        }
        return layer;
      })
      .filter(layer => layer.includedTypes.length > 0 || layer.excludedTypes.length > 0);

    setLayers(updatedLayers);

    // Update reqFetchDataset based on remaining types
    const remainingIncluded = updatedLayers.flatMap(layer => layer.includedTypes);
    const remainingExcluded = updatedLayers.flatMap(layer => layer.excludedTypes);

    setReqFetchDataset(prevData => ({
      ...prevData,
      includedTypes: remainingIncluded,
      excludedTypes: remainingExcluded,
    }));
  };

  // Update getTypeCounts to return layer IDs with the counts
  const getTypeCounts = (type: string) => {
    const includedInLayers = layers
      .filter(layer => layer.includedTypes.includes(type))
      .map(layer => layer.id);
    const excludedInLayers = layers
      .filter(layer => layer.excludedTypes.includes(type))
      .map(layer => layer.id);

    return {
      includedCount: includedInLayers,
      excludedCount: excludedInLayers,
    };
  };

  // Add this helper function
  const addTypeToFirstAvailableLayer = (type: string, setAsExcluded: boolean) => {
    // Update the layers state
    setLayers(prevLayers => {
      if (prevLayers.length === 0) {
        // If no layers exist, create a new layer
        const newLayer: Layer = {
          id: 1,
          name: 'Layer 1',
          includedTypes: setAsExcluded ? [] : [type],
          excludedTypes: setAsExcluded ? [type] : [],
          display: true,
          points_color: getDefaultLayerColor(1),
          cost: 0,
        };
        return [newLayer];
      }

      // Try to find the first layer that doesn't have this type
      const targetLayerIndex = prevLayers.findIndex(
        layer => !layer.includedTypes.includes(type) && !layer.excludedTypes.includes(type)
      );

      // If all existing layers have this type, create a new layer
      if (targetLayerIndex === -1) {
        const newLayerId = prevLayers.length + 1;
        const newLayer: Layer = {
          id: newLayerId,
          name: `Layer ${newLayerId}`,
          layer_name: `Layer ${newLayerId}`,
          includedTypes: setAsExcluded ? [] : [type],
          excludedTypes: setAsExcluded ? [type] : [],
          display: true,
          points_color: getDefaultLayerColor(newLayerId),
          cost: 0,
        };
        return [...prevLayers, newLayer];
      }

      // Add the type to the first available layer
      return prevLayers.map((layer, index) => {
        if (index === targetLayerIndex) {
          // Update the layer's included/excluded types
          const updatedLayer = {
            ...layer,
            includedTypes: setAsExcluded ? layer.includedTypes : [...layer.includedTypes, type],
            excludedTypes: setAsExcluded ? [...layer.excludedTypes, type] : layer.excludedTypes,
          };

          return updatedLayer;
        }
        return layer;
      });
    });
  };

  // Replace handleAddToIncluded and handleAddToExcluded with:
  const handleAddToIncluded = (type: string) => {
    addTypeToFirstAvailableLayer(type, false);
  };

  const handleAddToExcluded = (type: string) => {
    addTypeToFirstAvailableLayer(type, true);
  };

  const handleToggleCategory = (category: string) => {
    if (openedCategories.includes(category)) {
      setOpenedCategories([...openedCategories.filter(x => x !== category)]);
      return;
    }
    setOpenedCategories([...openedCategories.concat(category)]);
  };

  // Add this new function
  const toggleTypeInLayer = (type: string, layerId: number, setAsExcluded: boolean) => {
    setLayers(prevLayers => {
      const updatedLayers = prevLayers.map(layer => {
        if (layer.id === layerId) {
          // If trying to exclude
          if (setAsExcluded) {
            // Check if it's already excluded
            if (layer.excludedTypes.includes(type)) {
              return layer; // No change needed
            }
            // Move from included to excluded
            return {
              ...layer,
              includedTypes: layer.includedTypes.filter(t => t !== type),
              excludedTypes: [...layer.excludedTypes, type],
            };
          }
          // If trying to include
          else {
            // Check if it's already included
            if (layer.includedTypes.includes(type)) {
              return layer; // No change needed
            }
            // Move from excluded to included
            return {
              ...layer,
              excludedTypes: layer.excludedTypes.filter(t => t !== type),
              includedTypes: [...layer.includedTypes, type],
            };
          }
        }
        return layer;
      });

      // Update reqFetchDataset based on all layers
      const allIncludedTypes = new Set<string>();
      const allExcludedTypes = new Set<string>();

      updatedLayers.forEach(layer => {
        layer.includedTypes.forEach(t => allIncludedTypes.add(t));
        layer.excludedTypes.forEach(t => allExcludedTypes.add(t));
      });

      setReqFetchDataset(prevData => ({
        ...prevData,
        includedTypes: Array.from(allIncludedTypes),
        excludedTypes: Array.from(allExcludedTypes),
      }));

      return updatedLayers;
    });
  };

  // Add this handler
  const handleLayerNameChange = (index: number, newName: string) => {
    const newLayers = [...layers];
    newLayers[index].name = newName;
    setLayers(newLayers);
  };

  // Update reqFetchDataset when layers change
  useEffect(() => {
    setReqFetchDataset(prev => ({
      ...prev,
      layers: layers.map(layer => ({
        id: layer.id,
        name: layer.name || `Layer ${layer.id}`,
        points_color: layer.points_color || '#000000',
        includedTypes: layer.includedTypes,
        excludedTypes: layer.excludedTypes,
        layer_name: layer.layer_name,
      })),
      // Maintain backward compatibility
      includedTypes: layers.flatMap(layer => layer.includedTypes),
      excludedTypes: layers.flatMap(layer => layer.excludedTypes),
    }));
  }, [layers, setReqFetchDataset]);

  useEffect(() => {
    if (isError) {
      setError(isError.message);
    }
  }, [isError]);

  useEffect(() => {
    if (backendZoom !== null) {
      setReqFetchDataset(prev => {
        const newState = {
          ...prev,
          zoomLevel: backendZoom,
        };
        return newState;
      });
    }
  }, [backendZoom, setReqFetchDataset]);

  const typingDelay = 500;

  useEffect(() => {
    if (!textSearchInput.trim()) {
      setCostEstimate(0.0);
      return;
    }

    if (!selectedCountry || !selectedCity) {
      setErrorMessage('Please select Country and city first.');
      return;
    } else {
      setErrorMessage('');
    }

    const delayDebounceFn = setTimeout(() => {
      // For keyword search, we don't calculate cost until datasets are actually added to layers
      // The cost will be calculated automatically when datasets are added
      setCostEstimate(0.0);
    }, typingDelay);

    return () => clearTimeout(delayDebounceFn);
  }, [textSearchInput, selectedCountry, selectedCity]);

  function handleDatasetModalChange(open: boolean) {
    if (!open) {
      handleFullDataFetchSuccess();
    }
    setIsDatasetModalOpen(open);
  }

  return (
    <>
      <div className="flex-1 flex flex-col justify-between overflow-y-auto relative">
        <div className="w-full p-4 overflow-y-auto ">
          {error && <div className="mt-6 text-red-500 font-semibold">{error}</div>}

          <div className="mb-6">
            <label className="block mb-2 text-base font-medium text-black" htmlFor="ai-fetch">
              AI-Powered Dataset Finder
            </label>
            <div className="flex relative w-full">
              <ChatTrigger
                title="AI Dataset Finder"
                position="auto"
                cN="flex-grow"
                size="h-14"
                colors="bg-gem-gradient border text-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all"
                beforeIcon={<FaWandMagicSparkles />}
                afterIcon={<></>}
              />
              <Chat topic={topics.DATASET} position="fixed left-[27.5rem] mx-2 inset-y-auto z-50" />
            </div>
          </div>

          <label className="block mb-2 text-base font-medium text-black" htmlFor="layers">
            Layers
          </label>
          <div
            id="layers"
            className="flex text-sm flex-col border border-gray-300 rounded-lg p-4 gap-4"
          >
            {/* Map through layers to create multiple Layer sections */}
            {layers.map((layer, index) => (
              <LayerDisplaySubCategories
                key={layer.id}
                layer={layer}
                layerIndex={index}
                onRemoveType={(type: string) => removeTypeFromLayer(type, layer.id, false)}
                onToggleTypeInLayer={(type: string) => toggleTypeInLayer(type, layer.id, false)}
                onNameChange={handleLayerNameChange}
              />
            ))}

            {/* Add default empty layer section */}
            <div className="">
              <label
                className="block mb-2 font-medium text-black"
                htmlFor="selectedCategories-default"
              >
                Add Layer
              </label>
              <div
                id="selectedCategories-default"
                className="flex gap-2 overflow-x-auto bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <button
                  type="button"
                  className={`flex items-center justify-between py-2 px-4 bg-[#f0f0f0] border border-[#ccc] rounded cursor-pointer text-[14px] transition-all duration-300 ease-in-out hover:bg-[#e0e0e0]`}
                  onClick={scrollToCategories}
                >
                  {formatSubcategoryName('Category')}
                  <span className="ml-2 font-bold">{'+'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t mt-4 pt-2">
            <label className="block mb-2 text-md font-medium text-black" htmlFor="searchType">
              Search Type
            </label>
            <select
              name="searchType"
              id="searchType"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={searchType || 'category_search'}
              onChange={e => {
                setSearchType(e.target.value);
              }}
            >
              <option value="category_search">Category Search</option>
              <option value="keyword_search">Keyword Search</option>
            </select>
          </div>

          {searchType == 'keyword_search' && (
            <div className="pt-4">
              <label
                className="block mb-2 text-md font-medium text-black"
                htmlFor="textSearchInput"
              >
                Search
              </label>
              <input
                type="text"
                id="textSearchInput"
                name="textSearchInput"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="Enter search text"
                value={textSearchInput}
                onChange={e => setTextSearchInput(e.target.value)}
              />

              {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
            </div>
          )}
          <div className="pt-4">
            <label className="block mb-2 text-md font-medium text-black" htmlFor="country">
              Country
            </label>
            <select
              id="country"
              name="selectedCountry"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={selectedCountry || ''}
              onChange={e => {
                setSelectedCountry(e.target.value);
                handleCountryCitySelection(e);
              }}
            >
              <option value="" disabled>
                Select a country
              </option>
              {countries.map(country => (
                <option value={country} key={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <label className="block mb-2 text-md font-medium text-black" htmlFor="city">
              City
            </label>
            <select
              id="city"
              name="selectedCity"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={selectedCity || ''}
              onChange={e => {
                setSelectedCity(e.target.value);
                handleCountryCitySelection(e);
              }}
              disabled={!selectedCountry}
            >
              <option value="" disabled>
                Select a city
              </option>
              {cities.map(city => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {searchType !== 'keyword_search' && (
            <div className="flex flex-col my-5" ref={categoriesRef}>
              <div className="flex justify-between">
                <label className="mb-4 font-bold">What are you looking for?</label>
                <button
                  onClick={handleClear}
                  className="w-16 h-6 text-sm bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <div className="pb-3">
                <input
                  type="text"
                  id="searchInput"
                  name="searchInput"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Search for a type..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <CategoriesBrowserSubCategories
                categories={filteredCategories}
                openedCategories={openedCategories}
                onToggleCategory={handleToggleCategory}
                getTypeCounts={getTypeCounts}
                onRemoveType={removeTypeFromLayer}
                onAddToIncluded={handleAddToIncluded}
                onAddToExcluded={handleAddToExcluded}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex-col flex  px-2 py-2 select-none border-t lg:mb-0 mb-14 relative">
        <div className="flex space-x-2">
          <button
            onClick={e => {
              onButtonClick('sample', e);
            }}
            className="w-full h-10 bg-slate-100 border-2 border-[#115740] text-[#115740] flex justify-center items-center font-semibold rounded-lg
                 hover:bg-white transition-all cursor-pointer"
            disabled={isLoadingDataset}
          >
            Get Sample
          </button>
          <div className="w-full h-10 bg-[#115740] text-white flex justify-between items-center font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer px-4 ">
            <div className="text-lg">Full Data</div>
            <div className="flex flex-col items-end gap-1">
              {isPriceVisible && (
                <span className="text-sm font-normal opacity-90">${costEstimate.toFixed(2)}</span>
              )}
              <button
                className="text-xs font-semibold hover:underline"
                onClick={e => {
                  onButtonClick('full data', e);
                }}
                disabled={isLoadingDataset}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {showErrorMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white shadow-xl w-96 max-w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-100  border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="mr-2">⚠️</span> Warning
              </h3>
              <button
                onClick={() => setShowErrorMessage(false)}
                className="text-gray-800 hover:text-gray-600 focus:outline-none"
              >
                <PiX className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 text-center">
              <p className="text-base text-gray-800 font-medium">
                Insufficient funds for this transaction.
              </p>
              <p className="text-sm text-gray-600 mt-2">Please add more funds to continue.</p>
            </div>

            {/* Footer */}
            <div className="flex justify-center px-6 py-4">
              <button
                onClick={() => nav('/profile/wallet/add')}
                className="w-full h-10 bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer"
              >
                Add Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* dataset modal - only show when not loading */}
      <Modal
        open={isDatasetModalOpen && !isLoadingDataset}
        onOpenChange={handleDatasetModalChange}
        title="Dataset"
        contentClassName="max-w-4xl"
      >
        <DatasetModalContent />
      </Modal>
    </>
  );
};

export default FetchDatasetForm;
