import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Pega o elemento root do HTML
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);

  root.render(
    <App />
  );

} else {
  console.error('Elemento root não encontrado no HTML.');
}