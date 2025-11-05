import React from 'react';
import ReactDOM from 'react-dom/client';
import ApiKeyWrapper from './ApiKeyWrapper';
import './css/styles.css'; // FIX: Import the stylesheet directly to ensure it's bundled and applied.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ApiKeyWrapper />
  </React.StrictMode>
);
