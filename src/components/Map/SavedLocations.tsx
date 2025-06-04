import React, { useEffect, useState, useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapContext } from '../../context/MapContext';
import { useUIContext } from '../../context/UIContext';
import { useCatalogContext } from '../../context/CatalogContext';
import { useLongPress } from 'use-long-press';
import MapMenu from './MapMenu';
import './mapbox-custom.css';
import { useMeasurement } from '../../hooks/useMeasurement';
import { MeasurementData } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const defaultMarkerColor = '#7D00B8';

const SavedLocations: React.FC = () => {
  const { mapRef, shouldInitializeFeatures } = useMapContext();
  const { openModal, closeModal, isModalOpen } = useUIContext();
  const [tempMarker, setTempMarker] = useState<mapboxgl.Marker | null>(null);
  const {
    markers,
    addMarker,
    deleteMarker,
    setMarkers,
    isMarkersEnabled,
    measurements,
    deleteMeasurement,
  } = useCatalogContext();
  const [lastLngLat, setLastLngLat] = useState<mapboxgl.LngLat | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [menuLngLat, setMenuLngLat] = useState<mapboxgl.LngLat | null>(null);

  const { isMobile } = useUIContext();
  const {
    isMeasuring,
    initializeMeasureMode,
    exitMeasureMode,
    handleMapClickForMeasurement,
    setIsMeasuring,
    setMeasureSourcePoint,
    setMeasureDestinationPoint,
    setMeasurementResult,
    decodePolyline,
  } = useMeasurement();

  const handleMapClickForMeasurementRef = useRef(handleMapClickForMeasurement);
  useEffect(() => {
    handleMapClickForMeasurementRef.current = handleMapClickForMeasurement;
  }, [handleMapClickForMeasurement]);

  const markersRef = useRef<{ [id: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    console.log('markers', markers);
  }, [markers]);

  const handleCloseModal = useCallback(() => {
    if (tempMarker) {
      tempMarker.remove();
      setTempMarker(null);
    }
    closeModal();
  }, [tempMarker, closeModal]);

  useEffect(() => {
    if (!isModalOpen && tempMarker) {
      tempMarker.remove();
      setTempMarker(null);
    }
  }, [isModalOpen, tempMarker]);

  const createMarkerModal = useCallback(
    (
      onSave: (name: string, description: string, color: string) => void,
      initialName?: string,
      initialDescription?: string,
      initialColor?: string
    ) => (
      <div className="p-0 w-44">
        <h2 className="text-xl font-bold mb-2">Marker</h2>

        <form
          onSubmit={event => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const name = formData.get('name') as string;
            const description = formData.get('description') as string;
            const color = formData.get('color') as string;

            if (name) {
              onSave(name, description, color);
              handleCloseModal();
            }
          }}
        >
          <div className="mb-2">
            <label htmlFor="name" className="block mb-2 font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-required="true"
              placeholder="Enter a name"
              defaultValue={initialName}
            />
          </div>

          <div className="mb-2">
            <label htmlFor="color" className="block mb-2 font-medium">
              Color
            </label>
            <input
              id="color"
              name="color"
              type="color"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              defaultValue={initialColor || defaultMarkerColor}
            />
          </div>

          <div className="mb-2">
            <label htmlFor="description" className="block mb-2 font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Enter a description"
              className="w-full p-2 border rounded-md resize-none"
              defaultValue={initialDescription}
            />
          </div>

          <div className="flex justify-between gap-2">
            <button
              type="submit"
              className="w-full px-4 py-2 shadow-sm bg-gem-gradient text-white rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    ),
    [handleCloseModal]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shouldInitializeFeatures) return;

    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    if (!isMarkersEnabled) return;

    const visibleMarkers = markers.filter(marker => marker.markerType !== 'measurement-to-delete');

    visibleMarkers.forEach(markerData => {
      const marker = new mapboxgl.Marker({ color: markerData.colorHEX || undefined })
        .setLngLat(markerData.coordinates)
        .addTo(map);

      const popup = new mapboxgl.Popup({
        offset: 0,
        className: 'marker-popup',
        closeButton: true,
        closeOnClick: false,
      }).setHTML(`
          <div class="marker-popup-content bg-white rounded-lg shadow-lg p-2 max-w-xs">
            <h3 class="font-bold text-lg text-gray-800 mb-2">${markerData.name}</h3>
            <p class="text-gray-600 mb-${markerData.description ? '3' : '0'}">${markerData.description}</p>
            <div class="mt-2 w-full flex justify-end gap-1">
              <button aria-label="Delete Location" class="delete-location text-xs bg-red-500 hover:bg-red-600 transition-colors duration-200 text-white px-2 py-1.5 rounded-md shadow-sm flex items-center justify-center" data-id="${markerData.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button aria-label="Edit Location" class="edit-location text-xs bg-blue-500 hover:bg-blue-600 transition-colors duration-200 text-white px-2 py-1 rounded-md shadow-sm flex items-center justify-center" data-id="${markerData.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
             <button aria-label="Measure from this location" class="measure-location text-xs bg-gem-gradient hover:bg-gem-gradient-hover transition-colors duration-200 text-white px-2 py-1 rounded-md shadow-sm flex items-center justify-center" data-id="${markerData.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 256 256" stroke="currentColor">
                  <rect x="26.2" y="82.7" width="203.6" height="90.51" rx="8" transform="translate(-53 128) rotate(-45)" stroke-linecap="round" stroke-linejoin="round" stroke-width="12"/>
                  <line x1="132" y1="60" x2="164" y2="92" stroke-linecap="round" stroke-linejoin="round" stroke-width="12"/>
                  <line x1="96" y1="96" x2="128" y2="128" stroke-linecap="round" stroke-linejoin="round" stroke-width="12"/>
                  <line x1="60" y1="132" x2="92" y2="164" stroke-linecap="round" stroke-linejoin="round" stroke-width="12"/>
                </svg>
              </button>
            </div>
          </div>
        `);

      popup.on('open', () => {
        setTimeout(() => {
          const popupContent = document.querySelector('.marker-popup-content');
          if (popupContent) {
            popupContent.addEventListener('click', e => {
              e.stopPropagation();
            });
          }
        }, 100);
      });

      marker.setPopup(popup);

      markersRef.current[markerData.id] = marker;
    });

    const setupPopupListeners = () => {
      document.querySelectorAll('.delete-location').forEach(button => {
        if (button instanceof HTMLElement) {
          const id = button.getAttribute('data-id');
          if (id) {
            button.onclick = e => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(id);
            };
          }
        }
      });

      document.querySelectorAll('.edit-location').forEach(button => {
        if (button instanceof HTMLElement) {
          const id = button.getAttribute('data-id');
          if (id) {
            button.onclick = e => {
              e.preventDefault();
              e.stopPropagation();
              handleEdit(id);
            };
          }
        }
      });

      document.querySelectorAll('.measure-location').forEach(button => {
        if (button instanceof HTMLElement) {
          const id = button.getAttribute('data-id');
          if (id) {
            button.onclick = e => {
              e.preventDefault();
              e.stopPropagation();
              handleMeasure(id);
            };
          }
        }
      });

      document.querySelectorAll('.marker-popup-content').forEach(content => {
        content.addEventListener('click', e => {
          e.stopPropagation();
        });
      });
    };

    map.on('click', () => {
      setTimeout(setupPopupListeners, 100);
    });

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
    };
  }, [markers, shouldInitializeFeatures, mapRef, isMarkersEnabled]);

  const handleDelete = useCallback(
    (id: string) => {
      if (!isMarkersEnabled) return;

      const currentMarkers = markersRef.current;
      if (currentMarkers[id]) {
        currentMarkers[id].remove();
        delete currentMarkers[id];
      }

      deleteMarker(id);
    },
    [isMarkersEnabled, deleteMarker]
  );

  const handleEdit = useCallback(
    (id: string) => {
      if (!isMarkersEnabled) return;

      const markerToEdit = markers.find(marker => marker.id === id);
      if (!markerToEdit) return;

      const onSave = (name: string, description: string, color: string) => {
        const updatedMarkers = markers.map(marker => {
          if (marker.id === id) {
            return { ...marker, name, description, colorHEX: color };
          }
          return marker;
        });
        setMarkers(updatedMarkers);
      };

      openModal(
        createMarkerModal(
          onSave,
          markerToEdit.name,
          markerToEdit.description,
          markerToEdit.colorHEX
        ),
        {
          isSmaller: true,
          hasAutoSize: true,
        }
      );
    },
    [isMarkersEnabled, markers, openModal, createMarkerModal, setMarkers]
  );

  const formatCoordinates = useCallback((lngLat: mapboxgl.LngLat | null) => {
    if (!lngLat) return '';
    return `${lngLat.lng.toFixed(6)}, ${lngLat.lat.toFixed(6)}`;
  }, []);

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
    setMenuLngLat(null);
  }, []);

  const createNewMarker = useCallback(
    (lngLat: mapboxgl.LngLat) => {
      if (!isMarkersEnabled || !mapRef.current) return;

      if (tempMarker) {
        tempMarker.remove();
      }

      const newTempMarker = new mapboxgl.Marker({ scale: 0.9, color: '#7D00B8' })
        .setLngLat(lngLat)
        .addTo(mapRef.current);

      setTempMarker(newTempMarker);

      const onSave = (name: string, description: string, color: string) => {
        console.log('markers onSave', name, description, [lngLat.lng, lngLat.lat]);
        addMarker(name, description, [lngLat.lng, lngLat.lat], color, 'measurement-draft');
        if (newTempMarker) {
          newTempMarker.remove();
          setTempMarker(null);
        }
      };

      openModal(createMarkerModal(onSave), { isSmaller: true, hasAutoSize: true });
    },
    [isMarkersEnabled, mapRef, tempMarker, addMarker, openModal, createMarkerModal]
  );

  const startMeasureDistance = useCallback(
    (idOrLngLat: string | mapboxgl.LngLat) => {
      console.log('startMeasureDistance called with:', idOrLngLat);
      closeMenu();
      if (typeof idOrLngLat === 'string') {
        console.log('Starting measurement from marker ID:', idOrLngLat);
        initializeMeasureMode(idOrLngLat);
      } else {
        console.log('Starting measurement from map click:', idOrLngLat);
        initializeMeasureMode();

        // Set it as source point and add the marker
        setMeasureSourcePoint(idOrLngLat);
        setMeasureDestinationPoint(null);
        setMeasurementResult(null);

        if (mapRef.current) {
          console.log('Adding source marker for map click measurement');
          const srcMarker = {
            id: uuidv4(),
            name: 'Measurement Source',
            description: '',
            coordinates: [idOrLngLat.lng, idOrLngLat.lat] as [number, number],
            timestamp: Date.now(),
            isTemporary: true,
            colorHEX: '#FF3f33',
          };
          addMarker(
            srcMarker.name,
            srcMarker.description,
            srcMarker.coordinates,
            srcMarker.colorHEX,
            'measurement-draft'
          );

          mapRef.current.getCanvas().style.cursor = 'crosshair';
        }
      }
    },
    [
      closeMenu,
      initializeMeasureMode,
      mapRef,
      setIsMeasuring,
      setMeasureSourcePoint,
      setMeasureDestinationPoint,
      setMeasurementResult,
      addMarker,
    ]
  );

  const longPressHandler = useLongPress(
    event => {
      if (!isMarkersEnabled || !lastLngLat) return;

      if (isMeasuring) {
        exitMeasureMode();
      }

      if (event.target) {
        const touch = (event as unknown as TouchEvent).touches[0];
        setMenuPosition({ x: touch.clientX, y: touch.clientY });
        setMenuLngLat(lastLngLat);
      }
    },
    {
      threshold: 500,
      captureEvent: true,
      cancelOnMovement: true,
    }
  );

  const handleMeasure = useCallback(
    (id: string) => {
      if (!isMarkersEnabled) return;
      const marker = markers.find(marker => marker.id === id);
      if (!marker) return;

      startMeasureDistance(id);
    },
    [isMarkersEnabled, markers, startMeasureDistance]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shouldInitializeFeatures) return;

    if (!isMarkersEnabled) {
      if (tempMarker) {
        tempMarker.remove();
        setTempMarker(null);
      }
      closeMenu();
      return;
    }

    // Handle right click for desktop
    const handleRightClick = (e: mapboxgl.MapMouseEvent) => {
      if (!isMarkersEnabled) return;
      e.preventDefault();

      if (isMeasuring) {
        exitMeasureMode();
      }

      // Show the context menu at the clicked position
      setMenuPosition({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
      setMenuLngLat(e.lngLat);
    };

    // Handle touch for mobile (to capture coordinates)
    const handleTouchStart = (e: mapboxgl.MapTouchEvent) => {
      if (!isMarkersEnabled) return;
      setLastLngLat(e.lngLat);
    };

    // Apply longPress to the map container for mobile
    if (isMobile && map.getContainer()) {
      const container = map.getContainer();
      container.setAttribute('role', 'application');
      Object.entries(longPressHandler()).forEach(([key, value]) => {
        container.addEventListener(key.replace('on', '').toLowerCase(), value as EventListener);
      });
    }

    const handleMapClick = () => {
      closeMenu();
    };

    map.on('contextmenu', handleRightClick);
    map.on('touchstart', handleTouchStart);
    map.on('click', handleMapClick);

    const handleModalClose = () => {
      if (tempMarker) {
        tempMarker.remove();
        setTempMarker(null);
      }
    };

    // Add a listener to the document to detect modal closures
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        handleModalClose();
        closeMenu();
      }
    });

    return () => {
      map.off('contextmenu', handleRightClick);
      map.off('touchstart', handleTouchStart);
      map.off('click', handleMapClick);

      if (isMobile && map.getContainer()) {
        const container = map.getContainer();
        Object.entries(longPressHandler()).forEach(([key, value]) => {
          container.removeEventListener(
            key.replace('on', '').toLowerCase(),
            value as EventListener
          );
        });
      }

      document.removeEventListener('keydown', e => {
        if (e.key === 'Escape') {
          handleModalClose();
          closeMenu();
        }
      });
    };
  }, [
    mapRef,
    shouldInitializeFeatures,
    tempMarker,
    openModal,
    isMarkersEnabled,
    addMarker,
    handleCloseModal,
    createMarkerModal,
    createNewMarker,
    lastLngLat,
    longPressHandler,
    closeMenu,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shouldInitializeFeatures) {
      console.log('[SavedLocations EFFECT] Map not ready or features not init.');
      return;
    }

    const eventHandler = (e: mapboxgl.MapMouseEvent) => {
      handleMapClickForMeasurementRef.current(e);
    };

    if (isMeasuring) {
      console.log(
        '[SavedLocations EFFECT] ADDING click listener for measurement (isMeasuring is true).'
      );
      map.on('click', eventHandler);
    } else {
      console.log('[SavedLocations EFFECT] NOT adding listener (isMeasuring is false).');
    }

    return () => {
      console.log('[SavedLocations EFFECT CLEANUP] REMOVING click listener for measurement.');
      map.off('click', eventHandler);
    };
  }, [isMeasuring, mapRef, shouldInitializeFeatures]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMeasuring) {
          exitMeasureMode();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMeasuring, exitMeasureMode]);

  const handleDeleteMeasurement = useCallback(
    (id: string) => {
      deleteMeasurement(id);
    },
    [deleteMeasurement]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shouldInitializeFeatures) return;

    // Add measurement markers and routes
    measurements.forEach((measurement: MeasurementData) => {
      // Add route if it exists
      if (measurement.route) {
        try {
          let routeData;
          if (typeof measurement.route === 'string') {
            try {
              routeData = JSON.parse(measurement.route);
            } catch (parseError) {
              console.error('Error parsing route data:', parseError);
              // If parsing fails, try to decode as polyline
              try {
                const coordinates = decodePolyline(measurement.route);
                routeData = {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: coordinates,
                  },
                };
              } catch (polylineError) {
                console.error('Error processing polyline:', polylineError);
                return;
              }
            }
          } else {
            routeData = measurement.route;
          }

          // Remove existing source and layer if they exist
          if (map.getSource(`measure-route-${measurement.id}`)) {
            map.removeLayer(`measure-route-line-${measurement.id}`);
            map.removeSource(`measure-route-${measurement.id}`);
          }

          // Add the route source and layer
          map.addSource(`measure-route-${measurement.id}`, {
            type: 'geojson',
            data: routeData,
          });

          map.addLayer({
            id: `measure-route-line-${measurement.id}`,
            type: 'line',
            source: `measure-route-${measurement.id}`,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#7D00B8',
              'line-width': 4,
            },
          });

          map.on('click', `measure-route-line-${measurement.id}`, e => {
            const popupContent = document.createElement('div');
            popupContent.className =
              'measurement-popup-content bg-white rounded-lg shadow-lg p-2 max-w-xs';
            popupContent.innerHTML = `
              <h3 class="font-bold text-lg text-gray-800 mb-2">${measurement.name}</h3>
              <p class="text-gray-600 mb-3">${measurement.description}</p>
              <div class="text-sm">
                <div class="flex justify-between mb-1">
                  <b>Distance:</b>
                  <span>${measurement.distance.toFixed(2)} km</span>
                </div>
                <div class="flex justify-between mb-3">
                  <b>Duration:</b>
                  <span>${measurement.duration} min</span>
                </div>
              </div>
              <div class="mt-2 w-full flex justify-end">
                <button class="delete-measurement text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded" data-id="${measurement.id}">
                  Delete
                </button>
              </div>
            `;

            const popup = new mapboxgl.Popup({
              offset: 0,
              className: 'measurement-popup',
              closeButton: true,
              closeOnClick: false,
            })
              .setLngLat(e.lngLat)
              .setDOMContent(popupContent);

            popup.addTo(map);

            const deleteButton = popupContent.querySelector(
              `.delete-measurement[data-id="${measurement.id}"]`
            );
            if (deleteButton) {
              deleteButton.addEventListener('click', () => {
                handleDeleteMeasurement(measurement.id);
                if (map.getSource(`measure-route-${measurement.id}`)) {
                  map.removeLayer(`measure-route-line-${measurement.id}`);
                  map.removeSource(`measure-route-${measurement.id}`);
                }
                popup.remove();
              });
            }
          });

          map.on('mouseenter', `measure-route-line-${measurement.id}`, () => {
            map.getCanvas().style.cursor = 'pointer';
          });

          map.on('mouseleave', `measure-route-line-${measurement.id}`, () => {
            map.getCanvas().style.cursor = '';
          });
        } catch (error) {
          console.error('Error displaying route:', error);
        }
      }

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className =
        'measurement-popup-content bg-white rounded-lg shadow-lg p-2 max-w-xs';
      popupContent.innerHTML = `
        <h3 class="font-bold text-lg text-gray-800 mb-2">${measurement.name}</h3>
        <p class="text-gray-600 mb-3">${measurement.description}</p>
        <div class="text-sm">
          <div class="flex justify-between mb-1">
            <b>Distance:</b>
            <span>${measurement.distance.toFixed(2)} km</span>
          </div>
          <div class="flex justify-between mb-3">
            <b>Duration:</b>
            <span>${measurement.duration} min</span>
          </div>
        </div>
        <div class="mt-2 w-full flex justify-end">
          <button class="delete-measurement text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded" data-id="${measurement.id}">
            Delete
          </button>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 0,
        className: 'measurement-popup',
        closeButton: true,
        closeOnClick: false,
      }).setDOMContent(popupContent);

      // Add click handler for delete button
      popup.on('open', () => {
        const deleteButton = popupContent.querySelector(
          `.delete-measurement[data-id="${measurement.id}"]`
        );
        if (deleteButton) {
          deleteButton.addEventListener('click', () => {
            handleDeleteMeasurement(measurement.id);
            // Remove route layer and source
            if (map.getSource(`measure-route-${measurement.id}`)) {
              map.removeLayer(`measure-route-line-${measurement.id}`);
              map.removeSource(`measure-route-${measurement.id}`);
            }
          });
        }
      });
    });

    // Cleanup function
    return () => {
      measurements.forEach((measurement: MeasurementData) => {
        if (map.getSource(`measure-route-${measurement.id}`)) {
          map.removeLayer(`measure-route-line-${measurement.id}`);
          map.removeSource(`measure-route-${measurement.id}`);
        }
      });
    };
  }, [measurements, shouldInitializeFeatures, mapRef, handleDeleteMeasurement]);

  return (
    <>
      {menuPosition && menuLngLat && (
        <MapMenu
          coordinates={formatCoordinates(menuLngLat)}
          position={menuPosition}
          lngLat={menuLngLat}
          onClose={closeMenu}
          onSave={() => createNewMarker(menuLngLat)}
          onMeasureDistance={() => startMeasureDistance(menuLngLat)}
          onAction={action => console.log('Action:', action)}
        />
      )}

      {isMeasuring && (
        <div className="absolute bottom-4 right-4 p-2 rounded z-10">
          <button
            className="shadow px-3 py-1 bg-rose-700 text-white rounded hover:bg-rose-600 text-sm"
            onClick={exitMeasureMode}
          >
            Cancel Measurement
          </button>
        </div>
      )}
    </>
  );
};

export default SavedLocations;