import { MapFeatures } from '../../types/allTypesAndInterfaces';
import defaultMapConfig from '../../mapConfig.json';
import { t } from '../../i18n';

function MapLegend(legendElement: HTMLDivElement, geoPoints: MapFeatures[]) {
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
  const header = document.createElement('div');
  header.className = 'p-2 border-b font-medium text-sm';
  header.textContent = t("legend");
  legendElement.appendChild(header);

  // Create legend content
  const content = document.createElement('div');
  content.className = 'p-2';

  geoPoints.forEach(point => {
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
          <span class="text-sm">${group.legend}</span>
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
        <span class="text-sm">${getLayerLabel(point)}</span>
        <span class="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-medium text-[#6b7280]">${t('legend-total-features', { count: totalFeatureCount })}</span>
      `;
      content.appendChild(item);
    }
  });

  legendElement.appendChild(content);
}

export default MapLegend;
