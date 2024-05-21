import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/Signup';
import Root from './components/Root';
import Web from './components/Web';
import App from './App';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      
      // {
      //   path: 'main',
      //   element: <Web />,
      // },
      {
        path: '/',
        element: <Web />,
      },
    ],
  },
  {
    path: 'signin',
    element: <SignIn />,
  },
  {
    path: 'signup',
    element: <SignUp />,
  },
  
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
