import React, { useState } from 'react';
import styles from './SaveOptions.module.css';
import { useLayerContext } from '../../context/LayerContext';
import { useCatalogContext } from '../../context/CatalogContext';
import SavedIconFeedback from '../SavedIconFeedback/SavedIconFeedback';
import { t } from '../../i18n';


function SaveOptions() {
  const [selectedOption, setSelectedOption] = useState('');
  const layerContext = useLayerContext();
  const catalogContext = useCatalogContext();

  const isLayerContextActive = layerContext.createLayerformStage === 'thirdStep';

  const setSaveOption = isLayerContextActive
    ? layerContext.setSaveOption
    : catalogContext.setSaveMethod;

  const { saveResponse } = isLayerContextActive ? layerContext : catalogContext;

  function handleOptionChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    setSelectedOption(value);
    setSaveOption(value);
  }

  function handleSaveClick() {
    if (isLayerContextActive) {
      void (layerContext.handleSaveLayer as (layerData?: unknown) => Promise<unknown>)();
      return;
    }

    const existingNames = new Set(
      catalogContext.geoPoints
        .filter(point => !point.isTemporary)
        .map(point => point.layer_name || point.layer_legend || '')
    );
    const layersToSave = catalogContext.geoPoints
      .filter(point => !point.isTemporary)
      .map(point => {
        const hasCustomizations =
          (point.applied_filters && point.applied_filters.length > 0) ||
          (point.applied_recolors && point.applied_recolors.length > 0);
        const originalName = point.layer_name || point.layer_legend || 'Layer';
        const baseName =
          hasCustomizations &&
          !originalName.startsWith('customised') &&
          !originalName.startsWith('customized')
          ? `customised ${originalName}`
          : originalName;
        // Resolve duplicate names
        let name = baseName;
        if (existingNames.has(name)) {
          const suffix = point.applied_filters?.[0]?.name || point.applied_recolors?.[0]?.name || 'custom';
          name = `${baseName} (${suffix})`;
        }
        // Add the new name to the set to avoid further collisions within this batch
        existingNames.add(name);
        return {
          name,
          legend: point.layer_legend || point.layer_name || 'Layer',
          description: point.layer_description || '',
          color: point.points_color || '#000000',
          layerId: Number(point.layerId ?? point.layer_id ?? 0),
          bknd_dataset_id: point.bknd_dataset_id || point.layer_id || '',
          createNewLayer: true,
          applied_filters: point.applied_filters || [],
          applied_recolors: point.applied_recolors || [],
        };
      });

    void layerContext.handleSaveLayer({ layers: layersToSave });
    // !isLayerContextActive && setSidebarMode('catalog')

    // layerContext.resetFormStage();
  }

  return (
    <div className={styles.container}>
      {saveResponse ? (
        <SavedIconFeedback />
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-8">{t("select-your-preferred-saving-option")}</h2>
          <div className="flex justify-start items-start w-full mb-4">
            <label className={styles.optionLabel + 'flex justify-center items-center'}>
              <input
                type="radio"
                value="Save sample on s-loc"
                checked={selectedOption === 'Save sample on s-loc'}
                onChange={handleOptionChange}
                className={styles.radioButton}
              />
              <span className={styles.optionText}>{t("save-sample-on-s-loc")}</span>
            </label>
          </div>
          <div className="flex justify-start items-start w-full mb-4">
            <label className={styles.optionLabel + 'flex justify-center items-center'}>
              <input
                type="radio"
                value="Save full on s-loc. We create storage account for you, you still own the data"
                checked={
                  selectedOption ===
                  'Save full on s-loc. We create storage account for you, you still own the data'
                }
                onChange={handleOptionChange}
                className={styles.radioButton}
              />
              <span className={styles.optionText}>{t("save-full-on-s-loc-we-create-storage-account-for-you-you-still-own-the-data")}</span>
            </label>
          </div>
          <div className="flex justify-start items-start w-full mb-4">
            <label className={styles.optionLabel + 'flex justify-center items-center'}>
              <input
                type="radio"
                value="Save sample on your DB"
                checked={selectedOption === 'Save sample on your DB'}
                onChange={handleOptionChange}
                className={styles.radioButton}
              />
              <span className={styles.optionText}>{t("save-sample-on-your-db")}</span>
            </label>
          </div>
          <div className="flex justify-start items-start w-full mb-4">
            <label className={styles.optionLabel + 'flex justify-center items-center'}>
              <input
                type="radio"
                value="Save full on your DB"
                checked={selectedOption === 'Save full on your DB'}
                onChange={handleOptionChange}
                className={styles.radioButton}
              />
              <span className={styles.optionText}>{t("save-full-on-your-db")}</span>
            </label>
          </div>
          <div className={styles.buttonContainer}>
            <button className={styles.button} onClick={handleSaveClick}>{t("save")}</button>
          </div>
        </>
      )}
    </div>
  );
}

export default SaveOptions;
