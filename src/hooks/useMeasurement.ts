import { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import apiRequest from '../services/apiRequest';
import urls from '../urls.json';
import { useMapContext } from '../context/MapContext';
import { toast } from 'sonner';
import { useCatalogContext } from '../context/CatalogContext';
import { useUIContext } from '../context/UIContext';
import { MeasurementForm } from '../components/MeasurementForm/MeasurementForm';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MarkerType } from '../types';

export interface MeasurementState {
  isMeasuring: boolean;
  measureSourcePoint: mapboxgl.LngLat | null;
  measureDestinationPoint: mapboxgl.LngLat | null;
  measurementResult: any | null;
  measureLine: any | null;
  previewLine: any | null;
  measurementPopup: mapboxgl.Popup | null;
}

export interface MeasurementActions {
  initializeMeasureMode: (sourcePointId?: string) => void;
  exitMeasureMode: () => void;
  handleMapClickForMeasurement: (e: mapboxgl.MapMouseEvent) => Promise<void>;
  clearMeasurementLayers: () => void;
  displayRouteOnMap: (
    polygonData: any,
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
  setMeasurementResult: (result: any | null) => void;
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
  const [measurementResult, setMeasurementResult] = useState<any | null>(null);
  const [measureLine, setMeasureLine] = useState<any | null>(null);
  const [previewLine, setPreviewLine] = useState<any | null>(null);
  const [measurementPopup, setMeasurementPopup] = useState<mapboxgl.Popup | null>(null);

  const isExitingRef = useRef<boolean>(false);

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

    setMeasureLine(null);
    setPreviewLine(null);
  }, [mapRef]);

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
        const popupInstance = (popup as any)._mapboxgl_popup;
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
      polygonData: any,
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

        const debugMapClick = (e: any) => {
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
                      <strong>Name:</strong> ${savedMeasurement.name}
                      <br />
                      <strong>Description:</strong> ${savedMeasurement.description || '-'}
                      <br />
                      <strong>Distance:</strong> ${savedMeasurement.distance.toFixed(2)} km
                      <br />
                      <strong>Drive Time:</strong> ${savedMeasurement.duration.toFixed(0)} min
                    </div>
                    <div class="mt-3 flex justify-end space-x-2">
                      <button
                        class="delete-measurement-hook px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                      >
                        Delete
                      </button>
                       <button
                        class="edit-measurement-hook px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                      >
                        Edit
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
                      onSubmit: (name, description) => {
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
                    <strong>Name:</strong> ${savedMeasurement.name}
                    <br />
                    <strong>Description:</strong> ${savedMeasurement.description || '-'}
                    <br />
                    <strong>Distance:</strong> ${savedMeasurement.distance.toFixed(2)} km
                    <br />
                    <strong>Drive Time:</strong> ${savedMeasurement.duration.toFixed(0)} min
                  </div>
                  <div class="mt-3 flex justify-end space-x-2">
                    <button
                      class="delete-measurement-hook px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                    >
                      Delete
                    </button>
                    <button
                      class="edit-measurement-hook px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                    >
                      Edit
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
                    onSubmit: (name, description) => {
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
        const popupInstance = (popup as any)._mapboxgl_popup;
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
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
          <span>Calculating route...</span>
        </div>
      `
        )
        .addTo(mapRef.current);

      setMeasurementPopup(popup);
      return popup;
    },
    [mapRef, measurementPopup]
  );

  const handleSaveMeasurement = useCallback(
    (point1: mapboxgl.LngLat, point2: mapboxgl.LngLat, apiResult: any) => {
      const handleSubmit = (name: string, description: string) => {
        // Generate measurement ID
        const measurementId = uuidv4();

        // Save the measurement with the generated ID
        const savedMeasurementId = addMeasurement(
          name,
          description,
          [point1.lng, point1.lat],
          [point2.lng, point2.lat],
          apiResult.data?.drive_polygon,
          apiResult.data?.distance_in_km,
          apiResult.data?.drive_time_in_min,
          measurementId
        );

        // Update existing draft markers to be saved markers linked to this measurement
        setMarkers(prevMarkers => {
          console.log(
            'Converting draft markers to saved. Before:',
            prevMarkers.filter(m => m.markerType === 'measurement-draft')
          );

          const updatedMarkers = prevMarkers.map(marker => {
            if (marker.markerType === 'measurement-draft') {
              const savedMarker = {
                id: marker.id,
                coordinates: marker.coordinates,
                timestamp: marker.timestamp,
                colorHEX: marker.colorHEX,
                description: marker.description,
                markerType: 'measurement-saved' as MarkerType,
                measurementId: savedMeasurementId, // Only the measurement record ID
                name:
                  marker.name === 'Measurement Source'
                    ? `${name} - Start`
                    : marker.name === 'Measurement End'
                      ? `${name} - End`
                      : marker.name,
              };

              console.log('Converted marker:', {
                from: marker,
                to: savedMarker,
              });

              return savedMarker;
            }
            return marker;
          });

          console.log(
            'After conversion:',
            updatedMarkers.filter(m => m.markerType === 'measurement-saved')
          );

          return updatedMarkers;
        });

        if (apiResult.data?.drive_polygon) {
          try {
            let routeData;
            if (typeof apiResult.data.drive_polygon === 'string') {
              try {
                routeData = JSON.parse(apiResult.data.drive_polygon);
              } catch (parseError) {
                const coordinates = decodePolyline(apiResult.data.drive_polygon);
                routeData = {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: coordinates,
                  },
                };
              }
            } else {
              routeData = apiResult.data.drive_polygon;
            }

            displayRouteOnMap(routeData, {
              id: savedMeasurementId,
              name,
              description,
              distance: apiResult.data.distance_in_km,
              duration: apiResult.data.drive_time_in_min,
            });
          } catch (error) {
            console.error('Error displaying saved route:', error);
          }
        }

        toast.success('Measurement saved successfully');
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

      openModal(
        React.createElement(MeasurementForm, {
          onSubmit: handleSubmit,
          onCancel: () => {
            closeModal();
            //delete the measurement draft markers
            setMarkers(prevMarkers =>
              prevMarkers.filter(marker => marker.markerType !== 'measurement-draft')
            );
            exitMeasureMode();
          },
        }),
        { isSmaller: true, hasAutoSize: true }
      );
    },
    [
      openModal,
      closeModal,
      addMeasurement,
      displayRouteOnMap,
      decodePolyline,
      setMarkers,
      clearMeasurementLayers,
      endMeasurementSession,
      mapRef,
    ]
  );

  const showRouteResult = useCallback(
    (point1: mapboxgl.LngLat, point2: mapboxgl.LngLat, apiResult: any) => {
      if (!mapRef.current) return null;

      const midpoint = new mapboxgl.LngLat(
        (point1.lng + point2.lng) / 2,
        (point1.lat + point2.lat) / 2
      );

      if (measurementPopup) {
        measurementPopup.remove();
      }

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        className: 'measure-popup',
      })
        .setLngLat(midpoint)
        .setHTML(
          `
          <div class="p-3 bg-white rounded-lg shadow-md">
            <div class="text-sm">
              <strong>Distance:</strong> ${apiResult.data?.distance_in_km.toFixed(2)} km
              <br />
              <strong>Drive Time:</strong> ${apiResult.data?.drive_time_in_min.toFixed(0)} min
            </div>
            <div class="mt-3 flex justify-end space-x-2">
              <button
                class="exit-measure-mode-hook px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                class="save-measurement-hook px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
              >
                Save
              </button>
            </div>
          </div>
        `
        )
        .addTo(mapRef.current);

      const popupElement = popup.getElement();
      if (!popupElement) return;

      const cancelButton = popupElement.querySelector('.exit-measure-mode-hook');
      if (cancelButton) {
        cancelButton.addEventListener('click', () => {
          popup.remove();
          setMeasurementPopup(null);
          exitMeasureMode();
        });
      }

      const closeHandler = () => {
        exitMeasureMode();
      };

      // Add event listener for save button
      const saveButton = popupElement.querySelector('.save-measurement-hook');
      if (saveButton) {
        saveButton.addEventListener('click', () => {
          console.log('Save button clicked - preventing exitMeasureMode on popup close');
          popup.off('close', closeHandler);
          popup.remove();
          setMeasurementPopup(null);
          handleSaveMeasurement(point1, point2, apiResult);
        });
      }

      popup.on('close', closeHandler);

      setMeasurementPopup(popup);

      setIsMeasuring(false);

      return popup;
    },
    [mapRef, measurementPopup, exitMeasureMode, handleSaveMeasurement]
  );

  const showMeasurementResult = useCallback(
    (point1: mapboxgl.LngLat, point2: mapboxgl.LngLat, distance: number, errorMessage?: string) => {
      if (!mapRef.current) return null;

      const midpoint = new mapboxgl.LngLat(
        (point1.lng + point2.lng) / 2,
        (point1.lat + point2.lat) / 2
      );

      let formattedDistance: string;
      if (distance >= 1000) {
        formattedDistance = `${(distance / 1000).toFixed(2)} km`;
      } else {
        formattedDistance = `${Math.round(distance)} m`;
      }

      if (measurementPopup) {
        measurementPopup.remove();
      }

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        className: 'measure-popup',
      })
        .setLngLat(midpoint)
        .setHTML(
          `
          <div class="p-3 bg-white rounded-lg shadow-md">
            <div class="text-sm">
              <strong>Distance:</strong> ${formattedDistance}
              ${errorMessage ? `<div class="text-red-500 text-xs mt-1">${errorMessage}</div>` : ''}
            </div>
            <div class="mt-3 flex justify-end">
              <button
                class="exit-measure-mode-hook px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
              >
                Done
              </button>
            </div>
          </div>
        `
        )
        .addTo(mapRef.current);

      const popupElement = popup.getElement();
      if (!popupElement) return;

      const exitButton = popupElement.querySelector('.exit-measure-mode-hook');
      if (exitButton) {
        exitButton.addEventListener('click', () => {
          popup.remove();
          setMeasurementPopup(null);
          exitMeasureMode();
          cleanupMarkedMarkers();
        });
      }

      popup.on('close', () => {
        exitMeasureMode();
      });

      setMeasurementPopup(popup);

      setIsMeasuring(false);

      return popup;
    },
    [mapRef, measurementPopup, exitMeasureMode]
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

        const lineFeature = {
          type: 'Feature',
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
          (map.getSource('measure-line') as mapboxgl.GeoJSONSource).setData(lineFeature as any);
          map.setPaintProperty('measure-line-layer', 'line-color', lineColor);
        } else {
          map.addSource('measure-line', {
            type: 'geojson',
            data: lineFeature as any,
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
          source: { lat: measureSourcePoint.lat, lng: measureSourcePoint.lng },
          destination: { lat: e.lngLat.lat, lng: e.lngLat.lng },
        };

        if (measureSourcePoint.lat === e.lngLat.lat && measureSourcePoint.lng === e.lngLat.lng) {
          toast.warning('Measurement API Call: Source and Destination points are identical.', {
            description: 'Please select different points.',
          });
          console.warn('Measurement API Call: Source and Destination points are identical.', body);
        }

        const loadingPopup = showLoadingIndicator(measureSourcePoint, e.lngLat);

        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = ''; // Reset cursor as user input is done
        }

        try {
          const res = await apiRequest({
            url: urls.drive_time_polyline,
            method: 'post',
            isAuthRequest: true,
            body: body,
          });

          const apiData = res.data;

          if (loadingPopup) {
            loadingPopup.remove();
          }

          document.querySelectorAll('.loading-popup').forEach(el => el.remove());

          if (measurementPopup) {
            measurementPopup.remove();
            setMeasurementPopup(null);
          }

          const measurementData = {
            message: apiData.message,
            polygon: apiData.data?.drive_polygon,
            distance: apiData.data?.distance_in_km,
            duration: apiData.data?.drive_time_in_min,
            request_id: apiData.request_id,
          };

          setMeasurementResult(measurementData);

          showRouteResult(measureSourcePoint, e.lngLat, apiData);

          if (apiData.data?.drive_polygon) {
            try {
              if (typeof apiData.data.drive_polygon === 'string') {
                try {
                  const routeData = JSON.parse(apiData.data.drive_polygon);
                  displayRouteOnMap(routeData);
                } catch (parseError) {
                  console.error('Error parsing route data:', parseError);

                  try {
                    const coordinates = decodePolyline(apiData.data.drive_polygon);
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
                displayRouteOnMap(apiData.data.drive_polygon);
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

          const distance = calculateDistance(measureSourcePoint, e.lngLat);

          showMeasurementResult(
            measureSourcePoint,
            e.lngLat,
            distance,
            'API request failed. Showing straight-line distance.'
          );
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
      showRouteResult,
      showMeasurementResult,
      displayRouteOnMap,
      decodePolyline,
      calculateDistance,
      generateRandomColor,
      addMarker,
      getCurrentSessionId,
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

      const lineFeature = {
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

      (map.getSource('preview-line') as mapboxgl.GeoJSONSource).setData(lineFeature as any);
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


