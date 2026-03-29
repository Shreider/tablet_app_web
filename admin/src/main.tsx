import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './admin/auth/AdminAuthContext';
import { AdminLayout } from './admin/components/AdminLayout';
import { AdminProtectedRoute } from './admin/components/AdminProtectedRoute';
import { AdminCatalogPage } from './admin/pages/AdminCatalogPage';
import { AdminDashboardPage } from './admin/pages/AdminDashboardPage';
import { AdminLoginPage } from './admin/pages/AdminLoginPage';
import { AdminRoomsPage } from './admin/pages/AdminRoomsPage';
import { AdminScheduleEntriesPage } from './admin/pages/AdminScheduleEntriesPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AdminLoginPage />} />
          <Route element={<AdminProtectedRoute />}>
            <Route path="/" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="rooms" element={<AdminRoomsPage />} />
              <Route path="schedule-entries" element={<AdminScheduleEntriesPage />} />
              <Route path="locations/:entity" element={<AdminCatalogPage section="locations" />} />
              <Route path="teaching/:entity" element={<AdminCatalogPage section="teaching" />} />
              <Route index element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  </React.StrictMode>
);
