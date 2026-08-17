import { createBrowserRouter } from 'react-router';

import { HomeRoute } from '../routes/home-route.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRoute />,
  },
]);
