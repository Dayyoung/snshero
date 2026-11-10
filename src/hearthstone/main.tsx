import React from 'react';
import ReactDOM from 'react-dom/client';
import './hearthstone.css';
import { HearthstoneApp } from './HearthstoneApp';

const rootEl = document.getElementById('hs-root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <HearthstoneApp />
    </React.StrictMode>,
  );
}
