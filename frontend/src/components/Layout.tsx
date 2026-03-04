import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  AlertTriangle,
  Activity,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Fingerprint,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { securityService } from '../services/securityService';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: ShieldCheck, label: 'Roles & Permissions', path: '/roles' },
  { icon: AlertTriangle, label: 'Security Alerts', path: '/alerts' },
  { icon: Activity, label: 'Login Logs', path: '/logs/login' },
  { icon: FileText, label: 'Audit Logs', path: '/logs/audit' },
  { icon: Settings, label: 'Security Settings', path: '/security' },
];

export const MainLayout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  // Fetch unresolved alerts count for badge
  const { data: unresolvedData } = useQuery({
    queryKey: ['unresolved-alerts-count'],
    queryFn: () => securityService.getUnresolvedAlerts(),
    refetchInterval: 30000,
  });
  const unresolvedCount = unresolvedData?.data?.length || 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentPage = navItems.find((i) => i.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* ───── Sidebar ───── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 76 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative flex flex-col bg-slate-900 text-white overflow-hidden flex-shrink-0"
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-4 border-b border-slate-800 gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 flex-shrink-0">
            <Fingerprint size={20} />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-bold whitespace-nowrap overflow-hidden"
              >
                Sentrix
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={toggleSidebar}
            className="ml-auto p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {sidebarOpen && active && <ChevronRight size={16} className="ml-auto opacity-60" />}
                {/* Alert badge on Security Alerts */}
                {item.path === '/alerts' && unresolvedCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1.5">
                    {unresolvedCount > 99 ? '99+' : unresolvedCount}
                  </span>
                )}
                {/* Collapsed tooltip */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 hidden group-hover:flex items-center z-50">
                    <div className="bg-slate-900 text-white text-xs font-medium py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User panel */}
        <div className="border-t border-slate-800 p-3">
          <AnimatePresence>
            {sidebarOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-xl">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {(user?.fullName || user?.username)?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">{user?.fullName || user?.username}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Logout</span>
                </button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut size={18} className="text-slate-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* ───── Main ───── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{currentPage}</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <Link
              to="/alerts"
              className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
            >
              <Bell size={20} />
              {unresolvedCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse-dot" />
              )}
            </Link>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{user?.fullName || user?.username}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white">
              {(user?.fullName || user?.username)?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content with framer-motion page transition */}
        <main className="flex-1 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
