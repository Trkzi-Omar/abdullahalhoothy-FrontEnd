// src/components/CreateLayer/CreateLayer.tsx

import { useEffect } from 'react';
import { useLayerContext } from '../../context/LayerContext';
import CustomizeLayer from '../CustomizeLayer/CustomizeLayer';
import FetchDatasetForm from '../FetchDatasetForm/FetchDatasetForm';
import { useUIContext } from '../../context/UIContext';

function LayerFormLoader() {
  const { createLayerformStage, resetFormStage } = useLayerContext();

  const { setSidebarMode } = useUIContext();

  // const [createLayerformStage, _] = useState('initial');

  useEffect(() => {
    resetFormStage();
    setSidebarMode('default');
  }, [resetFormStage, setSidebarMode]);

  return (
    <>
      {createLayerformStage ==="initial" && <FetchDatasetForm />}
      {createLayerformStage ==="secondStep" && <CustomizeLayer />}
    </>
  );
}

export default LayerFormLoader;
