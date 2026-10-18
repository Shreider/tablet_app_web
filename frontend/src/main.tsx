import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StationPage } from './pages/StationPage';
import { RoomPage } from './pages/RoomPage';
import { ApiSettingsProvider } from './components/ApiSettings';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiSettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StationPage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ApiSettingsProvider>
  </React.StrictMode>
);
