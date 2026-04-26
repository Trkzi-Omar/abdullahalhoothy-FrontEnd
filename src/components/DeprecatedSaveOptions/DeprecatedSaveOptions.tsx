import React, { useState } from 'react';
import styles from './DeprecatedSaveOptions.module.css';
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

  const handleSaveLayer = isLayerContextActive
    ? layerContext.handleSaveLayer
    : catalogContext.handleSaveLayer;

  const { saveResponse } = isLayerContextActive ? layerContext : catalogContext;

  function handleOptionChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    setSelectedOption(value);
    setSaveOption(value);
  }

  function handleSaveClick() {
    handleSaveLayer();
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
            <button className={styles.button} onClick={handleSaveClick} disabled={!selectedOption}>{t("save")}</button>
          </div>
        </>
      )}
    </div>
  );
}

export default SaveOptions;
