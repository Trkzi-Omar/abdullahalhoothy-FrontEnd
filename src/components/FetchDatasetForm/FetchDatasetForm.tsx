import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  processCityData,
  getDefaultLayerColor,
  getYesterdayDate,
  fuzzyMatchCategoryType,
} from '../../utils/helperFunctions';
import { PiX } from 'react-icons/pi';
import urls from '../../urls.json';
import { CategoryData, Layer, LayerAction } from '../../types/allTypesAndInterfaces';
import { useLayerContext } from '../../context/LayerContext';
import { useCatalogContext } from '../../context/CatalogContext';
import { useAuth, isGuestUser } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import apiRequest from '../../services/apiRequest';
import LayerDisplaySubCategories from '../LayerDisplaySubCategories/LayerDisplaySubCategories';
import CategoriesBrowserSubCategories from '../CategoriesBrowserSubCategories/CategoriesBrowserSubCategories';
import {
  IntelligencePaywallModal,
  type DatasetPurchaseItem,
  type IntelligencePurchaseItem,
} from '../Map/IntelligencePaywallModal';
import { useMapContext } from '../../context/MapContext';
import ChatTrigger from '../Chat/ChatTrigger';
import Chat from '../Chat/Chat';
import { topics } from '../../types';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { useDatasetPrices } from '../../hooks/useDatasetPrices';
import { isIntelligentLayer } from '../../utils/layerUtils';
import { toast } from 'sonner';

import { t } from '../../i18n';
import { translateError } from '../../utils/apiMessages';

const DRAFT_KEY_PREFIX = 'fetchDatasetForm.draft.v1.';

interface FetchDatasetDraft {
  selectedCountry: string;
  selectedCity: string;
  searchType: string;
  textSearchInput: string;
  layers: Layer[];
}

type LayerSaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

const draftKeyFor = (userId: string | null | undefined) =>
  `${DRAFT_KEY_PREFIX}${userId || 'guest'}`;

const readDraft = (userId: string | null | undefined): FetchDatasetDraft | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(draftKeyFor(userId));
    if (!raw) return null;
    return JSON.parse(raw) as FetchDatasetDraft;
  } catch {
    return null;
  }
};

const writeDraft = (userId: string | null | undefined, draft: FetchDatasetDraft) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(draftKeyFor(userId), JSON.stringify(draft));
  } catch {
    // sessionStorage may be unavailable (private mode, quota).
  }
};

const clearDraft = (userId: string | null | undefined) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(draftKeyFor(userId));
  } catch {
    // ignore
  }
};

const pruneLayerSignatureMap = (
  signatures: Record<number, string>,
  liveIds: Set<number>
) => {
  let changed = false;
  const next: Record<number, string> = {};

  Object.entries(signatures).forEach(([id, signature]) => {
    const layerId = Number(id);
    if (liveIds.has(layerId)) {
      next[layerId] = signature;
    } else {
      changed = true;
    }
  });

  return changed ? next : signatures;
};


const FetchDatasetForm = () => {
  const nav = useNavigate();

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
    isLoadingDataset,
    setCitiesData,
    setCities,
    handleSaveLayer,
    layerDataMap,
    setLayerDataMap,
    handleFetchDataset,
    refreshAllLayersRef,
    clearAllLayersRef,
  } = useLayerContext();

  const { setSelectedHomeTab, fetchGeoPoints, setGeoPoints } = useCatalogContext();
  const { authResponse, authLoading } = useAuth();
  const [isPriceVisible, setIsPriceVisible] = useState<boolean>(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [savingLayerIds, setSavingLayerIds] = useState<Set<number>>(new Set());
  const [savedLayerSignatures, setSavedLayerSignatures] = useState<Record<number, string>>({});
  const [failedLayerSignatures, setFailedLayerSignatures] = useState<Record<number, string>>({});
  const [, setCostEstimate] = useState<number>(0.0);
  const [openedCategories, setOpenedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const categoriesRef = useRef<HTMLDivElement>(null);
  const chatAnchorRef = useRef<HTMLDivElement>(null);

  const { backendZoom } = useMapContext();

  const draftUserId = authResponse?.localId ?? null;
  const didHydrateRef = useRef(false);

  useEffect(() => {
    resetFetchDatasetForm();
    handleGetCountryCityCategory();

    if (!didHydrateRef.current) {
      const draft = readDraft(draftUserId);
      if (draft) {
        if (draft.selectedCountry) setSelectedCountry(draft.selectedCountry);
        if (draft.selectedCity) setSelectedCity(draft.selectedCity);
        if (draft.searchType) setSearchType(draft.searchType);
        if (draft.textSearchInput) setTextSearchInput(draft.textSearchInput);
        if (draft.layers?.length) {
          // Empty-layers mode: seed signatures so the auto-fetch effect at line
          // ~350 dedupes the hydrated layers and skips the implicit /fetch_dataset
          // call. Users explicitly refresh a layer to load data.
          draft.layers.forEach(layer => {
            layerSignaturesRef.current[layer.id] = layerSignature(layer);
          });
          setLayers(draft.layers);
        }
      }
      didHydrateRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced to avoid sessionStorage thrash on every keystroke.
  useEffect(() => {
    if (!didHydrateRef.current) return;
    if (
      layers.length === 0 &&
      !textSearchInput &&
      (!selectedCountry || !selectedCity)
    ) {
      return;
    }
    const timeoutId = setTimeout(() => {
      writeDraft(draftUserId, {
        selectedCountry: selectedCountry || '',
        selectedCity: selectedCity || '',
        searchType: searchType || '',
        textSearchInput: textSearchInput || '',
        layers,
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [draftUserId, selectedCountry, selectedCity, searchType, textSearchInput, layers]);

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const fetchProfile = async () => {
    if (!authResponse || !('idToken' in authResponse)) {
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
      console.error('Failed to fetch profile:', err);
    }
  };
  // Paid datasets only. Sample-only layers cost nothing.
  const fullDataDatasets = useMemo(() => {
    const datasetsSet = new Set<string>();
    layers
      .filter(layer => layer.action === 'full data')
      .forEach(layer => layer.includedTypes.forEach(type => datasetsSet.add(type)));
    return Array.from(datasetsSet).sort();
  }, [layers]);


  // Tracks only full-data datasets so sample-only changes don't trigger cost calls.
  const fullDataKey = useMemo(() => fullDataDatasets.join(','), [fullDataDatasets]);

  // Backend already deducts owned items.
  const calculateCartCost = useCallback(async () => {
    if (!authResponse?.localId) {
      setCostEstimate(0.0);
      return;
    }

    if (fullDataDatasets.length === 0 || !selectedCity || !selectedCountry) {
      setCostEstimate(0.0);
      return;
    }

    try {
      const requestBody = {
        user_id: authResponse.localId,
        country_name: selectedCountry,
        city_name: selectedCity,
        datasets: fullDataDatasets,
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
      toast.error(t("error-calculating-cart-cost"));
      setCostEstimate(0.0);
    }
  }, [authResponse?.localId, fullDataDatasets, selectedCity, selectedCountry]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateCartCost();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fullDataKey, selectedCity, selectedCountry, calculateCartCost]);

  const { getPrice, getRawPrice, formatPrice } = useDatasetPrices({
    selectedCountry,
    selectedCity,
    categories,
    openedCategories,
  });

  const getLayerListPrice = useCallback(
    (layer: Layer) =>
      layer.includedTypes.reduce((sum, type) => sum + getRawPrice(type), 0),
    [getRawPrice]
  );

  const [fetchingLayers, setFetchingLayers] = useState<Set<number>>(new Set());

  // action + sorted included types. Compared against current state to dedupe refetches.
  const layerSignaturesRef = useRef<Record<number, string>>({});

  const layerSignature = (layer: Layer) =>
    `${layer.action || 'sample'}|${[...layer.includedTypes].sort().join(',')}`;

  const fetchLayerNow = useCallback(
    async (layer: Layer) => {
      if (!selectedCountry || !selectedCity) return;
      if (layer.includedTypes.length === 0) return;
      if (fetchingLayers.has(layer.id)) return;

      setFetchingLayers(prev => {
        const next = new Set(prev);
        next.add(layer.id);
        return next;
      });
      setLayerDataMap(prev => {
        const next = { ...prev };
        delete next[layer.id];
        return next;
      });

      try {
        await handleFetchDataset(layer.action || 'sample', undefined, layer.id);
      } finally {
        setFetchingLayers(prev => {
          const next = new Set(prev);
          next.delete(layer.id);
          return next;
        });
      }
    },
    [selectedCountry, selectedCity, fetchingLayers, setLayerDataMap, handleFetchDataset]
  );

  const refreshLayer = useCallback(
    (layerId: number) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer) return;
      // Bump the signature so the auto-fetch effect doesn't immediately race us.
      layerSignaturesRef.current[layerId] = layerSignature(layer);
      fetchLayerNow(layer);
    },
    [layers, fetchLayerNow]
  );

  useEffect(() => {
    const liveIds = new Set(layers.map(layer => layer.id));
    setSavedLayerSignatures(prev => pruneLayerSignatureMap(prev, liveIds));
    setFailedLayerSignatures(prev => pruneLayerSignatureMap(prev, liveIds));
    setSavingLayerIds(prev => {
      const next = new Set([...prev].filter(id => liveIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [layers]);

  // Refetch a layer 300ms after its includedTypes or action change. Full-data flips
  // are gated by the paywall toggle, so by the time we see them here, cost is 0.
  useEffect(() => {
    if (!didHydrateRef.current) return;
    if (!selectedCountry || !selectedCity) return;

    const timeoutId = setTimeout(() => {
      const liveIds = new Set(layers.map(l => l.id));
      Object.keys(layerSignaturesRef.current).forEach(idStr => {
        if (!liveIds.has(Number(idStr))) {
          delete layerSignaturesRef.current[Number(idStr)];
        }
      });

      layers.forEach(layer => {
        if (layer.includedTypes.length === 0) return;
        const sig = layerSignature(layer);
        if (layerSignaturesRef.current[layer.id] === sig) return;
        layerSignaturesRef.current[layer.id] = sig;
        fetchLayerNow(layer);
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [layers, selectedCountry, selectedCity, fetchLayerNow]);

  const filteredCategories = Object.entries(categories).reduce((acc, [category, types]) => {
    const filteredTypes = (types as string[]).filter(type =>
      fuzzyMatchCategoryType(type, searchQuery)
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
      const cityData = res.data.data;
      setCountries(processCityData(cityData, setCitiesData));

      // Restore cities list for persisted country selection
      if (selectedCountry && cityData[selectedCountry]) {
        setCities(cityData[selectedCountry]);
      }
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
  // paywallDatasets is the prospective union shown in the modal and may differ from
  // committed fullDataDatasets while the toggle is pending.
  const [paywallData, setPaywallData] = useState<{
    total_cost: number;
    intelligence_purchase_items: IntelligencePurchaseItem[];
    dataset_purchase_items: DatasetPurchaseItem[];
    report_purchase_items: unknown[];
  } | null>(null);
  const [paywallDatasets, setPaywallDatasets] = useState<string[]>([]);
  const [pendingFullToggleLayerIndex, setPendingFullToggleLayerIndex] = useState<number | null>(
    null
  );

  const handleLayerActionChange = useCallback(
    async (index: number, nextAction: LayerAction) => {
      if (nextAction === 'sample') {
        setLayers(prev =>
          prev.map((layer, i) => (i === index ? { ...layer, action: 'sample' } : layer))
        );
        return;
      }

      const targetLayer = layers[index];
      if (!targetLayer || !selectedCountry || !selectedCity) return;

      if (targetLayer.includedTypes.length === 0) {
        setLayers(prev =>
          prev.map((layer, i) => (i === index ? { ...layer, action: 'full data' } : layer))
        );
        return;
      }

      if (authResponse && isGuestUser(authResponse)) {
        navigate('/auth?mode=register');
        return;
      }

      if (!authResponse?.localId) {
        navigate('/auth');
        return;
      }

      const prospectiveSet = new Set<string>();
      layers.forEach((layer, i) => {
        const layerAction = i === index ? 'full data' : layer.action || 'sample';
        if (layerAction === 'full data') {
          layer.includedTypes.forEach(type => prospectiveSet.add(type));
        }
      });
      const prospectiveDatasets = Array.from(prospectiveSet).sort();

      try {
        const response = await apiRequest({
          url: urls.calculate_cart_cost,
          method: 'POST',
          isAuthRequest: true,
          body: {
            user_id: authResponse.localId,
            country_name: selectedCountry,
            city_name: selectedCity,
            datasets: prospectiveDatasets,
            intelligences: [] as string[],
            displayed_price: 0,
          },
        });

        const data = response.data?.data;
        const totalCost: number = data?.total_cost ?? 0;

        // Already entitled: flip immediately, skip the modal.
        if (totalCost === 0) {
          setLayers(prev =>
            prev.map((layer, i) => (i === index ? { ...layer, action: 'full data' } : layer))
          );
          return;
        }

        setPendingFullToggleLayerIndex(index);
        setPaywallDatasets(prospectiveDatasets);
        setPaywallData({
          total_cost: totalCost,
          intelligence_purchase_items: data?.intelligence_purchase_items ?? [],
          dataset_purchase_items: data?.dataset_purchase_items ?? [],
          report_purchase_items: data?.report_purchase_items ?? [],
        });
      } catch (err) {
        console.error('Error calculating cost for layer toggle:', err);
        toast.error(t('error-calculating-cart-cost'));
      }
    },
    [layers, selectedCountry, selectedCity, authResponse]
  );

  const handlePaywallSuccess = useCallback(() => {
    if (pendingFullToggleLayerIndex !== null) {
      const idx = pendingFullToggleLayerIndex;
      setLayers(prev =>
        prev.map((layer, i) => (i === idx ? { ...layer, action: 'full data' } : layer))
      );
    }
    setPendingFullToggleLayerIndex(null);
    setPaywallData(null);
    setPaywallDatasets([]);
  }, [pendingFullToggleLayerIndex]);

  const handlePaywallClose = useCallback(() => {
    setPendingFullToggleLayerIndex(null);
    setPaywallData(null);
    setPaywallDatasets([]);
    // Re-sync cost in case the user partially purchased via the inline error flows.
    calculateCartCost();
  }, [calculateCartCost]);

  const getLayerSaveSignature = useCallback(
    (layer: Layer) => {
      const fetchedLayerData = layerDataMap[layer.id];
      return JSON.stringify({
        action: layer.action || 'sample',
        backendDatasetId: fetchedLayerData?.bknd_dataset_id || '',
        description: layer.layer_description || '',
        excludedTypes: [...layer.excludedTypes].sort(),
        includedTypes: [...layer.includedTypes].sort(),
        layerDataId: fetchedLayerData?.layer_id || '',
        legend: layer.layer_legend || layer.name || `Layer ${layer.id}`,
        name: layer.name || `Layer ${layer.id}`,
        pointsColor: layer.points_color || getDefaultLayerColor(layer.id),
      });
    },
    [layerDataMap]
  );

  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveAllError, setSaveAllError] = useState<string | null>(null);

  const handleSaveAll = useCallback(async () => {
    setSaveAllError(null);

    if (layers.length === 0) return;
    if (!selectedCountry || !selectedCity) {
      setSaveAllError(t('please-select-a-country-and-city-before-adding-datasets'));
      return;
    }

    const invalid = layers.find(
      l => l.includedTypes.length === 0 || !(l.name || `Layer ${l.id}`)
    );
    if (invalid) {
      setSaveAllError(t('every-layer-needs-at-least-one-dataset-and-a-name'));
      return;
    }

    // handleFetchDataset populates layerDataMap with the layer_id we need to save.
    const unfetched = layers.find(l => !layerDataMap[l.id]?.layer_id);
    if (unfetched) {
      setSaveAllError(t('layer-data-not-ready-please-wait-a-moment-and-try-again'));
      return;
    }

    const layerCustomizations = layers.map(layer => ({
      layerId: layer.id,
      name: layer.name || `Layer ${layer.id}`,
      legend: layer.layer_legend || layer.name || `Layer ${layer.id}`,
      description: layer.layer_description || '',
      color: layer.points_color || getDefaultLayerColor(layer.id),
    }));

    try {
      setIsSavingAll(true);
      for (const layerData of layerCustomizations) {
        const layer = layers.find(l => l.id === layerData.layerId);
        if (!layer) continue;

        const saveSignature = getLayerSaveSignature(layer);
        setSavingLayerIds(prev => new Set(prev).add(layerData.layerId));

        try {
          await handleSaveLayer({ layers: [layerData] });
          setSavedLayerSignatures(prev => ({
            ...prev,
            [layerData.layerId]: saveSignature,
          }));
          setFailedLayerSignatures(prev => {
            if (!prev[layerData.layerId]) return prev;
            const next = { ...prev };
            delete next[layerData.layerId];
            return next;
          });
        } catch (err) {
          setFailedLayerSignatures(prev => ({
            ...prev,
            [layerData.layerId]: saveSignature,
          }));
          throw err;
        } finally {
          setSavingLayerIds(prev => {
            const next = new Set(prev);
            next.delete(layerData.layerId);
            return next;
          });
        }
      }

      setSelectedHomeTab('CATALOG');
      layerCustomizations.forEach(l => {
        const savedLayerData = layerDataMap[l.layerId];
        if (savedLayerData?.layer_id) {
          fetchGeoPoints(savedLayerData.layer_id, 'layer');
        }
      });

      clearDraft(draftUserId);
    } catch (err) {
      console.error('Save All failed:', err);
      setSaveAllError(t('failed-to-save-layers-please-try-again'));
    } finally {
      setIsSavingAll(false);
    }
  }, [
    layers,
    selectedCountry,
    selectedCity,
    layerDataMap,
    handleSaveLayer,
    getLayerSaveSignature,
    setSelectedHomeTab,
    fetchGeoPoints,
    draftUserId,
  ]);

  const handleClear = useCallback(() => {
    setLayers([]);
    setReqFetchDataset(prevData => ({
      ...prevData,
      includedTypes: [],
      excludedTypes: [],
      layers: [],
    }));
    setCostEstimate(0.0);
    setLayerDataMap({});
    setGeoPoints(prev => prev.filter(p => isIntelligentLayer(p)));
    layerSignaturesRef.current = {};
    clearDraft(draftUserId);
    try {
      localStorage.removeItem('unsavedGeoPoints');
    } catch {
      // ignore
    }
  }, [setReqFetchDataset, setLayerDataMap, setGeoPoints, draftUserId]);

  const deleteLayer = useCallback(
    (layerId: number) => {
      setLayers(prev => {
        const next = prev.filter(l => l.id !== layerId);
        const remainingIncluded = next.flatMap(l => l.includedTypes);
        const remainingExcluded = next.flatMap(l => l.excludedTypes);
        setReqFetchDataset(prevData => ({
          ...prevData,
          includedTypes: remainingIncluded,
          excludedTypes: remainingExcluded,
        }));
        return next;
      });
      setLayerDataMap(prev => {
        const next = { ...prev };
        delete next[layerId];
        return next;
      });
      setGeoPoints(prev =>
        prev.filter(p => isIntelligentLayer(p) || String(p.layerId) !== String(layerId))
      );
      delete layerSignaturesRef.current[layerId];
    },
    [setReqFetchDataset, setLayerDataMap, setGeoPoints]
  );

  const refreshAllLayers = useCallback(() => {
    if (!selectedCountry || !selectedCity) return;
    layers.forEach(layer => {
      if (layer.includedTypes.length === 0) return;
      layerSignaturesRef.current[layer.id] = layerSignature(layer);
      fetchLayerNow(layer);
    });
  }, [layers, selectedCountry, selectedCity, fetchLayerNow]);

  useEffect(() => {
    refreshAllLayersRef.current = refreshAllLayers;
    clearAllLayersRef.current = handleClear;
    return () => {
      if (refreshAllLayersRef.current === refreshAllLayers) {
        refreshAllLayersRef.current = null;
      }
      if (clearAllLayersRef.current === handleClear) {
        clearAllLayersRef.current = null;
      }
    };
  }, [refreshAllLayers, handleClear, refreshAllLayersRef, clearAllLayersRef]);

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

    const remainingIncluded = updatedLayers.flatMap(layer => layer.includedTypes);
    const remainingExcluded = updatedLayers.flatMap(layer => layer.excludedTypes);

    setReqFetchDataset(prevData => ({
      ...prevData,
      includedTypes: remainingIncluded,
      excludedTypes: remainingExcluded,
    }));
  };

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

  const handleToggleCategory = (category: string) => {
    if (openedCategories.includes(category)) {
      setOpenedCategories([...openedCategories.filter(x => x !== category)]);
      return;
    }
    setOpenedCategories([...openedCategories.concat(category)]);
  };

  const toggleTypeForLayer = (type: string, layerId: number) => {
    if (!selectedCountry || !selectedCity) {
      toast.error(t('please-select-a-country-and-city-before-adding-datasets'));
      return;
    }
    setLayers(prevLayers => {
      const updatedLayers = prevLayers
        .map(layer => {
          if (layer.id !== layerId) return layer;
          if (layer.includedTypes.includes(type)) {
            return { ...layer, includedTypes: layer.includedTypes.filter(t => t !== type) };
          }
          return {
            ...layer,
            includedTypes: [...layer.includedTypes, type],
            excludedTypes: layer.excludedTypes.filter(t => t !== type),
          };
        })
        .filter(layer => layer.includedTypes.length > 0 || layer.excludedTypes.length > 0);

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

  const createLayerWithType = (type: string) => {
    if (!selectedCountry || !selectedCity) {
      toast.error(t('please-select-a-country-and-city-before-adding-datasets'));
      return;
    }
    setLayers(prevLayers => {
      const newLayerId =
        prevLayers.length > 0 ? Math.max(...prevLayers.map(l => l.id)) + 1 : 1;
      const newLayer: Layer = {
        id: newLayerId,
        name: `Layer ${newLayerId}`,
        layer_name: `Layer ${newLayerId}`,
        includedTypes: [type],
        excludedTypes: [],
        display: true,
        points_color: getDefaultLayerColor(newLayerId),
        cost: 0,
        action: 'sample',
      };
      return [...prevLayers, newLayer];
    });
  };

  const handleLayerNameChange = (index: number, newName: string) => {
    setLayers(prev =>
      prev.map((layer, i) => (i === index ? { ...layer, name: newName } : layer))
    );
  };

  const handleLayerColorChange = (index: number, color: string) => {
    setLayers(prev => {
      const targetLayer = prev[index];

      if (targetLayer) {
        setGeoPoints(prevPoints =>
          prevPoints.map(point =>
            String(point.layerId) === String(targetLayer.id)
              ? { ...point, points_color: color }
              : point
          )
        );
      }

      return prev.map((layer, i) => (i === index ? { ...layer, points_color: color } : layer));
    });
  };

  const handleLayerLegendChange = (index: number, legend: string) => {
    setLayers(prev =>
      prev.map((layer, i) => (i === index ? { ...layer, layer_legend: legend } : layer))
    );
  };

  const handleLayerDescriptionChange = (index: number, description: string) => {
    setLayers(prev =>
      prev.map((layer, i) =>
        i === index ? { ...layer, layer_description: description } : layer
      )
    );
  };

  useEffect(() => {
    setReqFetchDataset(prev => ({
      ...prev,
      layers: layers.map(layer => ({
        id: layer.id,
        name: layer.name || `Layer ${layer.id}`,
        points_color: layer.points_color || getDefaultLayerColor(layer.id),
        includedTypes: layer.includedTypes,
        excludedTypes: layer.excludedTypes,
        layer_name: layer.layer_name,
        layer_legend: layer.layer_legend,
        layer_description: layer.layer_description,
        action: layer.action || 'sample',
      })),
      // Maintain backward compatibility
      includedTypes: layers.flatMap(layer => layer.includedTypes),
      excludedTypes: layers.flatMap(layer => layer.excludedTypes),
    }));
  }, [layers, setReqFetchDataset]);

  useEffect(() => {
    if (isError) {
      toast.error(translateError(isError, 'request-failed'));
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
      toast.error(t("please-select-country-and-city-first"));
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      // Keyword search defers cost until datasets are actually added to layers.
      setCostEstimate(0.0);
    }, typingDelay);

    return () => clearTimeout(delayDebounceFn);
  }, [textSearchInput, selectedCountry, selectedCity]);

  const getLayerSaveStatus = useCallback(
    (layer: Layer): LayerSaveStatus => {
      const currentSignature = getLayerSaveSignature(layer);

      if (savingLayerIds.has(layer.id)) return 'saving';
      if (failedLayerSignatures[layer.id] === currentSignature) return 'error';
      if (savedLayerSignatures[layer.id] === currentSignature) return 'saved';
      return 'unsaved';
    },
    [failedLayerSignatures, getLayerSaveSignature, savedLayerSignatures, savingLayerIds]
  );

  const unsavedLayerCount = useMemo(
    () => layers.filter(layer => getLayerSaveStatus(layer) !== 'saved').length,
    [getLayerSaveStatus, layers]
  );

  const allCurrentLayersSaved = layers.length > 0 && unsavedLayerCount === 0;

  return (
    <>
      <div className="flex-1 flex flex-col justify-between overflow-y-auto relative">
        <div className="w-full p-4 overflow-y-auto ">
          <div className="mb-6">
            <label className="block mb-2 text-base font-medium text-black" htmlFor="ai-fetch">{t("ai-powered-dataset-finder")}</label>
            <div className="flex relative w-full" ref={chatAnchorRef}>
              <ChatTrigger
                title={t("ai-dataset-finder")}
                position="auto"
                cN="flex-grow"
                size="h-14"
                colors="bg-gem-gradient border text-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all"
                beforeIcon={<FaWandMagicSparkles />}
                afterIcon={<></>}
              />
              <Chat
                topic={topics.DATASET}
                position="fixed bottom-16 start-[2.5vw] z-50"
                anchorRef={chatAnchorRef as React.RefObject<HTMLElement>}
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 text-md font-medium text-black" htmlFor="country">{t("country")}</label>
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
              <option value="" disabled>{t("select-a-country")}</option>
              {countries.map(country => (
                <option value={country} key={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <label className="block mb-2 text-md font-medium text-black" htmlFor="city">{t("city")}</label>
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
              <option value="" disabled>{t("select-a-city")}</option>
              {cities.map(city => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div className={`${!selectedCountry || !selectedCity ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="block my-2 text-base font-medium text-black" htmlFor="layers">{t("layers")}</label>
          <div
            id="layers"
            className="flex text-sm flex-col border border-gray-300 rounded-lg p-4 gap-4"
          >
            {layers.map((layer, index) => (
              <LayerDisplaySubCategories
                key={layer.id}
                layer={layer}
                layerIndex={index}
                onRemoveType={(type: string) => removeTypeFromLayer(type, layer.id, false)}
                onNameChange={handleLayerNameChange}
                onColorChange={handleLayerColorChange}
                onLegendChange={handleLayerLegendChange}
                onDescriptionChange={handleLayerDescriptionChange}
                onActionChange={handleLayerActionChange}
                onRefresh={refreshLayer}
                onDelete={deleteLayer}
                isFetching={fetchingLayers.has(layer.id)}
                saveStatus={getLayerSaveStatus(layer)}
                listPrice={getLayerListPrice(layer)}
                formatPrice={formatPrice}
                isPriceVisible={isPriceVisible}
              />
            ))}
          </div>

          <div className="border-t mt-4 pt-2">
            <label className="block mb-2 text-md font-medium text-black" htmlFor="searchType">{t("search-type")}</label>
            <select
              name="searchType"
              id="searchType"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={searchType || 'category_search'}
              onChange={e => {
                setSearchType(e.target.value);
              }}
              disabled={!selectedCountry || !selectedCity}
            >
              <option value="category_search">{t("category-search")}</option>
              <option value="keyword_search">{t("keyword-search")}</option>
            </select>
          </div>

          {searchType =="keyword_search" && (
            <div className="pt-4">
              <label
                className="block mb-2 text-md font-medium text-black"
                htmlFor="textSearchInput"
              >{t("search")}</label>
              <input
                type="text"
                id="textSearchInput"
                name="textSearchInput"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder={t("enter-search-text")}
                value={textSearchInput}
                onChange={e => setTextSearchInput(e.target.value)}
                disabled={!selectedCountry || !selectedCity}
              />

            </div>
          )}

          {searchType !=="keyword_search" && (
            <div className="flex flex-col my-5" ref={categoriesRef}>
              <div className="flex justify-between">
                <label className="mb-4 font-bold">{t("what-are-you-looking-for")}</label>
                <button
                  onClick={handleClear}
                  disabled={!selectedCountry || !selectedCity}
                  className="w-16 h-6 text-sm bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >{t("clear")}</button>
              </div>

              <div className="pb-3">
                <div className="flex justify-end mb-1">
                  <p className="text-[10px] text-gray-500">{t("data-updated-on")}{' '}
                    <span className="text-[#115740] font-medium">{getYesterdayDate()}</span>
                  </p>
                </div>
                <input
                  type="text"
                  id="searchInput"
                  name="searchInput"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder={t("search-for-a-type")}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  disabled={!selectedCountry || !selectedCity}
                />
              </div>
              <CategoriesBrowserSubCategories
                categories={filteredCategories}
                openedCategories={openedCategories}
                onToggleCategory={handleToggleCategory}
                getTypeCounts={getTypeCounts}
                layers={layers.map(l => ({ id: l.id, name: l.name }))}
                onToggleTypeInLayer={toggleTypeForLayer}
                onCreateLayerWithType={createLayerWithType}
                getPrice={getPrice}
              />
            </div>
          )}
          </div>
        </div>
      </div>
      <div className="flex-col flex px-2 py-2 select-none border-t lg:mb-0 mb-14 relative">
        {layers.length > 0 && (
          <p className={`mb-2 text-xs font-medium ${
            allCurrentLayersSaved ? 'text-green-700' : 'text-amber-700'
          }`}>
            {isSavingAll
              ? t('saving-layer-status')
              : allCurrentLayersSaved
                ? t('all-layers-saved')
                : t('layers-not-saved-count', { count: unsavedLayerCount })}
          </p>
        )}
        {saveAllError && (
          <p className="mb-2 text-sm text-red-600">{saveAllError}</p>
        )}
        <button
          className="w-full bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSaveAll}
          disabled={
            isSavingAll ||
            isLoadingDataset ||
            !selectedCountry ||
            !selectedCity ||
            layers.length === 0 ||
            allCurrentLayersSaved
          }
        >
          <span className="text-lg">
            {isSavingAll
              ? t('saving-all')
              : allCurrentLayersSaved
                ? t('all-saved')
                : t('save-all')}
          </span>
        </button>
      </div>

      {showErrorMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white shadow-xl w-96 max-w-full">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-100  border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="me-2">⚠️</span>{' '}{t("warning")}</h3>
              <button
                onClick={() => setShowErrorMessage(false)}
                className="text-gray-800 hover:text-gray-600 focus:outline-none"
              >
                <PiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 text-center">
              <p className="text-base text-gray-800 font-medium">{t("insufficient-funds-for-this-transaction")}</p>
              <p className="text-sm text-gray-600 mt-2">{t("please-add-more-funds-to-continue")}</p>
            </div>

            <div className="flex justify-center px-6 py-4">
              <button
                onClick={() => nav('/profile/wallet/add')}
                className="w-full h-10 bg-[#115740] text-white flex justify-center items-center font-semibold rounded-lg hover:bg-[#123f30] transition-all cursor-pointer"
              >{t("add-funds")}</button>
            </div>
          </div>
        </div>
      )}

      {paywallData && selectedCountry && selectedCity && (
        <IntelligencePaywallModal
          purchaseKind="dataset"
          datasetNames={paywallDatasets}
          countryName={selectedCountry}
          cityName={selectedCity}
          cartCostData={paywallData}
          onClose={handlePaywallClose}
          onPurchaseSuccess={handlePaywallSuccess}
        />
      )}
    </>
  );
};

export default FetchDatasetForm;
