import { Feature, AppliedFilter, AppliedRecolor } from '../types';

/** Filter original features by all applied filters (intersection). */
export function recomputeFeatures(
  originalFeatures: Feature[],
  filters: AppliedFilter[],
): Feature[] {
  if (!filters || filters.length === 0) return originalFeatures;
  let currentFeatures = [...originalFeatures];

  for (const filter of filters) {
    const filterFeatures = Array.isArray(filter.features) ? filter.features : [];
    if (filterFeatures.length === 0) {
      continue;
    }

    const filterSet = new Set(
      filterFeatures.map((f) => {
        const coords = f.geometry.coordinates;
        return `${coords[0]},${coords[1]}`;
      }),
    );
    currentFeatures = currentFeatures.filter((f) => {
      const coords = f.geometry.coordinates;
      return filterSet.has(`${coords[0]},${coords[1]}`);
    });
  }
  return currentFeatures;
}

/**
 * Take original features + applied filters + applied recolors
 * and produce the final display features, gradient_groups, legend, etc.
 */
export function recomputeLayerState(
  originalFeatures: Feature[],
  filters: AppliedFilter[] | undefined,
  recolors: AppliedRecolor[] | undefined,
  layerLegend?: string,
): {
  features: Feature[];
  gradient_groups?: { color: string; legend: string; count: number }[];
  layer_legend: string;
  is_gradient: boolean;
} {
  const filtered = recomputeFeatures(originalFeatures, filters || []);

  if (!recolors || recolors.length === 0) {
    return {
      features: filtered.map((f) => {
        const newF = { ...f, properties: { ...f.properties } } as Feature;
        delete (newF.properties as Record<string, unknown>).gradient_color;
        delete (newF.properties as Record<string, unknown>).gradient_legend;
        return newF;
      }),
      gradient_groups: undefined,
      layer_legend: layerLegend || '',
      is_gradient: false,
    };
  }

  const getCoordKey = (f: Feature) => {
    const coords = f.geometry.coordinates;
    return `${coords[0]},${coords[1]}`;
  };

  const featureStyles = new Map<string, { color: string; legend: string }>();

  for (const recolor of recolors) {
    for (const group of recolor.groups) {
      const isBaseColor =
        group.color.toLowerCase() === recolor.baseColor.toLowerCase();
      const groupFeatures = Array.isArray(group.features) ? group.features : [];

      if (groupFeatures.length === 0) {
        continue;
      }

      for (const f of groupFeatures) {
        const key = getCoordKey(f);
        if (!isBaseColor || !featureStyles.has(key)) {
          featureStyles.set(key, {
            color: group.color,
            legend: group.legend,
          });
        }
      }
    }
  }

  const coloredFeatures = filtered.map((f) => {
    const style = featureStyles.get(getCoordKey(f));
    if (style) {
      return {
        ...f,
        properties: {
          ...f.properties,
          gradient_color: style.color,
          gradient_legend: style.legend,
        },
      } as Feature;
    }
    return f;
  });

  const groupMap = new Map<
    string,
    { color: string; legend: string; count: number }
  >();
  for (const f of coloredFeatures) {
    const color = f.properties.gradient_color as string | undefined;
    const legend = f.properties.gradient_legend as string | undefined;
    if (color && legend) {
      const key = `${color}-${legend}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, { color, legend, count: 0 });
      }
      groupMap.get(key)!.count++;
    }
  }
  const gradient_groups = Array.from(groupMap.values());
  const layer_legend = gradient_groups.map((g) => g.legend).join(' | ');

  return {
    features: coloredFeatures,
    gradient_groups,
    layer_legend,
    is_gradient: true,
  };
}
