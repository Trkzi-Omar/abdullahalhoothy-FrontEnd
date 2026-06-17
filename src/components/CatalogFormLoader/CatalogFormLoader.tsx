import { useEffect, useRef } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import CatalogMenu from '../CatalogMenu/CatalogMenu';
import CatalogDetailsForm from '../CatalogDetailsForm/CatalogDetailsForm';
import { useUIContext } from '../../context/UIContext';

const CatalogFormLoader = () => {
  const { formStage, resetFormStage } = useCatalogContext();

  const { setSidebarMode } = useUIContext();

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      resetFormStage('catalog');
      setSidebarMode('catalog');
    }
  });

  return (
    <>
      {formStage ==="catalog" && <CatalogMenu />}

      {formStage ==="catalogDetails" && <CatalogDetailsForm />}
    </>
  );
};

export default CatalogFormLoader;
