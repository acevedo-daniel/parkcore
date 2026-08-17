import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from './app/providers.js';
import { router } from './app/router.js';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) throw new Error('Missing root element.');

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders router={router} />
  </StrictMode>,
);
