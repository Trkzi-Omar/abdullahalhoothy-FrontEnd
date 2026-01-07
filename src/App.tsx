import { BrowserRouter } from 'react-router-dom';
import { CatalogProvider } from './context/CatalogContext';
import { LayerProvider } from './context/LayerContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import { UIProvider } from './context/UIContext';
import NavigationSetup from './components/NavigationSetup/NavigationSetup';
import { MapProvider } from './context/MapContext';
import { Toaster } from 'sonner';
import { ChatProvider } from './context/ChatContext';
import { CaseStudyProvider } from './components/CaseStudy/CaseStudyPanel';
import { IntelligenceViewportProvider } from './context/IntelligenceViewPortContext';
import WhatsAppFloatButton from './components/WhatsAppFloatButton/WhatsAppFloatButton';
import { OTPProvider } from './context/OTPContext';
import { OTPModal } from './components/OTPModal';

function App() {
  return (
    <div className="flex w-screen h-svh">
      <BrowserRouter>
        <Toaster position="top-right" richColors />
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
      </BrowserRouter>
    </div>
  );
}

export default App;