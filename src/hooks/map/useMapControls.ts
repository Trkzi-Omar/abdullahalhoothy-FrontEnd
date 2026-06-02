import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { StylesControl } from '../../components/Map/StylesControl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { CircleControl } from '../../components/Map/CircleControl';
import { GeoJsonEditorControl } from '../../components/Map/GeoJsonEditorControl';
import { LayerActionsControl } from '../../components/Map/LayerActionsControl';
import { useUIContext } from '../../context/UIContext';
import { useCatalogContext } from '../../context/CatalogContext';
import { useMapContext } from '../../context/MapContext';
import { useLayerContext } from '../../context/LayerContext';
import { t } from '../../i18n';

export function useMapControls() {
  const { mapRef, drawRef, shouldInitializeFeatures } = useMapContext();
  const { isMobile } = useUIContext();
  const { currentStyle, setCurrentStyle, isLoading: isCatalogLoading } = useCatalogContext();
  const { refreshAllLayersRef, clearAllLayersRef, isLoadingDataset } = useLayerContext();
  const isLoadingDatasetRef = useRef(isLoadingDataset);
  const isCatalogLoadingRef = useRef(isCatalogLoading);
  const controlsAdded = useRef(false);

  useEffect(() => {
    isLoadingDatasetRef.current = isLoadingDataset;
  }, [isLoadingDataset]);

  useEffect(() => {
    isCatalogLoadingRef.current = isCatalogLoading;
  }, [isCatalogLoading]);

  useEffect(() => {
    if (!shouldInitializeFeatures) return;

    const map = mapRef.current;
    if (!map) return;

    let controls: {
      styles?: mapboxgl.IControl;
      navigation?: mapboxgl.NavigationControl;
      circle?: mapboxgl.IControl;
      draw?: MapboxDraw;
      geoJsonEditor?: mapboxgl.IControl;
      scale?: mapboxgl.ScaleControl;
      layerActions?: mapboxgl.IControl;
    } = {};

    const addControls = () => {
      if (controlsAdded.current) {
        return;
      }

      const isRTL = document.documentElement.dir === 'rtl';
      const nativeControlsPosition: mapboxgl.ControlPosition = isRTL ? 'top-left' : 'top-right';

      try {
        // Add styles control
        controls.styles = new StylesControl(currentStyle, setCurrentStyle);
        map.addControl(controls.styles, nativeControlsPosition);

        // Add navigation control
        controls.navigation = new mapboxgl.NavigationControl();
        map.addControl(controls.navigation, nativeControlsPosition);

        // Initialize draw control
        drawRef.current = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            point: false,
            line_string: false,
            polygon: true,
            trash: true,
          },
        });

        // Add circle control
        controls.circle = new CircleControl({
          draw: drawRef.current,
          isMobile,
        });
        map.addControl(controls.circle, nativeControlsPosition);

        // Add draw control
        map.addControl(drawRef.current, nativeControlsPosition);

        controls.geoJsonEditor = GeoJsonEditorControl({
          getDraw: () => drawRef.current,
          title: 'Edit GeoJSON',
          applyTitle: 'Apply changes to map',
          refreshTitle: 'Refresh from map',
          closeTitle: 'Close GeoJSON editor',
          emptyTitle: 'No polygon or circle features are currently on the map.',
        });
        map.addControl(controls.geoJsonEditor, nativeControlsPosition);

        controls.layerActions = new LayerActionsControl({
          getRefreshAll: () => refreshAllLayersRef.current,
          getClearAll: () => clearAllLayersRef.current,
          getIsLoading: () => Boolean(isLoadingDatasetRef.current || isCatalogLoadingRef.current),
          refreshTitle: t('refresh-all-layers'),
          clearTitle: t('clear-all-layers'),
        });
        map.addControl(controls.layerActions, nativeControlsPosition);

        // Add scale control
        controls.scale = new mapboxgl.ScaleControl({
          maxWidth: 200,
          unit: 'metric',
        });
        map.addControl(controls.scale, 'bottom-left');

        controlsAdded.current = true;
      } catch (error) {
        console.error('Error adding controls:', error);
      }
    };

    // Try to add controls immediately if map is ready
    const attemptToAddControls = () => {
      if (map.loaded() && map.isStyleLoaded()) {
        addControls();
      } else {
        map.once('load', () => {
          if (map.isStyleLoaded()) {
            addControls();
          } else {
            map.once('style.load', () => {
              addControls();
            });
          }
        });
      }
    };

    attemptToAddControls();

    return () => {
      if (controlsAdded.current && map) {
        try {
          const mapWithHasControl = map as unknown as { hasControl?: (control: unknown) => boolean };

          // Remove draw control first
          if (drawRef.current) {
            try {
              // Force cleanup of draw control
              if (typeof mapWithHasControl.hasControl !== 'function' || mapWithHasControl.hasControl(drawRef.current)) {
                map.removeControl(drawRef.current);
              }
            } catch (err) {
              console.warn('Non-fatal draw cleanup error:', err);
            } finally {
              // Always null the reference
              drawRef.current = null;
            }
          }

          // Remove other controls
          ['layerActions', 'geoJsonEditor', 'circle', 'navigation', 'styles', 'scale'].forEach(key => {
            if (controls[key] && (typeof mapWithHasControl.hasControl !== 'function' || mapWithHasControl.hasControl(controls[key]))) {
              try {
                map.removeControl(controls[key]);
              } catch (err) {
                console.warn(`Non-fatal ${key} control cleanup error:`, err);
              }
            }
          });
        } catch (error) {
          console.warn('Control cleanup error:', error);
        } finally {
          controls = {};
          controlsAdded.current = false;
        }
      }
    };
  }, [
    mapRef,
    drawRef,
    currentStyle,
    setCurrentStyle,
    isMobile,
    shouldInitializeFeatures,
    refreshAllLayersRef,
    clearAllLayersRef,
  ]);
}
