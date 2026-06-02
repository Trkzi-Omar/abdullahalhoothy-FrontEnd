import type { Map as MapboxMap } from 'mapbox-gl';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import i18next, { t } from '../../i18n';

type GeoJsonEditorControlProps = {
  getDraw: () => MapboxDraw | null;
  title: string;
  applyTitle: string;
  refreshTitle: string;
  closeTitle: string;
  emptyTitle: string;
};

function GeoJsonEditorControl(props: GeoJsonEditorControlProps) {
  const { getDraw, title, applyTitle, refreshTitle, closeTitle, emptyTitle } = props;
  let _map: MapboxMap;
  let _container: HTMLDivElement;
  let _button: HTMLButtonElement;
  let _panel: HTMLDivElement;
  let _editorShell: HTMLDivElement;
  let _mirror: HTMLPreElement;
  let _textarea: HTMLTextAreaElement;
  let _featureCount: HTMLParagraphElement;
  let _error: HTMLParagraphElement;
  let applyDebounceId: number | null = null;
  let syncAnimationFrameId: number | null = null;
  let isSyncingFromMap = false;
  let isOpen = false;
  let handleLanguageChange: (() => void) | null = null;

  const liveSyncEvents: Array<'draw.create' | 'draw.update' | 'draw.delete' | 'draw.combine' | 'draw.uncombine'> = [
    'draw.create',
    'draw.update',
    'draw.delete',
    'draw.combine',
    'draw.uncombine',
  ];

  const supportedGeometryTypes: Array<GeoJSON.Geometry['type']> = ['Polygon', 'MultiPolygon'];

  const getLocalizedUiText = () => ({
    title: t('geojson-editor-title', { defaultValue: title }),
    applyTitle: t('geojson-editor-apply-title', { defaultValue: applyTitle }),
    refreshTitle: t('geojson-editor-refresh-title', { defaultValue: refreshTitle }),
    closeTitle: t('geojson-editor-close-title', { defaultValue: closeTitle }),
    emptyTitle: t('geojson-editor-empty-title', { defaultValue: emptyTitle }),
    placeholder: t('geojson-editor-paste-geojson-here', { defaultValue: 'Paste GeoJSON here' }),
    copyTitle: t('geojson-editor-copy-geojson-to-clipboard', { defaultValue: 'Copy GeoJSON to clipboard' }),
  });

  const decorateInteractiveButton = (button: HTMLButtonElement, options: { hoverBorder?: string; hoverBackground?: string; activeBackground?: string }) => {
    const hoverBorder = options.hoverBorder ?? 'rgba(100, 116, 139, 0.55)';
    const hoverBackground = options.hoverBackground ?? '#f8fafc';
    const activeBackground = options.activeBackground ?? '#e2e8f0';
    const baseBorder = button.style.border;
    const baseBackground = button.style.backgroundColor;
    const baseBoxShadow = button.style.boxShadow;
    const baseTransform = button.style.transform;

    button.style.transition = 'background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease, color 120ms ease';

    button.addEventListener('pointerenter', () => {
      button.style.borderColor = hoverBorder;
      button.style.backgroundColor = hoverBackground;
      button.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.08)';
      button.style.transform = 'translateY(-1px)';
    });

    button.addEventListener('pointerleave', () => {
      button.style.border = baseBorder;
      button.style.backgroundColor = baseBackground;
      button.style.boxShadow = baseBoxShadow;
      button.style.transform = baseTransform;
    });

    button.addEventListener('pointerdown', () => {
      button.style.backgroundColor = activeBackground;
      button.style.boxShadow = 'inset 0 1px 2px rgba(15, 23, 42, 0.12)';
      button.style.transform = 'translateY(0) scale(0.98)';
    });

    button.addEventListener('pointerup', () => {
      button.style.backgroundColor = hoverBackground;
      button.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.08)';
      button.style.transform = 'translateY(-1px)';
    });

    button.addEventListener('pointercancel', () => {
      button.style.border = baseBorder;
      button.style.backgroundColor = baseBackground;
      button.style.boxShadow = baseBoxShadow;
      button.style.transform = baseTransform;
    });

    button.addEventListener('focus', () => {
      button.style.borderColor = hoverBorder;
      button.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.12)';
    });

    button.addEventListener('blur', () => {
      button.style.border = baseBorder;
      button.style.boxShadow = baseBoxShadow;
    });
  };

  const createButton = (buttonTitle: string, clickHandler: () => void): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mapboxgl-ctrl-icon !flex !items-center !justify-center';
    button.style.width = '29px';
    button.style.height = '29px';
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4h16v16H4z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>`;
    button.title = buttonTitle;
    button.setAttribute('aria-label', buttonTitle);

    const handleClick = (event: Event) => {
      event.preventDefault();
      clickHandler();
    };

    button.addEventListener('click', handleClick);
    button.addEventListener('touchend', handleClick);

    return button;
  };

  const setError = (message: string) => {
    _error.textContent = message;
    _error.classList.toggle('hidden', message.length === 0);
  };

  const setFeatureSummary = (featureCount: number) => {
    const uiText = getLocalizedUiText();

    if (featureCount === 0) {
      _featureCount.textContent = uiText.emptyTitle;
      return;
    }

    _featureCount.textContent = featureCount === 1
      ? t('geojson-editor-feature-loaded', { count: featureCount })
      : t('geojson-editor-features-loaded', { count: featureCount });
  };

  const escapeHtml = (value: string) =>
    value
      .split('&').join('&amp;')
      .split('<').join('&lt;')
      .split('>').join('&gt;');

  const highlightJson = (value: string) => {
    const escaped = escapeHtml(value);
    const highlighted = escaped.replace(
      /("(?:[^"\\]|\\.)*")(?=\s*:)|("(?:[^"\\]|\\.)*")|\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|\b(true|false|null)\b|([{}[\],:])/g,
      (
        match: string,
        key: string | undefined,
        stringValue: string | undefined,
        numberValue: string | undefined,
        literalValue: string | undefined,
        punctuation: string | undefined,
      ) => {
        if (key) {
          return `<span class="text-amber-300">${key}</span>`;
        }

        if (stringValue) {
          return `<span class="text-emerald-300">${stringValue}</span>`;
        }

        if (numberValue) {
          return `<span class="text-sky-300">${numberValue}</span>`;
        }

        if (literalValue) {
          return `<span class="text-violet-300">${literalValue}</span>`;
        }

        if (punctuation) {
          return `<span class="text-slate-400">${punctuation}</span>`;
        }

        return match;
      },
    );

    return highlighted.replace(/\n$/u, '\n\u200b');
  };

  const updateMirror = () => {
    if (!_mirror) {
      return;
    }

    _mirror.innerHTML = highlightJson(_textarea.value || '');
  };

  const syncMirrorScroll = () => {
    if (!_mirror) {
      return;
    }

    _mirror.scrollTop = _textarea.scrollTop;
    _mirror.scrollLeft = _textarea.scrollLeft;
  };

  const syncFromDraw = () => {
    const draw = getDraw();
    if (!draw) {
      throw new Error(t('geojson-editor-draw-control-not-ready'));
    }

    isSyncingFromMap = true;
    try {
      const current = draw.getAll() as GeoJSON.FeatureCollection;
      _textarea.value = JSON.stringify(current, null, 2);
      updateMirror();
      setFeatureSummary(current.features.length);
      setError('');
    } finally {
      isSyncingFromMap = false;
    }
  };

  const clearScheduledApply = () => {
    if (applyDebounceId !== null) {
      window.clearTimeout(applyDebounceId);
      applyDebounceId = null;
    }
  };

  const clearScheduledSync = () => {
    if (syncAnimationFrameId !== null) {
      window.cancelAnimationFrame(syncAnimationFrameId);
      syncAnimationFrameId = null;
    }
  };

  const scheduleSyncFromDraw = () => {
    if (isSyncingFromMap) {
      return;
    }

    clearScheduledSync();
    syncAnimationFrameId = window.requestAnimationFrame(() => {
      syncAnimationFrameId = null;

      if (document.activeElement === _textarea) {
        return;
      }

      try {
        syncFromDraw();
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      }
    });
  };

  const bindLiveSync = () => {
    liveSyncEvents.forEach(eventName => {
      _map.on(eventName, scheduleSyncFromDraw);
    });
  };

  const unbindLiveSync = () => {
    liveSyncEvents.forEach(eventName => {
      _map.off(eventName, scheduleSyncFromDraw);
    });
  };

  const normalizeGeoJson = (value: unknown): GeoJSON.FeatureCollection => {
    if (!value || typeof value !== 'object') {
      throw new Error(t('geojson-editor-geojson-must-be-an-object'));
    }

    const geojson = value as Record<string, unknown>;

    if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
      return geojson as unknown as GeoJSON.FeatureCollection;
    }

    if (geojson.type === 'Feature' && geojson.geometry && typeof geojson.geometry === 'object') {
      return {
        type: 'FeatureCollection',
        features: [geojson as unknown as GeoJSON.Feature],
      };
    }

    if (typeof geojson.type === 'string' && 'coordinates' in geojson) {
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: geojson as unknown as GeoJSON.Geometry,
            properties: {},
          },
        ],
      };
    }

    throw new Error(t('geojson-editor-geojson-must-be-featurecollection-feature-or-geometry'));
  };

  const validateFeatureCollection = (collection: GeoJSON.FeatureCollection) => {
    collection.features.forEach(feature => {
      if (!feature || feature.type !== 'Feature' || !feature.geometry) {
        throw new Error(t('geojson-editor-each-item-must-be-a-valid-geojson-feature'));
      }

      if (!supportedGeometryTypes.includes(feature.geometry.type)) {
        throw new Error(t('geojson-editor-only-polygon-and-multipolygon-geometries-are-supported'));
      }
    });
  };

  const setOpen = (open: boolean) => {
    isOpen = open;
    _panel.classList.toggle('hidden', !open);
    _button.classList.toggle('ring-2', open);
    _button.classList.toggle('ring-primary', open);
    _button.classList.toggle('shadow-md', open);
    _button.setAttribute('aria-expanded', String(open));

    if (open) {
      try{
        syncFromDraw();
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error)); 
      }
      _textarea.focus();
      _textarea.selectionStart = 0;
      _textarea.selectionEnd = 0;
    }
  };

  const togglePanel = () => {
    setOpen(!isOpen);
  };

  const applyGeoJson = () => {
    if (isSyncingFromMap) {
      return;
    }

    const draw = getDraw();
    if (!draw) {
      setError(t('geojson-editor-draw-control-not-ready'));
      return;
    }

    try {
      const parsed = JSON.parse(_textarea.value);
      const collection = normalizeGeoJson(parsed);
      validateFeatureCollection(collection);

      draw.deleteAll();
      let addedFeatureIds: string[] = [];
      if (collection.features.length > 0) {
        addedFeatureIds = draw.add(collection);
      }
      if (addedFeatureIds.length === 1) {
        draw.changeMode('direct_select', { featureId: addedFeatureIds[0] });
      } else {
        draw.changeMode('simple_select', { featureIds: addedFeatureIds });
      }
      window.requestAnimationFrame(() => {
        try {
          syncFromDraw();
        } catch (syncError) {
          setError(syncError instanceof Error ? syncError.message : String(syncError));
        }
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  const scheduleApplyGeoJson = () => {
    if (isSyncingFromMap) {
      return;
    }

    clearScheduledApply();
    applyDebounceId = window.setTimeout(() => {
      applyDebounceId = null;
      applyGeoJson();
    }, 350);
  };

  const refreshPanel = () => {
    try {
      syncFromDraw();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  const copyToClipboard = async () => {
    if (!navigator.clipboard?.writeText) {
      setError(t('geojson-editor-clipboard-copy-is-not-available-in-this-browser'));
      return;
    }

    try {
      const jsonText = _textarea.value.trim();
      if (!jsonText) {
        setError(t('geojson-editor-there-is-no-geojson-to-copy'));
        return;
      }

      await navigator.clipboard.writeText(jsonText);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  const closePanel = () => {
    setOpen(false);
  };

  const refreshLocalizedText = () => {
    if (!_button || !_panel || !_textarea) {
      return;
    }

    const uiText = getLocalizedUiText();
    _button.title = uiText.title;
    _button.setAttribute('aria-label', uiText.title);
    _textarea.placeholder = uiText.placeholder;

    const buttons = Array.from(_panel.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.forEach(button => {
      const label = button.getAttribute('aria-label') ?? button.title;

      if (label === closeTitle || label === uiText.closeTitle) {
        button.title = uiText.closeTitle;
        button.setAttribute('aria-label', uiText.closeTitle);
      } else if (label === refreshTitle || label === uiText.refreshTitle) {
        button.title = uiText.refreshTitle;
        button.setAttribute('aria-label', uiText.refreshTitle);
      } else if (label === applyTitle || label === uiText.applyTitle) {
        button.title = uiText.applyTitle;
        button.setAttribute('aria-label', uiText.applyTitle);
      } else if (label === 'Copy GeoJSON to clipboard' || label === uiText.copyTitle) {
        button.title = uiText.copyTitle;
        button.setAttribute('aria-label', uiText.copyTitle);
      }
    });
    try{
      syncFromDraw();
    }catch(error){
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  return {
    onAdd(map: MapboxMap): HTMLElement {
      _map = map;
      bindLiveSync();
      handleLanguageChange = () => {
        refreshLocalizedText();
      };
      i18next.on('languageChanged', handleLanguageChange);
      _container = document.createElement('div');
      _container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group !relative !z-[80] !overflow-visible';

      const uiText = getLocalizedUiText();

      _button = createButton(title, togglePanel);
      _button.title = uiText.title;
      _button.setAttribute('aria-label', uiText.title);
      _button.setAttribute('aria-expanded', 'false');

      _panel = document.createElement('div');
      _panel.className = 'absolute top-0 end-[calc(100%+0.75rem)] z-[90] hidden w-[min(92vw,28rem)] max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl max-sm:top-[calc(100%+0.5rem)] max-sm:end-0 max-sm:w-[calc(100vw-1rem)] max-sm:max-w-[calc(100vw-1rem)] max-sm:max-h-[calc(100vh-5rem)]';

      const header = document.createElement('div');
      header.className = 'mb-3 flex items-start justify-between gap-3';

      const headerText = document.createElement('div');

      const heading = document.createElement('p');
      heading.className = 'text-sm font-semibold text-slate-900';
      heading.textContent = uiText.title;

      _featureCount = document.createElement('p');
      _featureCount.className = 'mt-1 text-xs text-slate-500';
      _featureCount.textContent = uiText.emptyTitle;

      headerText.appendChild(heading);
      headerText.appendChild(_featureCount);

      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      // simple close icon button
      closeButton.className = '';
      closeButton.title = uiText.closeTitle;
      closeButton.setAttribute('aria-label', uiText.closeTitle);
      closeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>`;
      closeButton.style.padding = '6px';
      closeButton.style.borderRadius = '6px';
      closeButton.style.border = '1px solid rgba(148, 163, 184, 0.35)';
      closeButton.style.background = '#fff';
      closeButton.style.color = '#0f172a';
      closeButton.style.cursor = 'pointer';
      closeButton.addEventListener('click', closePanel);
      decorateInteractiveButton(closeButton, {
        hoverBackground: '#f8fafc',
        activeBackground: '#e2e8f0',
      });

      header.appendChild(headerText);
      header.appendChild(closeButton);

      _editorShell = document.createElement('div');
      _editorShell.className = 'relative h-[260px] w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-inner max-sm:h-[min(38vh,220px)]';
      _editorShell.setAttribute('dir', 'ltr');
      _editorShell.style.direction = 'ltr';

      _mirror = document.createElement('pre');
      _mirror.className = 'pointer-events-none absolute inset-0 m-0 overflow-auto px-3 py-2 font-mono text-xs leading-5 text-slate-900 whitespace-pre-wrap break-words';
      _mirror.setAttribute('aria-hidden', 'true');
      _mirror.style.direction = 'ltr';
      _mirror.style.unicodeBidi = 'plaintext';
      _mirror.style.textAlign = 'left';

      _textarea = document.createElement('textarea');
      _textarea.className = 'absolute inset-0 h-full w-full resize-none border-0 bg-transparent px-3 py-2 font-mono text-xs leading-5 text-transparent caret-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:ring-0';
      _textarea.spellcheck = false;
      _textarea.setAttribute('dir', 'ltr');
      _textarea.style.direction = 'ltr';
      _textarea.style.unicodeBidi = 'plaintext';
      _textarea.style.textAlign = 'left';
      _textarea.placeholder = uiText.placeholder;
      _textarea.addEventListener('input', () => {
        updateMirror();
        scheduleApplyGeoJson();
      });
      _textarea.addEventListener('scroll', syncMirrorScroll);
      _textarea.addEventListener('keydown', syncMirrorScroll);

      _error = document.createElement('p');
      _error.className = 'mt-3 hidden rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700';

      const footer = document.createElement('div');
      footer.className = 'mt-3 flex flex-wrap items-center justify-between gap-2';

      const leftActions = document.createElement('div');
      leftActions.className = 'flex flex-wrap items-center gap-2';

      const refreshButton = document.createElement('button');
      refreshButton.type = 'button';
      refreshButton.className = '';
      refreshButton.title = uiText.refreshTitle;
      refreshButton.setAttribute('aria-label', uiText.refreshTitle);
      refreshButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.13-9.36" />
        </svg>`;
      refreshButton.style.padding = '6px';
      refreshButton.style.borderRadius = '6px';
      refreshButton.style.border = '1px solid rgba(148, 163, 184, 0.35)';
      refreshButton.style.background = '#fff';
      refreshButton.style.color = '#0f172a';
      refreshButton.style.cursor = 'pointer';
      refreshButton.style.minWidth = '0';
      refreshButton.addEventListener('click', refreshPanel);
      decorateInteractiveButton(refreshButton, {
        hoverBackground: '#f8fafc',
        activeBackground: '#e2e8f0',
      });

      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = '';
      copyButton.title = uiText.copyTitle;
      copyButton.setAttribute('aria-label', uiText.copyTitle);
      copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>`;
      copyButton.style.padding = '6px';
      copyButton.style.borderRadius = '6px';
      copyButton.style.border = '1px solid rgba(148, 163, 184, 0.35)';
      copyButton.style.background = '#fff';
      copyButton.style.color = '#0f172a';
      copyButton.style.cursor = 'pointer';
      copyButton.style.minWidth = '0';
      copyButton.addEventListener('click', () => {
        void copyToClipboard();
      });
      decorateInteractiveButton(copyButton, {
        hoverBackground: '#f8fafc',
        activeBackground: '#e2e8f0',
      });

      const applyButton = document.createElement('button');
      applyButton.type = 'button';
      applyButton.className = '';
      applyButton.title = uiText.applyTitle;
      applyButton.setAttribute('aria-label', uiText.applyTitle);
      applyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>`;
      applyButton.style.padding = '6px';
      applyButton.style.borderRadius = '6px';
      applyButton.style.border = '1px solid rgb(17, 87, 64)';
      applyButton.style.background = 'rgb(17, 87, 64)';
      applyButton.style.color = '#fff';
      applyButton.style.cursor = 'pointer';
      applyButton.style.minWidth = '0';
      applyButton.addEventListener('click', applyGeoJson);
      decorateInteractiveButton(applyButton, {
        hoverBorder: 'rgb(17, 87, 64)',
        hoverBackground: 'rgb(21, 101, 74)',
        activeBackground: 'rgb(14, 74, 54)',
      });

      leftActions.appendChild(refreshButton);
      leftActions.appendChild(copyButton);

      footer.appendChild(leftActions);
      footer.appendChild(applyButton);

      _panel.appendChild(header);
      _editorShell.appendChild(_mirror);
      _editorShell.appendChild(_textarea);

      _panel.appendChild(_editorShell);
      _panel.appendChild(_error);
      _panel.appendChild(footer);

      _container.appendChild(_button);
      _container.appendChild(_panel);

      setOpen(false);

      return _container;
    },

    onRemove(): void {
      clearScheduledApply();
      clearScheduledSync();
      unbindLiveSync();
      if (handleLanguageChange) {
        i18next.off('languageChanged', handleLanguageChange);
        handleLanguageChange = null;
      }
      if (_map) {
        _map = undefined as unknown as MapboxMap;
      }

      _container?.parentNode?.removeChild(_container);
    },
  };
}

export { GeoJsonEditorControl };