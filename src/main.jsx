import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

const root = document.getElementById('root');
console.log('Root element:', root); // Debug log

const reactRoot = createRoot(root);
console.log('React root created'); // Debug log

reactRoot.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log('Render called'); // Debug log

