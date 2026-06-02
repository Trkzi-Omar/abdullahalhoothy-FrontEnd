import { MapFeatures } from '../../types/allTypesAndInterfaces';
import defaultMapConfig from '../../mapConfig.json';
import i18next, { t } from '../../i18n';
import { formatSubcategoryName } from '../../utils/helperFunctions';

const RIYADH_LEGEND_PREFIX = /^Saudi Arabia Riyadh\s+/i;
const RIYADH_ARABIC_SUFFIX = /\s+في الرياض، السعودية$/;

const translateDatasetName = (name: string) => {
  const trimmed = name.trim();
  const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, '_');
  const translated = formatSubcategoryName(normalized);
  return translated !== normalized ? translated : trimmed;
};

const translateLegend = (legend: string) => {
  const exactTranslation = t(legend, { defaultValue: '' });
  if (exactTranslation) return exactTranslation;

  if (i18next.language.startsWith('ar') && RIYADH_LEGEND_PREFIX.test(legend)) {
    const datasetNames = legend
      .replace(RIYADH_LEGEND_PREFIX, '')
      .split(/\s*\+\s*/)
      .map(translateDatasetName)
      .join(' + ');

    return `${datasetNames} في الرياض، السعودية`;
  }

  if (i18next.language.startsWith('ar') && RIYADH_ARABIC_SUFFIX.test(legend)) {
    const datasetNames = legend
      .replace(RIYADH_ARABIC_SUFFIX, '')
      .split(/\s*\+\s*/)
      .map(translateDatasetName)
      .join(' + ');

    return `${datasetNames} في الرياض، السعودية`;
  }

  return legend;
};

function MapLegend(legendElement: HTMLDivElement, geoPoints: MapFeatures[]) {
  const isCollapsed = legendElement.dataset.collapsed === 'true';

  // Clear existing content
  legendElement.innerHTML = '';

  const getFeatureCount = (point: MapFeatures) => {
    if (Array.isArray(point.features)) {
      return point.features.length;
    }

    if (Array.isArray(point.gradient_groups)) {
      return point.gradient_groups.reduce((count, group) => {
        if (typeof group.count === 'number') {
          return count + group.count;
        }

        return count;
      }, 0);
    }

    return 0;
  };

  const getLayerLabel = (point: MapFeatures) => point.layer_name || point.layer_legend || '';

  // Create legend header
  const header = document.createElement('button');
  header.type = 'button';
  header.className = 'w-full p-2 border-b font-medium text-sm flex items-center justify-between gap-3 cursor-pointer';
  header.setAttribute('aria-expanded', String(!isCollapsed));
  header.innerHTML = `
    <span>${t('legend')}</span>
    <span class="inline-flex size-7 items-center justify-center rounded-full bg-[#f3f4f6] text-[#115740] ring-1 ring-black/5 shadow-sm transition-transform ${isCollapsed ? '' : 'rotate-180'}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
  `;
  legendElement.appendChild(header);

  // Create legend content
  const content = document.createElement('div');
  content.className = `p-2 ${isCollapsed ? 'hidden' : ''}`;
  header.addEventListener('click', () => {
    const nextCollapsed = legendElement.dataset.collapsed !== 'true';
    legendElement.dataset.collapsed = String(nextCollapsed);
    content.classList.toggle('hidden', nextCollapsed);
    header.setAttribute('aria-expanded', String(!nextCollapsed));
    const icon = header.querySelector('span:last-child');
    icon?.classList.toggle('rotate-180', !nextCollapsed);
  });

  geoPoints.forEach(point => {
    if (point.isHydrating) return;

    if (!point.display) return;

    const totalFeatureCount = getFeatureCount(point);

    if (point.is_gradient && point.gradient_groups) {
      const layerSummary = document.createElement('div');
      layerSummary.className = 'flex items-center gap-2 mb-2';
      layerSummary.innerHTML = `
        <div class="w-3 h-3 rounded-full border border-[${defaultMapConfig.circleStrokeColor}]" style="background-color: ${point.points_color}"></div>
        <span class="text-sm font-medium">${getLayerLabel(point)}</span>
        <span class="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-medium text-[#6b7280]">${t('legend-total-features', { count: totalFeatureCount })}</span>
      `;

      const groupDiv = document.createElement('div');
      groupDiv.className = 'mb-2';
      point.gradient_groups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-2 mb-1';
        const groupCount = typeof group.count === 'number' ? group.count : 0;
        item.innerHTML = `
          <div class="w-3 h-3 rounded-full border border-[${defaultMapConfig.circleStrokeColor}]" style="background-color: ${group.color}"></div>
          <span class="text-sm">${translateLegend(group.legend)}</span>
          <span class="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-medium text-[#6b7280]">${t('legend-feature-count', { count: groupCount })}</span>
        `;
        groupDiv.appendChild(item);
      });
      content.appendChild(layerSummary);
      content.appendChild(groupDiv);
    } else if (point.layer_legend || point.layer_name) {
      const item = document.createElement('div');
      item.className = 'flex items-center gap-2 mb-1';
      item.innerHTML = `
        <div class="w-3 h-3 rounded-full border border-[${defaultMapConfig.circleStrokeColor}]  " style="background-color: ${point.points_color}"></div>
        <span class="text-sm">${translateLegend(point.layer_legend)}</span>
        <span class="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-medium text-[#6b7280]">${t('legend-total-features', { count: totalFeatureCount })}</span>
      `;
      content.appendChild(item);
    }
  });

  legendElement.appendChild(content);
}

export default MapLegend;
