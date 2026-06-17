/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import apiRequest from '../services/apiRequest';
import urls from '../urls.json';
import { useMapContext } from '../context/MapContext';
import { toast } from 'sonner';
import { useCatalogContext } from '../context/CatalogContext';
import { useUIContext } from '../context/UIContext';
import { MeasurementForm } from '../components/MeasurementForm/MeasurementForm';
import { SaveMarkerForm } from '../components/SaveMarkerForm/SaveMarkerForm';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MarkerType, MeasurementApiResponse, MeasurementResult, PopupElement } from '../types';
import i18n, { t } from '../i18n';

export interface MeasurementState {
  isMeasuring: boolean;
  measureSourcePoint: mapboxgl.LngLat | null;
  measureDestinationPoint: mapboxgl.LngLat | null;
  measurementResult: MeasurementResult | null;
  measureLine: GeoJSON.Feature<GeoJSON.LineString> | null;
  previewLine: GeoJSON.Feature<GeoJSON.LineString> | null;
  measurementPopup: mapboxgl.Popup | null;
}

export interface MeasurementActions {
  initializeMeasureMode: (sourcePointId?: string) => void;
  exitMeasureMode: () => void;
  handleMapClickForMeasurement: (e: mapboxgl.MapMouseEvent) => Promise<void>;
  clearMeasurementLayers: () => void;
  displayRouteOnMap: (
    polygonData: GeoJSON.GeoJSON,
    savedMeasurement?: {
      id: string;
      name: string;
      description: string;
      distance: number;
      duration: number;
    }
  ) => void;
  decodePolyline: (encoded: string) => [number, number][];
  setIsMeasuring: (isMeasuring: boolean) => void;
  setMeasureSourcePoint: (point: mapboxgl.LngLat | null) => void;
  setMeasureDestinationPoint: (point: mapboxgl.LngLat | null) => void;
  setMeasurementResult: (result: MeasurementResult | null) => void;
}

export const useMeasurement = (): MeasurementState & MeasurementActions => {
  const { mapRef, shouldInitializeFeatures } = useMapContext();
  const {
    markers,
    addMarker,
    setMarkers,
    addMeasurement,
    deleteMeasurement,
    startMeasurementSession,
    endMeasurementSession,
    getCurrentSessionId,
    markSessionMarkersForDeletion,
    cleanupMarkedMarkers,
  } = useCatalogContext();
  const { openModal, closeModal } = useUIContext();
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measureSourcePoint, setMeasureSourcePoint] = useState<mapboxgl.LngLat | null>(null);
  const [measureDestinationPoint, setMeasureDestinationPoint] = useState<mapboxgl.LngLat | null>(
    null
  );
  const [measurementResult, setMeasurementResult] = useState<MeasurementResult | null>(null);
  const [measureLine, setMeasureLine] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const [previewLine, setPreviewLine] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const [measurementPopup, setMeasurementPopup] = useState<mapboxgl.Popup | null>(null);

  const isExitingRef = useRef<boolean>(false);

  useEffect(() => {
    const closeStalePopup = () => {
      setMeasurementPopup(currentPopup => {
        currentPopup?.remove();
        return null;
      });
    };

    i18n.on('languageChanged', closeStalePopup);
    return () => {
      i18n.off('languageChanged', closeStalePopup);
    };
  }, []);

  const clearMeasurementLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getSource('measure-line')) {
      map.removeLayer('measure-line-layer');
      map.removeSource('measure-line');
    }

    if (map.getSource('preview-line')) {
      map.removeLayer('preview-line-layer');
      map.removeSource('preview-line');
    }

    if (map.getSource('measure-route')) {
      map.removeLayer('measure-route-line');
      map.removeSource('measure-route');
    }

    if (map.getSource('measure-polygon')) {
      map.removeLayer('measure-polygon-fill');
      map.removeLayer('measure-polygon-outline');
      map.removeSource('measure-polygon');
    }

    // Clean up the measurement popup
    if (measurementPopup) {
      measurementPopup.remove();
      setMeasurementPopup(null);
    }

    setMeasureLine(null);
    setPreviewLine(null);
  }, [mapRef, measurementPopup, setMeasurementPopup]);

  const initializeMeasureMode = useCallback(
    (sourcePointId?: string) => {
      console.log('initializeMeasureMode called with sourcePointId:', sourcePointId);
      setIsMeasuring(true);
      clearMeasurementLayers();
      const newSessionId = startMeasurementSession();
      console.log('New session started with ID:', newSessionId);

      if (sourcePointId) {
        console.log('Finding source point with ID:', sourcePointId);
        const sourceMarker = markers.find(m => m.id === sourcePointId);
        if (sourceMarker) {
          console.log('Found source marker:', sourceMarker);
          setMeasureSourcePoint(
            new mapboxgl.LngLat(sourceMarker.coordinates[0], sourceMarker.coordinates[1])
          );
        } else {
          console.log('Source marker not found');
        }
      }
    },
    [clearMeasurementLayers, startMeasurementSession, markers]
  );

  const exitMeasureMode = useCallback(() => {
    console.log('exitMeasureMode called');

    // Guard against multiple executions
    if (isExitingRef.current) {
      console.log('exitMeasureMode already in progress, skipping...');
      return;
    }

    isExitingRef.current = true;

    // Capture the current session ID before ending the session
    const currentSessionId = getCurrentSessionId();
    console.log('Current session ID at exit:', currentSessionId);

    setIsMeasuring(false);
    setMeasureSourcePoint(null);
    setMeasureDestinationPoint(null);
    setMeasurementResult(null);

    const map = mapRef.current;
    if (map) {
      // Mark markers from current session for deletion using the captured session ID
      if (currentSessionId) {
        markSessionMarkersForDeletion(currentSessionId);
      } else {
        console.warn('No session ID available for marking markers for deletion');
      }

      // Remove all measurement routes and their layers
      if (map.getSource('measure-route')) {
        map.removeLayer('measure-route-line');
        map.removeSource('measure-route');
      }

      // Remove all popups
      document.querySelectorAll('.mapboxgl-popup').forEach(popup => {
        const popupInstance = (popup as PopupElement)._mapboxgl_popup;
        if (popupInstance && popupInstance.remove) {
          popupInstance.remove();
        } else {
          popup.remove();
        }
      });

      // Remove any remaining measurement-related layers
      if (map.getSource('measure-line')) {
        map.removeLayer('measure-line-layer');
        map.removeSource('measure-line');
      }
      if (map.getSource('preview-line')) {
        map.removeLayer('preview-line-layer');
        map.removeSource('preview-line');
      }
    }

    document.querySelectorAll('.loading-popup').forEach(el => el.remove());

    if (measurementPopup) {
      console.log('Removing measurement popup:', measurementPopup);
      measurementPopup.remove();
      setMeasurementPopup(null);
      console.log('Measurement popup after removal:', measurementPopup);
    }

    clearMeasurementLayers();

    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = '';
    }

    // End the measurement session AFTER marking markers for deletion
    endMeasurementSession();

    // Clean up markers that were marked for deletion
    cleanupMarkedMarkers();

    // Reset the guard
    isExitingRef.current = false;
  }, [
    mapRef,
    measurementPopup,
    clearMeasurementLayers,
    markSessionMarkersForDeletion,
    endMeasurementSession,
    cleanupMarkedMarkers,
    getCurrentSessionId,
  ]);

  const calculateDistance = (point1: mapboxgl.LngLat, point2: mapboxgl.LngLat): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const decodePolyline = (encoded: string): [number, number][] => {
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const coordinates: [number, number][] = [];

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push([lng * 1e-5, lat * 1e-5]);
    }

    return coordinates;
  };

  const generateRandomColor = () => {
    const hue = Math.floor(Math.random() * 360); // Random hue (0-359)
    return `hsl(${hue}, 70%, 60%)`; // Use HSL for better control over brightness/saturation
  };

  const displayRouteOnMap = useCallback(
    (
      polygonData: GeoJSON.GeoJSON,
      savedMeasurement?: {
        id: string;
        name: string;
        description: string;
        distance: number;
        duration: number;
      }
    ) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }

      const routeColor = generateRandomColor();

      if (map.getSource('measure-route')) {
        map.removeLayer('measure-route-line');
        map.removeSource('measure-route');
      }

      try {
        map.addSource('measure-route', {
          type: 'geojson',
          data: polygonData,
        });

        const layerId = 'measure-route-line';

        map.addLayer({
          id: layerId,
          type: 'line',
          source: 'measure-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': routeColor,
            'line-width': 4,
          },
        });

        const debugMapClick = (e: mapboxgl.MapMouseEvent) => {
          console.log('🗺️ General map click:', e.lngLat);
          const features = map.queryRenderedFeatures(e.point);
          console.log(
            'Features at click point:',
            features.map(f => f.layer?.id || 'unknown')
          );

          const measureRouteFeature = features.find(f =>
            f.layer?.id?.startsWith('measure-route-line')
          );

          if (measureRouteFeature) {
            if (savedMeasurement) {
              const popup = new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: false,
                className: 'measure-popup',
              })
                .setLngLat(e.lngLat)
                .setHTML(
                  `
                  <div class="p-3 bg-white rounded-lg shadow-md">
                    <div class="text-sm">
                      <strong>${t('measurement-name')}:</strong> ${savedMeasurement.name}
                      <br />
                      <strong>${t('description')}:</strong> ${savedMeasurement.description || '-'}
                      <br />
                      <strong>${t('distance')}:</strong> ${savedMeasurement.distance.toFixed(2)} km
                      <br />
                      <strong>${t('drive-time')}:</strong> ${savedMeasurement.duration.toFixed(0)} min
                    </div>
                    <div class="mt-3 flex justify-end gap-2">
                      <button
                        class="delete-measurement-hook px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                      >
                        ${t('delete')}
                      </button>
                       <button
                        class="edit-measurement-hook px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                      >
                        ${t('edit')}
                      </button>
                    </div>
                  </div>
                `
                )
                .addTo(map);

              const popupElement = popup.getElement();
              if (!popupElement) return;
              const editButton = popupElement.querySelector('.edit-measurement-hook');
              if (editButton) {
                editButton.addEventListener('click', () => {
                  popup.remove();
                  openModal(
                    React.createElement(MeasurementForm, {
                      onSubmit: () => {
                        closeModal();
                      },
                      onCancel: closeModal,
                      initialName: savedMeasurement.name,
                      initialDescription: savedMeasurement.description,
                    }),
                    { isSmaller: true, hasAutoSize: true }
                  );
                });
              }

              const deleteButton = popupElement.querySelector('.delete-measurement-hook');
              if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                  popup.remove();
                  closeModal();
                  exitMeasureMode();
                  deleteMeasurement(savedMeasurement.id);
                });
              }

              setMeasurementPopup(popup);
            }
          }
        };
        map.on('click', debugMapClick);

        map.on('click', layerId, e => {
          console.log('🎯 ROUTE LINE CLICKED!', { layerId, savedMeasurement, event: e });
          if (savedMeasurement) {
            const popup = new mapboxgl.Popup({
              closeButton: true,
              closeOnClick: false,
              className: 'measure-popup',
            })
              .setLngLat(e.lngLat)
              .setHTML(
                `
                <div class="p-3 bg-white rounded-lg shadow-md">
                  <div class="text-sm">
                    <strong>${t('measurement-name')}:</strong> ${savedMeasurement.name}
                    <br />
                    <strong>${t('description')}:</strong> ${savedMeasurement.description || '-'}
                    <br />
                    <strong>${t('distance')}:</strong> ${savedMeasurement.distance.toFixed(2)} km
                    <br />
                    <strong>${t('drive-time')}:</strong> ${savedMeasurement.duration.toFixed(0)} min
                  </div>
                  <div class="mt-3 flex justify-end gap-2">
                    <button
                      class="delete-measurement-hook px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                    >
                      ${t('delete')}
                    </button>
                    <button
                      class="edit-measurement-hook px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                    >
                    ${t('edit')}
                    </button>
                  </div>
                </div>
              `
              )
              .addTo(map);

            const popupElement = popup.getElement();
            if (!popupElement) return;
            const editButton = popupElement.querySelector('.edit-measurement-hook');
            if (editButton) {
              editButton.addEventListener('click', () => {
                popup.remove();
                openModal(
                  React.createElement(MeasurementForm, {
                    onSubmit: () => {
                      // Here you would update the measurement in your catalog
                      // For now, we'll just close the modal
                      closeModal();
                    },
                    onCancel: closeModal,
                    initialName: savedMeasurement.name,
                    initialDescription: savedMeasurement.description,
                  }),
                  { isSmaller: true, hasAutoSize: true }
                );
              });
            }

            const deleteButton = popupElement.querySelector('.delete-measurement-hook');
            if (deleteButton) {
              deleteButton.addEventListener('click', () => {
                popup.remove();
                closeModal();
                exitMeasureMode();
                deleteMeasurement(savedMeasurement.id);
              });
            }

            setMeasurementPopup(popup);
          }
        });

        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      } catch (error) {
        console.error('Error displaying route:', error);
      }
    },
    [mapRef, openModal, closeModal]
  );

  const showLoadingIndicator = useCallback(
    (point1: mapboxgl.LngLat, point2: mapboxgl.LngLat) => {
      if (!mapRef.current) return null;

      const midpoint = new mapboxgl.LngLat(
        (point1.lng + point2.lng) / 2,
        (point1.lat + point2.lat) / 2
      );

      if (measurementPopup) {
        measurementPopup.remove();
        setMeasurementPopup(null);
      }

      const existingLoadingPopups = document.querySelectorAll('.loading-popup');
      existingLoadingPopups.forEach(popup => {
        const popupInstance = (popup as PopupElement)._mapboxgl_popup;
        if (popupInstance && popupInstance.remove) {
          popupInstance.remove();
        } else {
          popup.remove();
        }
      });

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'measure-popup loading-popup',
      })
        .setLngLat(midpoint)
        .setHTML(
          `
        <div class="p-2 flex items-center bg-white rounded-lg shadow-sm">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 me-2"></div>
          <span>${t('calculating-route')}</span>
        </div>
      `
        )
        .addTo(mapRef.current);

      setMeasurementPopup(popup);
      return popup;
    },
    [mapRef, measurementPopup]
  );

  const openDestinationMarkerForm = useCallback(
    (
      point1: mapboxgl.LngLat,
      point2: mapboxgl.LngLat,
      apiResult: MeasurementApiResponse
    ) => {
      const route = apiResult.data?.route?.[0];
      const distanceInKm =
        route?.distance != null
          ? route.distance / 1000
          : calculateDistance(point1, point2) / 1000;
      const durationStr = route?.duration ? String(route.duration).replace(/s$/, '') : '0';
      const durationInMin = parseFloat(durationStr) / 60;

      const handleCancel = () => {
        // Clean up: remove draft markers and exit measure mode
        setMarkers(prevMarkers =>
          prevMarkers.filter(marker => marker.markerType !== 'measurement-draft')
        );
        closeModal();
        setIsMeasuring(false);
        setMeasureSourcePoint(null);
        setMeasureDestinationPoint(null);
        setMeasurementResult(null);
        clearMeasurementLayers();
        endMeasurementSession();
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = '';
        }
      };

      const handleSubmit = (name: string, description: string) => {
        if (!name) return;

        // 1. Save the measurement
        const measurementId = uuidv4();
        const polyline = route?.polyline || apiResult.data?.drive_polygon;
        const savedMeasurementId = addMeasurement(
          `${name} - Measurement`,
          description,
          [point1.lng, point1.lat],
          [point2.lng, point2.lat],
          polyline,
          distanceInKm,
          durationInMin,
          measurementId
        );

        // 2. Convert draft markers to saved measurement markers
        setMarkers(prevMarkers =>
          prevMarkers.map(marker => {
            if (marker.markerType === 'measurement-draft') {
              return {
                ...marker,
                markerType: 'measurement-saved' as MarkerType,
                measurementId: savedMeasurementId,
                name:
                  marker.name === 'Measurement Start'
                    ? `${name} - Start`
                    : `${name} - End`,
              };
            }
            return marker;
          })
        );

        // 3. Display the route
        if (polyline) {
          try {
            let routeData;
            if (typeof polyline === 'string') {
              try {
                routeData = JSON.parse(polyline);
              } catch {
                const coordinates = decodePolyline(polyline);
                routeData = {
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'LineString', coordinates },
                };
              }
            } else {
              routeData = polyline;
            }
            displayRouteOnMap(routeData, {
              id: savedMeasurementId,
              name,
              description,
              distance: distanceInKm,
              duration: durationInMin,
            });
          } catch (err) {
            console.error('Error displaying saved route:', err);
          }
        }

        toast.success(t('measurement-saved-successfully'));
        closeModal();

        setIsMeasuring(false);
        setMeasureSourcePoint(null);
        setMeasureDestinationPoint(null);
        setMeasurementResult(null);
        clearMeasurementLayers();
        endMeasurementSession();

        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = '';
        }
      };

      const formContent = React.createElement(SaveMarkerForm, {
        onSubmit: handleSubmit,
        onCancel: handleCancel,
      });

      openModal(formContent, { isSmaller: true, hasAutoSize: true });
    },
    [
      openModal,
      closeModal,
      addMarker,
      addMeasurement,
      setMarkers,
      displayRouteOnMap,
      decodePolyline,
      clearMeasurementLayers,
      endMeasurementSession,
      mapRef,
      calculateDistance,
      setIsMeasuring,
      setMeasureSourcePoint,
      setMeasureDestinationPoint,
      setMeasurementResult,
      toast,
    ]
  );

  const createMeasurementResultPopup = useCallback(
    (
      map: mapboxgl.Map,
      midpoint: mapboxgl.LngLat,
      bodyHtml: string,
      sourcePoint: mapboxgl.LngLat,
      destPoint: mapboxgl.LngLat,
      apiData: MeasurementApiResponse
    ) => {
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'measure-popup distance-popup',
        maxWidth: '260px',
      })
        .setLngLat(midpoint)
        .setHTML(
          `<div style="font-family: system-ui, -apple-system, sans-serif; width: 232px; background: #fff; border-radius: 8px; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px 10px;">
                  <span style="font-size: 11px; font-weight: 600; color: #7D00B8; text-transform: uppercase; letter-spacing: 0.6px;">${t('measurement-result')}</span>
                  <button class="measure-close-hook" style="background: none; border: none; cursor: pointer; color: #9ca3af; padding: 0; line-height: 1; display: flex;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                ${bodyHtml}

                <div style="border-top: 1px solid #f1f5f9; padding: 10px 14px; display: flex; gap: 8px;">
                  <button
                    class="measure-discard-hook"
                    style="flex: 1; padding: 7px 0; background: #f3f4f6; color: #374151; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;"
                    onmouseover="this.style.background='#e5e7eb'"
                    onmouseout="this.style.background='#f3f4f6'"
                  >${t('discard')}</button>
                  <button
                    class="measure-save-hook"
                    style="flex: 2; padding: 7px 0; background: linear-gradient(162deg, #7D00B8 31%, #19802A 87%); color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;"
                    onmouseover="this.style.filter='brightness(1.1)'"
                    onmouseout="this.style.filter='none'"
                  >${t('save-points')}</button>
                </div>
              </div>`
        )
        .addTo(map);

      setMeasurementPopup(popup);

      const popupEl = popup.getElement();
      if (popupEl) {
        const cleanupAndReset = () => {
          popup.remove();
          setMeasurementPopup(null);
          setMarkers(prevMarkers =>
            prevMarkers.filter(marker => marker.markerType !== 'measurement-draft')
          );
          setIsMeasuring(false);
          setMeasureSourcePoint(null);
          setMeasureDestinationPoint(null);
          setMeasurementResult(null);
          clearMeasurementLayers();
          endMeasurementSession();
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = '';
          }
        };

        const saveBtn = popupEl.querySelector('.measure-save-hook');
        if (saveBtn) {
          saveBtn.addEventListener('click', () => {
            popup.remove();
            setMeasurementPopup(null);
            openDestinationMarkerForm(sourcePoint, destPoint, apiData);
          });
        }

        const discardBtn = popupEl.querySelector('.measure-discard-hook');
        if (discardBtn) {
          discardBtn.addEventListener('click', cleanupAndReset);
        }

        const closeBtn = popupEl.querySelector('.measure-close-hook');
        if (closeBtn) {
          closeBtn.addEventListener('click', cleanupAndReset);
        }
      }

      return popup;
    },
    [
      setMeasurementPopup,
      setMarkers,
      setIsMeasuring,
      setMeasureSourcePoint,
      setMeasureDestinationPoint,
      setMeasurementResult,
      clearMeasurementLayers,
      endMeasurementSession,
      mapRef,
      openDestinationMarkerForm,
    ]
  );

  const handleMapClickForMeasurement = useCallback(
    async (e: mapboxgl.MapMouseEvent) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }
      if (!isMeasuring) {
        return;
      }

      if (!measureSourcePoint) {
        console.log('Setting source point:', e.lngLat);
        setMeasureSourcePoint(e.lngLat);
        // Add source marker with isTemporary flag
        const sourceMarker = {
          id: uuidv4(),
          name: 'Measurement Start',
          description: '',
          coordinates: [e.lngLat.lng, e.lngLat.lat] as [number, number],
          timestamp: Date.now(),
          isTemporary: true,
        };
        console.log('Adding source marker:', sourceMarker);
        addMarker(
          sourceMarker.name,
          sourceMarker.description,
          sourceMarker.coordinates,
          '#254d70',
          'measurement-draft',
          getCurrentSessionId() || undefined
        );
      } else if (!measureDestinationPoint) {
        console.log('Setting destination point:', e.lngLat);
        setMeasureDestinationPoint(e.lngLat);
        // Add destination marker with isTemporary flag
        const destMarker = {
          id: uuidv4(),
          name: 'Measurement End',
          description: '',
          coordinates: [e.lngLat.lng, e.lngLat.lat] as [number, number],
          timestamp: Date.now(),
          isTemporary: true,
        };
        console.log('Adding destination marker:', destMarker);
        addMarker(
          destMarker.name,
          destMarker.description,
          destMarker.coordinates,
          '#075b5e',
          'measurement-draft',
          getCurrentSessionId() || undefined
        );

        const lineColor = generateRandomColor();

        const lineFeature: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [measureSourcePoint.lng, measureSourcePoint.lat],
              [e.lngLat.lng, e.lngLat.lat],
            ],
          },
        };

        if (map.getSource('preview-line')) {
          map.removeLayer('preview-line-layer');
          map.removeSource('preview-line');
        }

        if (map.getSource('measure-line')) {
          (map.getSource('measure-line') as mapboxgl.GeoJSONSource).setData(lineFeature);
          map.setPaintProperty('measure-line-layer', 'line-color', lineColor);
        } else {
          map.addSource('measure-line', {
            type: 'geojson',
            data: lineFeature,
          });

          map.addLayer({
            id: 'measure-line-layer',
            type: 'line',
            source: 'measure-line',
            paint: {
              'line-color': lineColor,
              'line-width': 2,
              'line-dasharray': [2, 1],
            },
          });
        }

        setMeasureLine(lineFeature);

        const body = {
          origin_lat: measureSourcePoint.lat,
          origin_lng: measureSourcePoint.lng,
          dest_lat: e.lngLat.lat,
          dest_lng: e.lngLat.lng,
        };

        if (measureSourcePoint.lat === e.lngLat.lat && measureSourcePoint.lng === e.lngLat.lng) {
          toast.warning(t('measurement-api-call-source-and-destination-points-are-identical'), {
            description: t('please-select-different-points'),
          });
          console.warn('Measurement API Call: Source and Destination points are identical.', body);
        }

        const loadingPopup = showLoadingIndicator(measureSourcePoint, e.lngLat);

        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = ''; // Reset cursor as user input is done
        }

        // Capture source point now since state may change asynchronously
        const capturedSourcePoint = measureSourcePoint;
        const capturedDestPoint = e.lngLat;

        try {
          const res = await apiRequest({
            url: urls.drive_distance,
            method: 'post',
            body,
          });
          const rootData = (res as Record<string, unknown>)?.data as
            Record<string, unknown> | undefined;
          const apiResponse = (rootData?.data ?? rootData) as {
            distance_km?: number;
            duration_seconds?: number;
          };

          if (loadingPopup) {
            loadingPopup.remove();
          }

          document.querySelectorAll('.loading-popup').forEach(el => el.remove());

          if (measurementPopup) {
            measurementPopup.remove();
            setMeasurementPopup(null);
          }

          // New endpoint returns: { distance_km: number, duration_seconds: number }
          const distanceInKm = apiResponse.distance_km ?? null;
          const durationSeconds = apiResponse.duration_seconds ?? null;
          const durationInMin = durationSeconds != null ? durationSeconds / 60 : null;
          const polyline = null; // New endpoint does not return a polyline

          // Normalize the response structure for backward compatibility
          const normalizedApiData: MeasurementApiResponse = {
            data: {
              route: distanceInKm != null && durationSeconds != null
                ? [{
                    distance: distanceInKm * 1000,
                    duration: `${durationSeconds}s`,
                    polyline: undefined,
                  }]
                : undefined,
              distance_in_km: distanceInKm,
              drive_time_in_min: durationInMin,
              drive_polygon: undefined,
            },
          };

          const measurementData: MeasurementResult = {
            message: '',
            polygon: null,
            distance: distanceInKm,
            duration: durationInMin,
          };

          setMeasurementResult(measurementData);

          // Calculate midpoint for popup positioning
          const midpoint = new mapboxgl.LngLat(
            (capturedSourcePoint.lng + capturedDestPoint.lng) / 2,
            (capturedSourcePoint.lat + capturedDestPoint.lat) / 2
          );

          const distanceLabel =
            distanceInKm != null
              ? `${distanceInKm.toFixed(2)} km`
              : `${(calculateDistance(capturedSourcePoint, capturedDestPoint) / 1000).toFixed(2)} km (straight line)`;
          const durationLabel =
            durationInMin != null ? `${durationInMin.toFixed(0)} min` : t('unknown');

          // Show result popup with a "Save Points" button — form only opens on demand
          const successBodyHtml = `
                <div style="border-top: 1px solid #f1f5f9; display: flex;">
                  <div style="flex: 1; padding: 12px 14px; border-right: 1px solid #f1f5f9;">
                    <div style="font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1;">${distanceLabel}</div>
                    <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">${t('distance')}</div>
                  </div>
                  <div style="flex: 1; padding: 12px 14px;">
                    <div style="font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1;">${durationLabel}</div>
                    <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">${t('drive-time')}</div>
                  </div>
                </div>`;
          createMeasurementResultPopup(map, midpoint, successBodyHtml, capturedSourcePoint, capturedDestPoint, normalizedApiData);

          if (polyline) {
            try {
              if (typeof polyline === 'string') {
                try {
                  const routeData = JSON.parse(polyline);
                  displayRouteOnMap(routeData);
                } catch (parseError) {
                  console.error('Error parsing route data:', parseError);

                  try {
                    const coordinates = decodePolyline(polyline);
                    const lineStringFeature = {
                      type: 'Feature',
                      properties: {},
                      geometry: {
                        type: 'LineString',
                        coordinates: coordinates,
                      },
                    };
                    displayRouteOnMap(lineStringFeature);
                  } catch (polylineError) {
                    console.error('Error processing polyline:', polylineError);
                  }
                }
              } else {
                displayRouteOnMap(polyline);
              }
            } catch (error) {
              console.error('Error processing route data:', error);
            }
          } else {
            console.log('No route data found in response');
          }
        } catch (error) {
          console.error('Error fetching distance data:', error);

          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = ''; // Reset cursor on error too
          }

          if (loadingPopup) {
            loadingPopup.remove();
          }

          document.querySelectorAll('.loading-popup').forEach(el => el.remove());

          if (measurementPopup) {
            measurementPopup.remove();
            setMeasurementPopup(null);
          }

          // Build a fallback normalizedApiData with straight-line distance
          const fallbackDistance = calculateDistance(capturedSourcePoint, capturedDestPoint);
          const fallbackDistanceKm = fallbackDistance / 1000;
          const fallbackApiData: MeasurementApiResponse = {
            data: {
              distance_in_km: fallbackDistanceKm,
              drive_time_in_min: 0,
              drive_polygon: null,
            },
          };

          // Show fallback popup with save button (same pattern as success case)
          const fallbackMidpoint = new mapboxgl.LngLat(
            (capturedSourcePoint.lng + capturedDestPoint.lng) / 2,
            (capturedSourcePoint.lat + capturedDestPoint.lat) / 2
          );

          const fallbackBodyHtml = `
                <div style="border-top: 1px solid #f1f5f9; padding: 12px 14px;">
                  <div style="font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1;">${fallbackDistanceKm.toFixed(2)} km</div>
                  <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">${t('distance')} · ${t('straight-line')}</div>
                  <div style="margin-top: 10px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px;">
                    ${t('route-api-unavailable')}
                  </div>
                </div>`;
          createMeasurementResultPopup(map, fallbackMidpoint, fallbackBodyHtml, capturedSourcePoint, capturedDestPoint, fallbackApiData);
        }
      }
    },
    [
      mapRef,
      isMeasuring,
      measureSourcePoint,
      measureDestinationPoint,
      measurementPopup,
      showLoadingIndicator,
      openDestinationMarkerForm,
      displayRouteOnMap,
      decodePolyline,
      calculateDistance,
      generateRandomColor,
      addMarker,
      getCurrentSessionId,
      setMarkers,
      clearMeasurementLayers,
      endMeasurementSession,
    ]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      !shouldInitializeFeatures ||
      !isMeasuring ||
      !measureSourcePoint ||
      measureDestinationPoint
    ) {
      return;
    }

    const previewColor = generateRandomColor();

    if (!map.getSource('preview-line')) {
      map.addSource('preview-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [measureSourcePoint.lng, measureSourcePoint.lat],
              [measureSourcePoint.lng, measureSourcePoint.lat],
            ],
          },
        },
      });

      map.addLayer({
        id: 'preview-line-layer',
        type: 'line',
        source: 'preview-line',
        paint: {
          'line-color': previewColor,
          'line-width': 2,
          'line-dasharray': [1, 2],
        },
      });
    }

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!measureSourcePoint || measureDestinationPoint) return;

      const lineFeature: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [measureSourcePoint.lng, measureSourcePoint.lat],
            [e.lngLat.lng, e.lngLat.lat],
          ],
        },
      };

      (map.getSource('preview-line') as mapboxgl.GeoJSONSource).setData(lineFeature);
      setPreviewLine(lineFeature);
    };

    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('mousemove', handleMouseMove);
    };
  }, [
    mapRef,
    shouldInitializeFeatures,
    isMeasuring,
    measureSourcePoint,
    measureDestinationPoint,
    generateRandomColor,
  ]);

  return {
    isMeasuring,
    measureSourcePoint,
    measureDestinationPoint,
    measurementResult,
    measureLine,
    previewLine,
    measurementPopup,
    initializeMeasureMode,
    exitMeasureMode,
    handleMapClickForMeasurement,
    clearMeasurementLayers,
    displayRouteOnMap,
    decodePolyline,
    setIsMeasuring,
    setMeasureSourcePoint,
    setMeasureDestinationPoint,
    setMeasurementResult,
  };
};