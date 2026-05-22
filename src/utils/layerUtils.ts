import intelligenceCategories from '../intelligenceCategories.json';
import { IntelligentLayerCandidate } from '../types';

/**
 * Checks if a layer is intelligent based on its properties
 * @param featureCollection - The layer to check
 * @returns True if the layer is intelligent, false otherwise
 */
export function isIntelligentLayer(featureCollection: IntelligentLayerCandidate) {
  // Check explicit is_intelligent flag first
  if (featureCollection.is_intelligent !== undefined) {
    return !!featureCollection.is_intelligent;
  }

  if (typeof featureCollection.bknd_dataset_id === 'string') {
    // Split the ID by underscores and check if any part matches intelligence categories
    const parts = featureCollection.bknd_dataset_id.split('_');
    return parts.some((part: string) => intelligenceCategories.includes(part));
  }

  return false;
}
