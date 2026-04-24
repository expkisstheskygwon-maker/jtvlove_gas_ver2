
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

import FeedApp from './FeedApp';

import { HashRouter as Router } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 도메인을 통한 피드 앱 완전 분리 (예: ccafeed.com, feed.jtvstar.com 등)
const isFeedDomain = window.location.hostname.includes('feed');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <Router>
          {isFeedDomain ? <FeedApp /> : <App />}
        </Router>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
