import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import i18next, { getLanguageDirection } from './i18n';

const Landing = lazy(() => import('./pages/Landing/Landing'));
const AppShell = lazy(() => import('./components/AppShell/AppShell'));

function AppToaster() {
  const [direction, setDirection] = useState(getLanguageDirection(i18next.language));

  useEffect(() => {
    const handleLanguageChange = (language: string) => {
      setDirection(getLanguageDirection(language));
    };

    i18next.on('languageChanged', handleLanguageChange);
    return () => {
      i18next.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return <Toaster position={direction === 'rtl' ? 'top-left' : 'top-right'} richColors />;
}

function App() {
  return (
    <BrowserRouter>
      <AppToaster />
      <Suspense fallback={<div className="flex w-screen h-svh" />}>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
