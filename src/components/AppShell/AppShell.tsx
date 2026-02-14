import { GoogleOAuthProvider } from '@react-oauth/google';
import { CatalogProvider } from '../../context/CatalogContext';
import { LayerProvider } from '../../context/LayerContext';
import { AuthProvider } from '../../context/AuthContext';
import Layout from '../Layout/Layout';
import { UIProvider } from '../../context/UIContext';
import NavigationSetup from '../NavigationSetup/NavigationSetup';
import { MapProvider } from '../../context/MapContext';
import { ChatProvider } from '../../context/ChatContext';
import { CaseStudyProvider } from '../CaseStudy/CaseStudyPanel';
import { IntelligenceViewportProvider } from '../../context/IntelligenceViewPortContext';
import WhatsAppFloatButton from '../WhatsAppFloatButton/WhatsAppFloatButton';
import { OTPProvider } from '../../context/OTPContext';
import { OTPModal } from '../OTPModal';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const AppShell = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex w-screen h-svh">
        <NavigationSetup>
          <AuthProvider>
            <OTPProvider>
              <MapProvider>
                <IntelligenceViewportProvider>
                  <CatalogProvider>
                    <LayerProvider>
                      <UIProvider>
                        <ChatProvider>
                          <CaseStudyProvider>
                            <Layout />
                            <OTPModal />
                          </CaseStudyProvider>
                        </ChatProvider>
                      </UIProvider>
                    </LayerProvider>
                  </CatalogProvider>
                </IntelligenceViewportProvider>
              </MapProvider>
            </OTPProvider>
          </AuthProvider>
        </NavigationSetup>
        <WhatsAppFloatButton />
      </div>
    </GoogleOAuthProvider>
  );
};

export default AppShell;
