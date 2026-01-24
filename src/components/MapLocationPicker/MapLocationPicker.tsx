import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { defaultMapConfig } from '../../hooks/map/useMapInitialization';

interface Location {
  lat: number;
  lng: number;
}

interface LocationWithPrice extends Location {
  price?: number;
}

interface MapLocationPickerProps {
  city: string;
  onChange: (data: Partial<LocationWithPrice>) => void;
  selectedLocation?: Location;
  title: string;
  error?: string;
  rentPrice?: number;
  disabled?: boolean;
}

const CITY_CONFIG = {
  Riyadh: {
    center: [46.715234200000005, 24.680283985000003] as [number, number],
    bounds: [
      [46.4, 24.4], // Southwest
      [47.0, 25.0], // Northeast
    ] as [[number, number], [number, number]],
    zoom: 10,
  },
  Mecca: {
    center: [39.808084925, 21.374926824999996] as [number, number],
    bounds: [
      [39.6, 21.2], // Southwest
      [40.1, 21.6], // Northeast
    ] as [[number, number], [number, number]],
    zoom: 11,
  },
  Jeddah: {
    center: [39.338754846938805, 21.48137806122448] as [number, number],
    bounds: [
      [38.9, 21.3], // Southwest
      [39.4, 21.8], // Northeast
    ] as [[number, number], [number, number]],
    zoom: 10,
  },
};

const MapLocationPicker = ({
  city,
  onChange,
  selectedLocation,
  title,
  error,
  rentPrice,
  disabled = false,
}: MapLocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const memoizedOnChange = useCallback(onChange, [onChange]);

  useEffect(() => {
    if (import.meta.env.VITE_MAPBOX_KEY) {
      mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;
      setIsLoaded(true);
    } else {
      console.error(
        'Mapbox access token not found. Please set VITE_MAPBOX_KEY in your environment variables.'
      );
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapContainer.current || map.current) return;

    const cityConfig = CITY_CONFIG[city as keyof typeof CITY_CONFIG] || CITY_CONFIG.Riyadh;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: cityConfig.center,
      zoom: cityConfig.zoom,
      maxBounds: cityConfig.bounds,
      attributionControl: true,
      preserveDrawingBuffer: true,
    });

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;

      if (marker.current) {
        marker.current.remove();
      }

      if (map.current) {
        marker.current = new mapboxgl.Marker({
          color: defaultMapConfig.defaultColor,
          draggable: true,
        })
          .setLngLat([lng, lat])
          .addTo(map.current);
      }

      if (marker.current) {
        const handleMarkerDragEnd = () => {
          if (marker.current) {
            const lngLat = marker.current.getLngLat();
            memoizedOnChange({ lat: lngLat.lat, lng: lngLat.lng });
          }
        };
        marker.current.on('dragend', handleMarkerDragEnd);
      }

      memoizedOnChange({ lat, lng });
    };

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
        map.current.remove();
        map.current = null;
      }
    };
  }, [isLoaded, city]);

  useEffect(() => {
    if (!map.current || !selectedLocation) return;

    if (marker.current) {
      marker.current.remove();
    }

    if (selectedLocation.lat !== 0 && selectedLocation.lng !== 0) {
      marker.current = new mapboxgl.Marker({
        color: defaultMapConfig.defaultColor,
        draggable: true,
      })
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .addTo(map.current);

      if (marker.current) {
        const handleMarkerDragEnd = () => {
          if (marker.current) {
            const lngLat = marker.current.getLngLat();
            memoizedOnChange({ lat: lngLat.lat, lng: lngLat.lng });
          }
        };
        marker.current.on('dragend', handleMarkerDragEnd);
      }
    }
  }, [selectedLocation, memoizedOnChange]);

  const centerOnCity = () => {
    if (!map.current) return;
    const cityConfig = CITY_CONFIG[city as keyof typeof CITY_CONFIG] || CITY_CONFIG.Riyadh;
    map.current.flyTo({
      center: cityConfig.center,
      zoom: cityConfig.zoom,
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={centerOnCity}
          className="px-3 py-1.5 text-sm text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
          style={
            {
              backgroundColor: defaultMapConfig.defaultColor,
              '--hover-color': defaultMapConfig.hoverColor,
            } as React.CSSProperties
          }
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = defaultMapConfig.hoverColor;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = defaultMapConfig.defaultColor;
          }}
        >
          Center on {city}
        </button>
      </div>

      <div className="space-y-4">
        <div
          ref={mapContainer}
          className={`w-full h-64 rounded-lg border bg-gray-50 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          style={{ minHeight: '256px' }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Map Info Section */}
          <div className="space-y-2">
            {selectedLocation && selectedLocation.lat !== 0 && selectedLocation.lng !== 0 && (
              <div className="text-sm text-gray-600">
                Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <p className="text-sm text-gray-500">
              Click on the map to select a location. You can drag the marker to fine-tune the
              position.
            </p>
          </div>

          {/* Rent Price Input Section */}
          {rentPrice !== undefined && (
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rent Price (SAR)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={rentPrice || ''}
                onChange={e => {
                  const value = parseFloat(e.target.value) || 0;
                  onChange({ price: value });
                }}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2"
                placeholder="Enter rent price"
              />
              <p className="text-xs text-gray-500 mt-1">
                Yearly rent price for this location in Saudi Riyal
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapLocationPicker;
