import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/Layout';
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
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              }
            />
            <Route
              path="/users"
              element={
                <MainLayout>
                  <UsersPage />
                </MainLayout>
              }
            />
            <Route
              path="/roles"
              element={
                <MainLayout>
                  <RolesPage />
                </MainLayout>
              }
            />
            <Route
              path="/alerts"
              element={
                <MainLayout>
                  <AlertsPage />
                </MainLayout>
              }
            />
            <Route
              path="/logs/login"
              element={
                <MainLayout>
                  <LoginLogsPage />
                </MainLayout>
              }
            />
            <Route
              path="/logs/audit"
              element={
                <MainLayout>
                  <AuditLogsPage />
                </MainLayout>
              }
            />
            <Route
              path="/security"
              element={
                <MainLayout>
                  <SecurityPage />
                </MainLayout>
              }
            />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;