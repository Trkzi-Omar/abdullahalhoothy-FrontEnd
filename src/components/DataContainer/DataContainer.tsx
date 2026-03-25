import { useState, useEffect } from 'react';
import CatalogueCard from '../CatalogueCard/CatalogueCard';
import urls from '../../urls.json';
import { Catalog, UserLayer, CardItem } from '../../types/allTypesAndInterfaces';
import { useCatalogContext } from '../../context/CatalogContext';
import UserLayerCard from '../UserLayerCard/UserLayerCard';
import { isValidColor } from '../../utils/helperFunctions';
import { useAuth } from '../../context/AuthContext';
import { useUIContext } from '../../context/UIContext';
import apiRequest from '../../services/apiRequest';
import { useLayerContext } from '../../context/LayerContext';
import CampaignPage from '../../pages/Campaign/campaign_home';
import { Spinner } from '../common';

function DataContainer() {
  const {
    selectedContainerType,
    handleAddClick,
    setGeoPoints,
    isLoading,
  } = useCatalogContext();
  const { setSelectedCity, setSelectedCountry } = useLayerContext();
  const { authResponse } = useAuth();
  const { closeModal } = useUIContext();
  const [activeTab, setActiveTab] = useState('Data Catalogue');
  const [resData, setResData] = useState<(Catalog | UserLayer)[] | string>('');
  // layers data that will be sat after user clicks Add Layer
  const [userLayersData, setUserLayersData] = useState<UserLayer[]>([]);
  const [userCatalogsData, setUserCatalogsData] = useState<Catalog[]>([]);
  const [, setResMessage] = useState<string>('');
  const [, setResId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const [, setWsResMessage] = useState<string>('');
  const [, setWsResId] = useState<string>('');
  const [, setWsResLoading] = useState<boolean>(false);
  const [, setWsResError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUserLayers() {
      setLoading(true);

      const body = { user_id: authResponse?.localId };
      try {
        const res = await apiRequest({
          url: urls.user_layers,
          method: 'post',
          isAuthRequest: true,
          body: body,
        });
        setUserLayersData(res.data.data);
        setResMessage(res.data.message);
        setResId(res.data.request_id);
      } catch (error) {
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    }

    async function fetchUserCatalogs() {
      setLoading(true);

      const body = { user_id: authResponse?.localId };
      try {
        const res = await apiRequest({
          url: urls.user_catalogs,
          method: 'post',
          isAuthRequest: true,
          body: body,
        });
        setUserCatalogsData(res.data.data);
        setResMessage(res.data.message);
        setResId(res.data.request_id);
      } catch (error) {
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    }

    // Determine which data to fetch based on selected container type
    async function fetchData() {
      setLoading(true);
      setError(null);

      if (selectedContainerType === 'Layer') {
        await fetchUserLayers();
      } else if (selectedContainerType === 'Catalogue') {
        await fetchUserCatalogs();
      }

      setLoading(false);
    }

    fetchData();
  }, [selectedContainerType, authResponse]);

  useEffect(
    function () {
      // Select the data shown in the modal based on the current mode.
      if (selectedContainerType === 'Catalogue') {
        if (JSON.stringify(resData) !== JSON.stringify(userCatalogsData)) {
          setResData(userCatalogsData);
        }
      } else if (selectedContainerType === 'Layer') {
        if (JSON.stringify(resData) !== JSON.stringify(userLayersData)) {
          setResData(userLayersData);
        }
      } else if (selectedContainerType === 'Home') {
        if (resData !== '') {
          setResData('');
        }
      }
    },
    [userLayersData, userCatalogsData, selectedContainerType, resData]
  );

  // Handle click event on catalog card
  async function handleCatalogCardClick(selectedItem: CardItem) {
    if (selectedContainerType === 'Home') {
      setWsResLoading(true);

      try {
        const res = await apiRequest({
          url: urls.http_catlog_data,
          method: 'post',
          body: { catalogue_dataset_id: selectedItem.id },
        });
        setGeoPoints(res.data.data);
        setWsResMessage(res.data.message);
        setWsResId(res.data.request_id);
        setWsResLoading(false);
        closeModal();
        console.log('res', res);
      } catch (error) {
        setWsResError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        console.log('finally.....................');
      }
    } else {
      // layer or catalog
      // we are here
      await handleAddClick(
        selectedItem.id,
        selectedItem.typeOfCard,
        (country: string, city: string) => {
          setSelectedCountry(country);
          setSelectedCity(city);
        }
      );
    }

    closeModal();
  }

  // Render a card based on the item type
  function makeCard(item: Catalog | UserLayer, index: number) {
    if ('layer_id' in item) {
      // Render UserLayerCard if item is a user layer
      return (
        <UserLayerCard
          key={item.layer_id + '-' + index} // Use a combination of id and index
          id={item.layer_id}
          name={item.layer_name}
          description={item.layer_description}
          legend={item.layer_legend}
          typeOfCard="layer"
          points_color={item.points_color}
          progress={item.progress}
          onMoreInfo={function () {
            handleCatalogCardClick({
              id: item.layer_id,
              name: item.layer_name,
              typeOfCard: 'layer',
              points_color: isValidColor(item.points_color as string)
                ? item.points_color
                : undefined,
              legend: item.layer_legend,
            });
          }}
        />
      );
    } else {
      // Render CatalogueCard if item is a catalog
      const typeOfCard = 'catalog_name' in item ? 'userCatalog' : 'catalog';
      return (
        <CatalogueCard
          key={(item.id || item.catalog_id || '') + '-' + index}
          id={item.id || item.catalog_id || ''}
          thumbnail_url={item.thumbnail_url || item.image || ''}
          name={item.name || item.catalog_name || ''}
          records_number={item.records_number || item.total_records || 0}
          description={item.description || item.catalog_description || ''}
          onMoreInfo={function () {
            handleCatalogCardClick({
              id: item.id || item.catalog_id || '',
              name: item.name || item.catalog_name || '',
              typeOfCard: typeOfCard,
              ...(typeOfCard === 'userCatalog' && { layers: item.layers }),
            });
          }}
          can_access={item.can_access ?? false}
          typeOfCard={typeOfCard}
        />
      );
    }
  }

  // Render cards based on filtered data
  function renderCards() {
    if (typeof resData === 'string') {
      return <div>{resData}</div>;
    }

    if (Array.isArray(resData)) {
      return resData.map(function (item, index) {
        return makeCard(item, index);
      });
    }

    return null;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (loading) {
    return <Spinner className="size-32 " />;
  }

  return (
    <div className={`lg:p-6 h-full ${selectedContainerType === 'Home' ? 'px-2 py-1' : 'p-2'}`}>
      {/* when add layer or category */}
      {isLoading && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-30 z-50">
          <Spinner className="size-32 border-white border-4" />
        </div>
      )}

      <h2 className="text-2xl text-center font-semibold">
        {selectedContainerType === 'Catalogue'
          ? 'Add Data to Map'
          : selectedContainerType === 'Home'
            ? ''
            : 'Add Layers to Map'}
      </h2>
      {selectedContainerType === 'Home' ? (
        <>
          <CampaignPage />
        </>
      ) : (
        <>
          <div className="flex flex-wrap lg:gap-0 gap-2 w-full justify-center items-center my-4 rounded-xl font-semibold">
            <button
              className={`${
                (activeTab === 'Data Catalogue' && selectedContainerType === 'Catalogue') ||
                (activeTab === 'Data Layer' && selectedContainerType === 'Layer')
                  ? 'bg-white text-[#333] border-2 border-[#f5f5f5] font-bold text-base py-[10px] px-5'
                  : 'bg-[#f5f5f5] border-none py-[10px] px-[20px] cursor-pointer text-base text-[#333] transition-colors duration-300 hover:bg-[#e6e6e6]'
              } text-nowrap flex-1`}
              onClick={function () {
                setActiveTab(
                  selectedContainerType === 'Catalogue' ? 'Data Catalogue' : 'Data Layer'
                );
              }}
            >
              {selectedContainerType === 'Catalogue' ? 'Data Catalogue' : 'Data Layer'}
            </button>
            <button
              className={`${
                activeTab === 'Load Files'
                  ? 'bg-white text-[#333] border-2 border-[#f5f5f5] font-bold text-base py-[10px] px-5'
                  : 'bg-[#f5f5f5] border-none py-[10px] px-[20px] cursor-pointer text-base text-[#333] transition-colors duration-300 hover:bg-[#e6e6e6]'
              } text-nowrap flex-1`}
              onClick={function () {
                setActiveTab('Load Files');
              }}
            >
              Load Files
            </button>
            <button
              className={`${
                activeTab === 'Connect Your Data'
                  ? 'bg-white text-[#333] border-2 border-[#f5f5f5] font-bold text-base py-[10px] px-5'
                  : 'bg-[#f5f5f5] border-none py-[10px] px-[20px] cursor-pointer text-base text-[#333] transition-colors duration-300 hover:bg-[#e6e6e6]'
              } text-nowrap flex-1`}
              onClick={function () {
                setActiveTab('Connect Your Data');
              }}
            >
              Connect Your Data
            </button>
          </div>
          {activeTab === 'Data Catalogue' || activeTab === 'Data Layer' ? (
            <div className="w-full pb-10">
              {selectedContainerType === 'Catalogue' && activeTab === 'Data Catalogue' && (
                <div className="mb-6 p-4 rounded-xl bg-[#f0f7ff] border border-[#c5d9f1] text-[#1a365d]">
                  <p className="font-semibold mb-2">Build your own data catalogue</p>
                  <p className="text-sm leading-relaxed">
                    Create a catalogue by adding multiple <strong>layers</strong> from the Layers
                    section and saving them together. You can combine layers with <strong>pins</strong>{' '}
                    and <strong>drawings</strong> on the map to organize your data the way you want.
                    Once saved, your layers and annotations become a reusable catalogue you can add to
                    the map anytime.
                  </p>
                </div>
              )}
              <div
                className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 md:gap-x-2 gap-y-10 w-full"
                // overflow-y-auto
              >
                {renderCards()}
              </div>
              {selectedContainerType === 'Catalogue' &&
                activeTab === 'Data Catalogue' &&
                Array.isArray(resData) &&
                resData.length === 0 && (
                  <div className="mt-6 rounded-xl border border-dashed border-[#c5d9f1] bg-[#f8fbff] p-6 text-center text-[#1a365d]">
                    No saved catalogues yet. Build one by adding layers to the map and saving
                    them as a catalogue.
                  </div>
                )}
            </div>
          ) : activeTab === 'Load Files' ? (
            <div className="text-center p-8 text-[1.2rem] text-[#666]">Load Files Content</div>
          ) : (
            <div className="text-center p-8 text-[1.2rem] text-[#666]">
              Connect Your Data Content
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DataContainer;
