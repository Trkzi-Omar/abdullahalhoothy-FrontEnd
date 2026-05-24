import type { Map } from 'mapbox-gl';

type LayerActionsControlProps = {
  getRefreshAll: () => (() => void) | null;
  getClearAll: () => (() => void) | null;
  getIsLoading?: () => boolean;
  refreshTitle: string;
  clearTitle: string;
};

function LayerActionsControl(props: LayerActionsControlProps) {
  const { getRefreshAll, getClearAll, refreshTitle, clearTitle } = props;
  let _container: HTMLDivElement;
  const buttonIntervals = new WeakMap<HTMLButtonElement, number>();

  const refreshSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12a9 9 0 1 1-3.51-7.13" />
      <polyline points="21 4 21 10 15 10" />
    </svg>`;

  const trashSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1.5 14a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>`;

  const createButton = (
    title: string,
    innerHTML: string,
    getHandler: () => (() => void) | null
    , getIsLoading?: () => boolean
  ): HTMLButtonElement => {
    const button = document.createElement('button');
    button.className = 'mapboxgl-ctrl-icon !flex !items-center !justify-center';
    button.type = 'button';
    button.title = title;
    button.setAttribute('aria-label', title);
    button.innerHTML = innerHTML;
    button.style.width = '29px';
    button.style.height = '29px';

    const handler = (e: Event) => {
      e.preventDefault();
      const fn = getHandler();
      if (fn) fn();
    };

    button.addEventListener('click', handler);
    button.addEventListener('touchend', handler);

    // If a loading supplier is provided, start a small polling loop to toggle
    // a rotating animation class while loading is true. This control isn't
    // part of React, so we poll the supplier for state changes.
    if (getIsLoading) {
      injectSpinStyle();
      const id = window.setInterval(() => {
        try {
          const loading = Boolean(getIsLoading());
          if (loading) {
            button.classList.add('map-control-rotating');
          } else {
            button.classList.remove('map-control-rotating');
          }
        } catch (err) {
          console.warn('Error in LayerActionsControl loading state polling:', err);
        }
      }, 200);

      // Store interval id on the element so we can clear it on removal.
      buttonIntervals.set(button, id);
    }
    return button;
  };

  const injectSpinStyle = () => {
    if (document.getElementById('layer-actions-spin-style')) return;
    const style = document.createElement('style');
    style.id = 'layer-actions-spin-style';
    style.textContent = `@keyframes layer-actions-spin{from{transform:rotate(0deg)}to{transform:rotate(720deg)}}.map-control-rotating{animation:layer-actions-spin 1s linear infinite}`;
    document.head.appendChild(style);
  };

  return {
    onAdd(map: Map): HTMLElement {
      void map;
      _container = document.createElement('div');
      _container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

      const refreshBtn = createButton(refreshTitle, refreshSvg, getRefreshAll, props.getIsLoading);
      const clearBtn = createButton(clearTitle, trashSvg, getClearAll);

      _container.appendChild(refreshBtn);
      _container.appendChild(clearBtn);

      return _container;
    },

    onRemove(): void {
      // Clear any polling intervals attached to buttons
      try {
        Array.from(_container.querySelectorAll('button')).forEach(btn => {
          const id = buttonIntervals.get(btn as HTMLButtonElement);
          if (id) window.clearInterval(id);
        });
      } catch (err) {
        console.warn('Error clearing intervals on LayerActionsControl removal:', err);
      }
      _container?.parentNode?.removeChild(_container);
    },
  };
}

export { LayerActionsControl };
