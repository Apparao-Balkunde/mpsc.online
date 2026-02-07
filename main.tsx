import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Root Element शोधणे
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Root element (id='root') सापडला नाही. कृपया index.html तपासा.");
}

// React 18/19 पद्धतीने रेंडरिंग
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
