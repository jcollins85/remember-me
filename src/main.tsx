
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TagProvider } from './context/TagContext';
import { PeopleProvider } from './context/PeopleContext';
import { VenueProvider } from './context/VenueContext';
import { NotificationProvider } from './context/NotificationContext';
import './index.css';
import { ThemeProvider } from './theme/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <TagProvider>
          <PeopleProvider>
            <VenueProvider>
              <App />
            </VenueProvider>
          </PeopleProvider>
        </TagProvider>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>
);
