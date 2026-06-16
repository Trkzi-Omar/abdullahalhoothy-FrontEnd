/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useCatalogContext } from '../../context/CatalogContext';
import { defaultMapConfig } from './useMapInitialization';
import { getDefaultLayerColor } from '../../utils/helperFunctions';
import * as turf from '@turf/turf';
import { useMapContext } from '../../context/MapContext';
import { generatePopupContent } from '../../pages/MapContainer/generatePopupContent';
import { CustomProperties, TargetLocation } from '../../types/allTypesAndInterfaces';
import { useUIContext } from '../../context/UIContext';
import apiRequest from '../../services/apiRequest';
import urls from '../../urls.json';
import { useGridPopup } from './useGridPopup';
import { useGridInteraction } from './useGridInteraction';
import _ from 'lodash';
import { isIntelligentLayer } from '../../utils/layerUtils';

import { LRUCache } from 'lru-cache';
import { CityApiItem, CityBounds, WorkerFeatureResponse } from '../../types/map';

const cache = new LRUCache({
  max: 100,
});

const streetViewCache = new Map();
const debouncedStreetViewCheck = _.debounce(
  async (lat: number, lng: number, callback: (hasStreetView: boolean) => void) => {
    const cacheKey = `${lat},${lng}`;
    if (streetViewCache.has(cacheKey)) {
      callback(streetViewCache.get(cacheKey));
      return;
    }

    try {
      const hasStreetView = await apiRequest({
        url: urls.check_street_view,
        method: 'POST',
        body: { lat, lng },
      });
      const hasStreetViewValue = hasStreetView.data.data.has_street_view;
      streetViewCache.set(cacheKey, hasStreetViewValue);
      callback(hasStreetViewValue);
    } catch (error) {
      console.error('Error fetching street view:', error);
      callback(false);
    }
  },
  300
);

const GRID_MAX_OPACITY = 0.75;

const getGridPaint = (pointsColor: string) => ({
  'fill-color': pointsColor || defaultMapConfig.defaultColor,
  'fill-opacity': [
    'case',
    // No points in cell → fully transparent
    ['==', ['coalesce', ['get', 'pointCount'], 0], 0],
    0,
    // If backend_opacity is available (backend grid data), use it
    ['has', 'backend_opacity'],
    ['min', ['/', ['get', 'backend_opacity'], 100], GRID_MAX_OPACITY],
    // Fallback for regular grids: density-based opacity using log scale
    ['min',
      ['/', ['ln', ['+', ['coalesce', ['get', 'pointCount'], 0], 1]], 5],
      GRID_MAX_OPACITY,
    ],
  ],
  'fill-outline-color': [
    'case',
    ['==', ['coalesce', ['get', 'pointCount'], 0], 0],
    'rgba(0,0,0,0)',
    'rgba(0,0,0,0.3)',
  ],
});

const getHeatmapPaint = (basedon: string, pointsColor?: string) => ({
  'heatmap-weight': ['interpolate', ['linear'], ['get', 'density'], 0, 0, 5, 1],
  'heatmap-color': [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0,
    'rgba(33,102,172,0)',
    0.2,
    pointsColor || defaultMapConfig.defaultColor,
    0.4,
    'rgb(209,229,240)',
    0.6,
    'rgb(253,219,199)',
    0.8,
    'rgb(239,138,98)',
    1,
    'rgb(178,24,43)',
  ],
});

const getCirclePaint = (pointsColor: string | undefined, layerId: number) => ({
  'circle-radius': defaultMapConfig.circleRadius,
  'circle-color': pointsColor || getDefaultLayerColor(layerId),
  'circle-opacity': defaultMapConfig.circleOpacity,
  'circle-stroke-width': defaultMapConfig.circleStrokeWidth,
  'circle-stroke-color': defaultMapConfig.circleStrokeColor,
});

const getGradientCirclePaint = (defaultColor: string | undefined) => ({
  'circle-radius': defaultMapConfig.circleRadius,
  'circle-color': [
    'coalesce',
    ['get', 'gradient_color'], // Use gradient color if available
    defaultColor || defaultMapConfig.defaultColor, // Fallback to default
  ],
  'circle-opacity': defaultMapConfig.circleOpacity,
  'circle-stroke-width': defaultMapConfig.circleStrokeWidth,
  'circle-stroke-color': defaultMapConfig.circleStrokeColor,
});

export function useMapLayers() {
  const { mapRef, shouldInitializeFeatures, gridSize, targetLocation, setTargetLocation } = useMapContext();
  const { isMobile } = useUIContext();
  const map = mapRef.current;
  const { geoPoints } = useCatalogContext();

  const [cityBounds, setCityBounds] = useState<Record<string, CityBounds>>({});

  // Add this ref
  const gridLayerIdRef = useRef<string | null>(null);
  const activePopupRef = useRef<mapboxgl.Popup | null>(null);

  // Ref to hold a pending targetLocation so we can process it after layers are ready
  const pendingTargetRef = useRef<TargetLocation | null>(null);

  // Replace the single layerStateRef with layerStatesRef
  const layerStatesRef = useRef<{
    [key: string]: {
      sourceId: string;
      layerId: string;
      gridSourceId: string | null;
      gridLayerId: string | null;
    };
  }>({});

  // Initialize popup handlers first
  const { createGridPopup, cleanupGridPopup } = useGridPopup(map);

  // Then initialize grid handlers with the popup functions
  const { handleGridCellClick, cleanupGridSelection } = useGridInteraction(
    map,
    createGridPopup,
    cleanupGridPopup
  );

  // Helper to show the target location popup on the map
  const showTargetPopup = useCallback((
    mapInstance: mapboxgl.Map,
    coordinates: [number, number],
    properties: Record<string, unknown>
  ) => {
    mapInstance.flyTo({
      center: coordinates,
      zoom: 15,
      essential: true,
    });

    if (activePopupRef.current) {
      activePopupRef.current.remove();
    }

    const loadingContent = generatePopupContent(
      properties,
      coordinates,
      true,
      false
    );

    const newPopup = new mapboxgl.Popup({
      closeButton: isMobile,
    })
      .setLngLat(coordinates)
      .setHTML(loadingContent)
      .addTo(mapInstance);

    activePopupRef.current = newPopup;

    const [lng, lat] = coordinates;

    const isIntelligent = typeof properties.bknd_dataset_id === 'string' &&
      properties.bknd_dataset_id.split('_').some((part: string) =>
        ['population', 'income', 'real_estate'].includes(part)
      );

    if (isIntelligent) {
      newPopup.setHTML(generatePopupContent(properties, coordinates, false, false));
    } else {
      debouncedStreetViewCheck(lat, lng, hasStreetView => {
        if (activePopupRef.current === newPopup) {
          newPopup.setHTML(
            generatePopupContent(properties, coordinates, false, hasStreetView)
          );
        }
      });
    }

    const popupElement = newPopup.getElement();
    popupElement.addEventListener('click', e => e.stopPropagation());
  }, [isMobile]);

  // Update cleanup function to handle multiple layers
  const cleanupLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    try {
      // Clean up popups first
      cleanupGridPopup();
      if (activePopupRef.current) {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      }

      // Clean up each layer
      Object.values(layerStatesRef.current).forEach(layerState => {
        const { gridLayerId, gridSourceId, layerId, sourceId } = layerState;

        // Remove button layer first
        if (gridLayerId && map.getLayer(`${gridLayerId}-buttons`)) {
          map.removeLayer(`${gridLayerId}-buttons`);
        }

        // Remove outline layer for polygons first
        if (gridLayerId && map.getLayer(`${gridLayerId}-outline`)) {
          map.removeLayer(`${gridLayerId}-outline`);
        }

        // Then remove grid/polygon layer
        if (gridLayerId && map.getLayer(gridLayerId)) {
          map.removeLayer(gridLayerId);
        }

        // Remove regular layers
        if (layerId && map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }

        // Then remove sources
        if (gridSourceId && map.getSource(gridSourceId)) {
          map.removeSource(gridSourceId);
        }

        if (sourceId && map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }

        // Clean up grid selection state
        cleanupGridSelection(gridSourceId || '');
      });

      // Remove image
      if (map.hasImage('info-button')) {
        map.removeImage('info-button');
      }

      // Clear refs
      layerStatesRef.current = {};
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, [map, cleanupGridPopup, cleanupGridSelection]);

  useEffect(() => {
    const fetchCityBounds = async () => {
      try {
        const response = await apiRequest({
          url: urls.country_city,
          method: 'GET',
        });

        const boundsMap: Record<string, CityBounds> = {};
        (Object.values(response.data.data) as CityApiItem[][])
          .flat()
          .forEach((city: CityApiItem) => {
            boundsMap[city.name.toLowerCase()] = {
              // Format: [west, south, east, north]
              bounds: [
                city.borders.southwest.lng, // west (minX)
                city.borders.southwest.lat, // south (minY)
                city.borders.northeast.lng, // east (maxX)
                city.borders.northeast.lat, // north (maxY)
              ],
              center: [city.lng, city.lat],
            };
          });
        setCityBounds(boundsMap);
      } catch (error) {
        console.error('Error fetching city bounds:', error);
      }
    };

    fetchCityBounds();
  }, []);

  // When targetLocation changes in context, either show the popup immediately (if
  // layers are already set up) or stash it in a ref for the layers effect to handle.
  useEffect(() => {
    if (!targetLocation) return;

    // If the map and layers are already initialised (user is already on the map page),
    // we can show the popup immediately — no need to wait for layers.
    const mapInstance = mapRef.current;
    if (shouldInitializeFeatures && mapInstance && Object.keys(layerStatesRef.current).length > 0) {
      showTargetPopup(mapInstance, targetLocation.coordinates, targetLocation.properties);
      setTargetLocation(null);
      return;
    }

    // Otherwise, stash it for the layers effect to handle after layer setup.
    pendingTargetRef.current = targetLocation;
    setTargetLocation(null);
  }, [targetLocation, shouldInitializeFeatures, mapRef, setTargetLocation, showTargetPopup]);

  // Effect to add layers
  useEffect(() => {
    if (!shouldInitializeFeatures || !map) return;

    const addLayers = async () => {
      if (!map.isStyleLoaded()) {
        console.warn('Style not loaded, deferring layer update...');
        const styleLoadHandler = () => {
          if (map.isStyleLoaded()) {
            addLayers();
          }
          map.off('style.load', styleLoadHandler);
        };
        map.on('style.load', styleLoadHandler);
        return;
      }

      try {
        // Always clean up existing layers first
        cleanupLayers();
        cleanupGridPopup();

        // Reset layer state
        layerStatesRef.current = {};

        const visibleGeoPoints = geoPoints.filter(point => !point.isHydrating);

        if (visibleGeoPoints.length > 0) {
          const sortedGeoPoints = [...visibleGeoPoints]
            .reverse()
            .sort((a, b) => {
              // Intelligent layers should be added first (bottom)
              if (isIntelligentLayer(a) && !isIntelligentLayer(b)) return -1;
              if (!isIntelligentLayer(a) && isIntelligentLayer(b)) return 1;

              // Then grid layers
              if (a.is_grid && !b.is_grid) return -1;
              if (!a.is_grid && b.is_grid) return 1;

              // Then heatmap layers
              if (a.is_heatmap && !b.is_heatmap) return -1;
              if (!a.is_heatmap && b.is_heatmap) return 1;

              // Regular point/circle layers last (top)
              return 0;
            });

          for (const [index, featureCollection] of sortedGeoPoints.entries()) {
            if (featureCollection.basedon === 'income') {
              console.log(
                'INCOME Layer featureCollection:',
                JSON.stringify(featureCollection, null, 2)
              );
            }
            if (!featureCollection.type || !Array.isArray(featureCollection.features)) {
              console.error('🗺️ [Map] Invalid GeoJSON structure:', featureCollection);
              return;
            }

            const sourceId = `circle-source-${index}`;
            const layerId = `circle-layer-${index}`;
            const gridSourceId = `${sourceId}-grid`;
            const gridLayerId = `${layerId}-grid`;

            // Store IDs for this specific layer
            layerStatesRef.current[index] = {
              sourceId,
              layerId,
              gridSourceId,
              gridLayerId,
            };

            try {
              // Add source
              map.addSource(sourceId, {
                type: 'geojson',
                data: featureCollection,
                generateId: true,
              });

              if (featureCollection.is_backend_grid) {
                console.time('Polygon processing');

                try {
                  const worker = new Worker(
                    new URL('../../workers/polygonGridGeneration.worker.ts', import.meta.url),
                    {
                      type: 'module',
                    }
                  );

                  console.log(
                    'featureCollection - polygonGridGeneration.worker.ts',
                    JSON.stringify(featureCollection, null, 2)
                  );

                  worker.postMessage({ featureCollection });

                  const processedData = await new Promise<WorkerFeatureResponse>(
                    (resolve, reject) => {
                      worker.onmessage = event => {
                        if (event.data.error) {
                          reject(new Error(event.data.error));
                        } else {
                          resolve(event.data);
                        }
                      };
                      worker.onerror = err => reject(err);
                    }
                  );

                  worker.terminate();

                  // Add source with processed polygons
                  map.addSource(gridSourceId, {
                    type: 'geojson',
                    data: {
                      type: 'FeatureCollection',
                      features: processedData.features,
                    },
                    generateId: true,
                  });

                  // Add fill layer for polygons
                  map.addLayer({
                    id: gridLayerId,
                    type: 'fill',
                    source: gridSourceId,
                    layout: {
                      visibility: featureCollection.display ? 'visible' : 'none',
                    },
                    paint: {
                      'fill-color':
                        featureCollection.points_color || defaultMapConfig.defaultColor,
                      'fill-opacity': [
                        'min',
                        ['coalesce', ['/', ['get', 'backend_opacity'], 100], 0],
                        GRID_MAX_OPACITY,
                      ],
                      'fill-outline-color': '#000',
                    },
                  });

                  // Add outline layer for polygons
                  map.addLayer({
                    id: `${gridLayerId}-outline`,
                    type: 'line',
                    source: gridSourceId,
                    layout: {
                      visibility: featureCollection.display ? 'visible' : 'none',
                    },
                    paint: {
                      'line-color': '#000',
                      'line-width': 1,
                    },
                  });

                  console.timeEnd('Polygon processing');

                  // Store IDs
                  gridLayerIdRef.current = gridLayerId;
                  layerStatesRef.current[index].gridSourceId = gridSourceId;

                  const handleGridInteraction = (
                    e:
                      | (mapboxgl.MapMouseEvent & mapboxgl.EventData)
                      | (mapboxgl.MapTouchEvent & mapboxgl.EventData)
                  ) => {
                    e.preventDefault();
                    handleGridCellClick(e);
                  };

                  // Add interaction handlers directly to grid cells
                  map.on('click', gridLayerId, handleGridInteraction);
                  if (isMobile) {
                    map.on('touchstart', gridLayerId, handleGridInteraction);
                  }

                  // Add hover effects for the grid cells
                  map.on('mouseenter', gridLayerId, () => {
                    map.getCanvas().style.cursor = 'pointer';
                  });

                  map.on('mouseleave', gridLayerId, () => {
                    map.getCanvas().style.cursor = '';
                  });
                } catch (error) {
                  console.error('Error processing polygons:', error);
                }
              } else if (featureCollection.is_grid) {
                let bounds;
                if (
                  featureCollection.city_name &&
                  cityBounds[featureCollection.city_name.toLowerCase()]
                ) {
                  const cityBound = cityBounds[featureCollection.city_name.toLowerCase()].bounds;
                  bounds = [
                    cityBound[0] - 0.1,
                    cityBound[1] - 0.1,
                    cityBound[2] + 0.1,
                    cityBound[3] + 0.1,
                  ];
                } else {
                  // Fallback to calculating bounds from features
                  const bbox = turf.bbox(featureCollection);
                  const bboxPolygon = turf.bboxPolygon(bbox);
                  // Increase buffer for fallback bounds
                  const bufferedBbox = turf.buffer(bboxPolygon, 1, { units: 'kilometers' });
                  bounds = turf.bbox(bufferedBbox);
                }

                // Create grid
                const cellSide = gridSize / 1000;
                const options = { units: 'kilometers' as const };
                const grid = turf.squareGrid(bounds, cellSide, options);

                // Calculate density for each cell
                console.time('Grid generation');

                const cacheKey = JSON.stringify([cellSide, bounds]);

                if (cache.has(cacheKey)) {
                  grid.features = cache.get(cacheKey);
                } else {
                  const worker = new Worker(
                    new URL('../../workers/gridGeneration.worker.ts', import.meta.url),
                    {
                      type: 'module',
                    }
                  );

                  worker.postMessage({ grid, featureCollection });

                  grid.features = await new Promise<GeoJSON.Feature[]>((resolve, reject) => {
                    worker.onmessage = event => {
                      resolve(event.data.features);
                    };
                    worker.onerror = err => reject(err);
                  });

                  worker.terminate();

                  cache.set(cacheKey, grid.features);
                }

                console.timeEnd('Grid generation');

                // Add grid source
                map.addSource(gridSourceId, {
                  type: 'geojson',
                  data: grid,
                  generateId: true,
                });

                // Add grid layer with interactive settings
                map.addLayer({
                  id: gridLayerId,
                  type: 'fill',
                  source: gridSourceId,
                  layout: {
                    visibility: featureCollection.display ? 'visible' : 'none',
                  },
                  paint: getGridPaint(
                    featureCollection.points_color || defaultMapConfig.defaultColor
                  ),
                });

                // Store IDs
                gridLayerIdRef.current = gridLayerId;
                layerStatesRef.current[index].gridSourceId = gridSourceId;

                const handleGridInteraction = (
                  e:
                    | (mapboxgl.MapMouseEvent & mapboxgl.EventData)
                    | (mapboxgl.MapTouchEvent & mapboxgl.EventData)
                ) => {
                  e.preventDefault();
                  handleGridCellClick(e);
                };

                // Add interaction handlers directly to grid cells
                map.on('click', gridLayerId, handleGridInteraction);
                if (isMobile) {
                  map.on('touchstart', gridLayerId, handleGridInteraction);
                }

                // Add hover effects for the grid cells
                map.on('mouseenter', gridLayerId, () => {
                  map.getCanvas().style.cursor = 'pointer';
                });

                map.on('mouseleave', gridLayerId, () => {
                  map.getCanvas().style.cursor = '';
                });
              } else if (featureCollection.is_heatmap) {
                const worker = new Worker(
                  new URL('../../workers/heatmapGeneration.worker.ts', import.meta.url),
                  {
                    type: 'module',
                  }
                );

                try {
                  worker.postMessage({
                    featureCollection,
                    basedon: featureCollection.basedon,
                  });

                  const processedData = await new Promise<WorkerFeatureResponse>(
                    (resolve, reject) => {
                      worker.onmessage = event => {
                        if (event.data.error) {
                          reject(new Error(event.data.error));
                        } else {
                          resolve(event.data);
                        }
                      };
                      worker.onerror = err => reject(err);
                    }
                  );

                  worker.terminate();

                  map.getSource(sourceId).setData({
                    type: 'FeatureCollection',
                    features: processedData.features,
                  });

                  map.addLayer({
                    id: layerId,
                    type: 'heatmap',
                    source: sourceId,
                    layout: {
                      visibility: featureCollection.display ? 'visible' : 'none',
                    },
                    paint: getHeatmapPaint(
                      featureCollection.basedon,
                      featureCollection.points_color
                    ),
                  });
                } catch (error) {
                  console.error('Error processing heatmap:', error);
                }
              } else {
                // Circle layer / points (default)
                map.addLayer({
                  id: layerId,
                  type: 'circle',
                  source: sourceId,
                  layout: {
                    visibility: featureCollection.display ? 'visible' : 'none',
                  },
                  paint: featureCollection.is_gradient
                    ? getGradientCirclePaint(featureCollection.points_color)
                    : getCirclePaint(featureCollection.points_color, index),
                });
              }

              // Add hover interaction variables
              let hoveredStateId: number | null = null;
              const isOverPopup = false;
              let isOverPoint = false;

              const handleMouseOverOrTouchStart = async (
                e:
                  | (mapboxgl.MapMouseEvent & mapboxgl.EventData)
                  | (mapboxgl.MapTouchEvent & mapboxgl.EventData)
              ) => {
                if (!map) return;
                isOverPoint = true;
                map.getCanvas().style.cursor = '';

                if (e.features && e.features.length > 0) {
                  if (hoveredStateId !== null) {
                    map.setFeatureState(
                      { source: sourceId, id: hoveredStateId },
                      { hover: false }
                    );
                  }

                  hoveredStateId = e.features[0].id as number;
                  map.setFeatureState({ source: sourceId, id: hoveredStateId }, { hover: true });

                  const coordinates = (
                    e.features[0].geometry as GeoJSON.Point
                  ).coordinates.slice() as [number, number];
                  const properties = e.features[0].properties as CustomProperties;

                  // Show loading spinner in the popup
                  const loadingContent = generatePopupContent(
                    properties,
                    coordinates,
                    true,
                    false
                  );

                  if (activePopupRef.current) {
                    activePopupRef.current.remove();
                  }

                  const newPopup = new mapboxgl.Popup({
                    closeButton: isMobile,
                  })
                    .setLngLat(coordinates)
                    .setHTML(loadingContent)
                    .addTo(map);

                  activePopupRef.current = newPopup;

                  const [lng, lat] = coordinates;

                  if (isIntelligentLayer(featureCollection)) {
                    newPopup.setHTML(generatePopupContent(properties, coordinates, false, false));
                  } else {
                    debouncedStreetViewCheck(lat, lng, hasStreetView => {
                      if (activePopupRef.current === newPopup) {
                        newPopup.setHTML(
                          generatePopupContent(properties, coordinates, false, hasStreetView)
                        );
                      }
                    });
                  }

                  const popupElement = newPopup.getElement();
                  popupElement.addEventListener('click', e => e.stopPropagation());
                }
              };

              const handleMouseLeave = () => {
                if (!map) return;
                isOverPoint = false;
                map.getCanvas().style.cursor = '';

                if (hoveredStateId !== null) {
                  map.setFeatureState({ source: sourceId, id: hoveredStateId }, { hover: false });
                }
                hoveredStateId = null;
              };

              if (isMobile) {
                map.on('touchstart', layerId, handleMouseOverOrTouchStart);
              } else {
                map.on('click', layerId, handleMouseOverOrTouchStart);
                map.on('mouseleave', layerId, handleMouseLeave);
              }
            } catch (error) {
              console.error('Error adding layer:', error);
            }
          }

          console.log(`geoPoints ${geoPoints.length}`, geoPoints);
        }

        // After layers are fully added, process any pending target location
        const pendingTarget = pendingTargetRef.current;
        if (pendingTarget) {
          pendingTargetRef.current = null;
          showTargetPopup(map, pendingTarget.coordinates, pendingTarget.properties);
        }
      } catch (error) {
        console.error('Error managing layers:', error);
      }
    };

    // Attempt to add layers with retry
    const attemptToAddLayers = () => {
      if (map.isStyleLoaded()) {
        addLayers();
      } else {
        let retryCount = 0;
        const maxRetries = 50; // 5 seconds total

        const retryInterval = setInterval(() => {
          if (map.isStyleLoaded()) {
            clearInterval(retryInterval);
            addLayers();
          } else if (retryCount >= maxRetries) {
            clearInterval(retryInterval);
          }
          retryCount++;
        }, 100);
      }
    };

    attemptToAddLayers();
    return () => {
      cleanupLayers();
    };
  }, [mapRef, geoPoints, shouldInitializeFeatures, cityBounds, showTargetPopup]);
}
