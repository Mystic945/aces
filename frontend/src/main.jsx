
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import './index.css';
import App from './App.jsx';
import LoginPage from './pages/LoginPage.jsx';

function AppRouter() {
  const [path, setPath] = useState(() => {
    return window.location.hash.replace(/^#/, '') || '/login';
  });

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '/login';
    }

    const handleHashChange = () => {
      const nextPath =
        window.location.hash.replace(/^#/, '').split('?')[0] || '/login';

      setPath(nextPath);
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  if (path === '/login') {
    return <LoginPage />;
  }

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
