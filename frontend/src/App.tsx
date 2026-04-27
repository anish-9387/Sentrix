import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { MainLayout } from './components/Layout';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { AlertsPage } from './pages/AlertsPage';
import { LoginLogsPage } from './pages/LoginLogsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SecurityPage } from './pages/SecurityPage';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) return false;
        return failureCount < 1;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected with layout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/login-logs" element={<LoginLogsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/security" element={<SecurityPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '16px',
            background: '#1e293b',
            color: '#f1f5f9',
            fontSize: '14px',
            padding: '12px 16px',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
