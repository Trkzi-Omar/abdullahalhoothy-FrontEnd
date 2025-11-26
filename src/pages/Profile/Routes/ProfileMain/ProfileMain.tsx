import React, { useEffect, useState } from 'react';
import styles from './ProfileMain.module.css';
import {
  FaTimes,
  FaSignOutAlt,
  FaUser,
  FaEnvelope,
  FaDatabase,
  FaLayerGroup,
  FaBook,
  FaTrash,
} from 'react-icons/fa';
import { useNavigate } from 'react-router';
import urls from '../../../../urls.json';
import { useAuth } from '../../../../context/AuthContext';
import apiRequest from '../../../../services/apiRequest';
import { UserProfile, PopupInfo } from '../../../../types/allTypesAndInterfaces';

const ProfileMain: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    user_id: '',
    username: '',
    email: '',
    account_type: '',
    show_price_on_purchase: false,
    maker: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showPrice, setShowPrice] = useState<boolean | undefined>(false);
  const [error, setError] = useState<Error | null>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const { isAuthenticated, authResponse, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    fetchProfile();
  }, [isAuthenticated, authResponse, navigate]);

  useEffect(() => {
    setPhoneInput(profile.phone || '');
  }, [profile.phone]);

  const fetchProfile = async () => {
    if (!authResponse || !('idToken' in authResponse)) {
      setError(new Error('Authentication information is missing.'));
      setIsLoading(false);
      navigate('/auth');
      return;
    }

    try {
      const res = await apiRequest({
        url: urls.user_profile,
        method: 'POST',
        isAuthRequest: true,
        body: { user_id: authResponse.localId },
      });
      setProfile(res.data.data);
      setShowPrice(res.data.data.show_price_on_purchase);
    } catch (err) {
      console.error('Unexpected error:', err);
      logout();
      setError(new Error('An unexpected error occurred. Please try again.'));
      navigate('/auth');
    } finally {
      setIsLoading(false);
    }
  };
  const renderValue = (key: string, value: any): JSX.Element => {
    if (value === null || value === undefined) {
      return <span>N/A</span>;
    }

    if (Array.isArray(value)) {
      return (
        <ul className={styles.nestedList}>
          {value.map((item, index) => (
            <li key={index}>{renderValue(`${key}_${index}`, item)}</li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object') {
      return (
        <div className={styles.nestedObject}>
          {Object.entries(value).map(([nestedKey, nestedValue]) => (
            <div key={nestedKey} className={styles.nestedItem}>
              <span className={styles.nestedLabel}>{nestedKey}:</span>
              {renderValue(nestedKey, nestedValue)}
            </div>
          ))}
        </div>
      );
    }

    return <span>{value.toString()}</span>;
  };

  const handleItemClick = (type: string, name: string, data: any) => {
    setPopupInfo({ type, name, data });
  };

  const renderPopup = () => {
    if (!popupInfo) return null;

    return (
      <div className={styles.popupOverlay}>
        <div className={styles.popup}>
          <button className={styles.closeButton} onClick={() => setPopupInfo(null)}>
            <FaTimes />
          </button>
          <h3>{popupInfo.name}</h3>
          <div className={styles.popupContent}>{renderValue(popupInfo.name, popupInfo.data)}</div>
        </div>
      </div>
    );
  };

  const renderSection = (
    title: string,
    icon: JSX.Element,
    items: Record<string, any>,
    type: string
  ) => {
    // Function to handle delete icon click
    const handleDeleteClick = async (
      type: string,
      key: string,
      value: any
    ) => {
      if (type.includes('layer')) {
        await apiRequest({
          url: urls.delete_layer,
          method: 'DELETE',
          isAuthRequest: true,
          body: { user_id: authResponse?.localId, layer_id: value.layer_id },
        });
      } else if (type.includes('catalog')) {
        await apiRequest({
          url: urls.delete_catalog,
          method: 'DELETE',
          isAuthRequest: true,
          body: { user_id: authResponse?.localId, catalog_id: value.catalog_id },
        });
      }
      fetchProfile();
      console.log('Item details:', { type, key, value });
      // You can add your delete logic here
    };

    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {icon} {title}
        </h3>
        {Object.entries(items).length > 0 ? (
          <ul className={styles.itemList}>
            {Object.entries(items).map(([key, value]) => (
              <li key={key} className={styles.itemName}>
                <span onClick={() => handleItemClick(type, key, value)}>
                  {value.layer_name || value.catalog_name || value.name || key}
                </span>
                {/* Conditionally render the delete icon */}
                {type.includes('layer') || type.includes('catalog') ? (
                  <div className={styles.iconContainer}>
                    <div className={styles.verticalDivider} />
                    <FaTrash
                      className={styles.deleteIcon}
                      onClick={() => handleDeleteClick(type, key, value)} // Pass type here
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No {title.toLowerCase()} available</p>
        )}
      </div>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    setTimeout(() => navigate('/auth'), 500);
    return null;
  }
  if (isLoading) return <div className={styles.loading}>Loading profile...</div>;

  if (error) {
    setTimeout(() => navigate('/auth'), 500);
    return null;
  }

  if (!profile) {
    setTimeout(() => navigate('/auth'), 500);
    return null;
  }

  return (
    <div className="w-full h-full overflow-y-auto lg:px-10 px-4 text-sm">
      <div className="m-5 mx-auto p-5 bg-[#f0f8f0] rounded-lg lg:shadow-md shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="lg:text-2xl text-lg text-[#006400] mb-5 text-center">User Profile</h2>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 h-9 lg:text-lg text-base bg-red-600 text-white rounded cursor-pointer  hover:bg-red-700"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        </div>
        <div className="bg-white p-5 rounded-lg mb-5">
          <div className="flex items-start mb-2">
            <FaUser className="mr-2 text-[#006400]" />
            <span className="font-bold mr-1 min-w-[100px]">Username:</span>
            {profile.username}
          </div>
          <div className="flex items-start mb-2">
            <FaEnvelope className="mr-2 text-[#006400]" />
            <span className="font-bold mr-1 min-w-[100px]">Email:</span>
            {profile.email}
          </div>
          <div className="flex items-start mb-2">
            <span className="font-bold mr-1 min-w-[100px]">Phone:</span>
            <div className="flex items-center flex-1">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Enter phone number"
                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={async () => {
                  if (!authResponse || !('idToken' in authResponse)) {
                    setError(new Error('Authentication information is missing.'));
                    return;
                  }
                  setIsSavingPhone(true);
                  try {
                    await apiRequest({
                      url: urls.update_user_profile,
                      method: 'POST',
                      isAuthRequest: true,
                      body: {
                        user_id: authResponse.localId,
                        phone: phoneInput,
                        username: profile.username,
                        email: profile.email,
                        show_price_on_purchase: profile.show_price_on_purchase,
                      },
                    });
                    setProfile(prev => ({ ...prev, phone: phoneInput }));
                  } catch (error) {
                    console.error('Failed to update phone number:', error);
                    // Revert on error
                    setPhoneInput(profile.phone || '');
                  } finally {
                    setIsSavingPhone(false);
                  }
                }}
                disabled={isSavingPhone || phoneInput === (profile.phone || '')}
                className="ml-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSavingPhone ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <div className="flex items-start mb-2">
            <label className="flex items-center mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={async e => {
                  await setShowPrice(e.target.checked);
                  if (profile.account_type === 'admin') {
                    if (!authResponse || !('idToken' in authResponse)) {
                      setError(new Error('Authentication information is missing.'));
                      setIsLoading(false);
                      navigate('/auth');
                      return;
                    }
                    await apiRequest({
                      url: urls.update_user_profile,
                      method: 'POST',
                      isAuthRequest: true,
                      body: {
                        user_id: authResponse.localId,
                        show_price_on_purchase: e.target.checked,
                        username: profile.username,
                        email: profile.email,
                        phone: profile.phone,
                      },
                    });
                  }
                }}
                disabled={profile.account_type !== 'admin'}
                className={`mr-2 h-4 w-4 border-gray-300 rounded focus:ring-green-600 ${
                  profile.account_type !== 'admin'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'text-green-700'
                }`}
              />
              <span
                className={`text-gray-700 font-medium ${
                  profile.account_type !== 'admin' ? 'text-gray-400' : ''
                }`}
              >
                Show Price
              </span>
            </label>
          </div>
          {profile.maker && Object.keys(profile.maker).length > 0 && (
            <div>
              <h3 className="text-lg text-[#006400] mt-5 mb-2">Maker Information</h3>
              {Object.entries(profile.maker).map(([key, value]) => {
                const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let icon = <FaDatabase />;
                if (key.includes('layer')) icon = <FaLayerGroup />;
                else if (key.includes('catalog')) icon = <FaBook />;
                else if (key.includes('report')) icon = <FaBook />;
                else if (key.includes('intelligence')) icon = <FaDatabase />;
                
                return renderSection(title, icon, value as Record<string, any>, key);
              })}
            </div>
          )}
        </div>
        {renderPopup()}
      </div>
    </div>
  );
};

export default ProfileMain;
