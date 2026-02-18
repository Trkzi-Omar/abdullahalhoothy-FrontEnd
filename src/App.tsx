import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

const Landing = lazy(() => import('./pages/Landing/Landing'));
const AppShell = lazy(() => import('./components/AppShell/AppShell'));

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
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
