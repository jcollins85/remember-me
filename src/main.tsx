
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TagProvider } from './context/TagContext';
import { PeopleProvider } from './context/PeopleContext';
import { VenueProvider } from './context/VenueContext';
import { NotificationProvider } from './context/NotificationContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TagProvider>
      <PeopleProvider>
        <VenueProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </VenueProvider>
      </PeopleProvider>
    </TagProvider>
  </React.StrictMode>
);
