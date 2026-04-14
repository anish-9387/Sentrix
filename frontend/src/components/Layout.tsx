import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
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
  type LucideIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { securityService } from '../services/securityService';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  requiredAnyPermission?: string[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Users', path: '/users', requiredAnyPermission: ['user.read'] },
  { icon: ShieldCheck, label: 'Roles & Permissions', path: '/roles', requiredAnyPermission: ['role.read'] },
  { icon: AlertTriangle, label: 'Security Alerts', path: '/alerts', requiredAnyPermission: ['alerts.read', 'alerts.manage'] },
  { icon: Activity, label: 'Login Logs', path: '/login-logs', requiredAnyPermission: ['logs.read'] },
  { icon: FileText, label: 'Audit Logs', path: '/audit-logs', requiredAnyPermission: ['audit.read'] },
  { icon: Settings, label: 'Security Settings', path: '/security', requiredAnyPermission: ['ip.view', 'ip.block', 'ip.unblock', 'system.config'] },
];

const MOBILE_BREAKPOINT = 1024;

const normalizePermissions = (permissions?: string[]) =>
  (permissions || []).map((p) => p.toLowerCase().trim()).filter(Boolean);

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  const userPermissions = useMemo(() => normalizePermissions(user?.permissions), [user?.permissions]);
  const hasPermissionData = Array.isArray(user?.permissions);

  const canReadAlerts =
    !hasPermissionData ||
    userPermissions.includes('alerts.read') ||
    userPermissions.includes('alerts.manage');

  const visibleNavItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (item.path === '/dashboard') return true;
        if (!item.requiredAnyPermission?.length) return true;
        if (!hasPermissionData) return true;
        return item.requiredAnyPermission.some((perm) => userPermissions.includes(perm));
      }),
    [hasPermissionData, userPermissions],
  );

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, isMobile]);

  // Fetch unresolved alerts count for badge
  const { data: unresolvedData } = useQuery({
    queryKey: ['unresolved-alerts-count'],
    queryFn: () => securityService.getUnresolvedAlerts(),
    refetchInterval: 30000,
    enabled: canReadAlerts,
  });

  const unresolvedCount = Array.isArray(unresolvedData?.data) ? unresolvedData.data.length : 0;

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const currentPage =
    visibleNavItems.find((i) => i.path === location.pathname)?.label ||
    navItems.find((i) => i.path === location.pathname)?.label ||
    'Dashboard';

  const userName = user?.fullName || user?.username || 'User';

  const renderNavLink = (item: NavItem, mobile = false) => {
    const Icon = item.icon;
    const active = location.pathname === item.path;

    if (mobile) {
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setMobileMenuOpen(false)}
          className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
            active
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Icon size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
          {active && <ChevronRight size={16} className="ml-auto opacity-60" />}
          {item.path === '/alerts' && unresolvedCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1.5">
              {unresolvedCount > 99 ? '99+' : unresolvedCount}
            </span>
          )}
        </Link>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`group relative flex items-center rounded-xl px-3 py-2.5 transition-all duration-150 ${
          active
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        } justify-center lg:group-hover/sidebar:justify-start`}
      >
        <Icon size={20} className="flex-shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-150 lg:group-hover/sidebar:ml-3 lg:group-hover/sidebar:max-w-[13rem] lg:group-hover/sidebar:opacity-100">
          {item.label}
        </span>
        <ChevronRight
          size={16}
          className={`ml-auto hidden opacity-60 lg:group-hover/sidebar:block ${
            active ? 'text-white' : 'text-slate-400'
          }`}
        />

        {item.path === '/alerts' && unresolvedCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1.5">
            {unresolvedCount > 99 ? '99+' : unresolvedCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-slate-50">
      {/* Desktop Sidebar: icon-only by default, expands on hover */}
      <aside className="group/sidebar hidden lg:flex lg:w-20 lg:hover:w-72 transition-[width] duration-300 ease-out flex-col overflow-hidden border-r border-slate-800 bg-slate-900 text-white">
        <div className="h-16 flex items-center border-b border-slate-800 px-4 gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600">
            <Fingerprint size={20} />
          </div>
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-lg font-bold opacity-0 transition-all duration-200 lg:group-hover/sidebar:max-w-[10rem] lg:group-hover/sidebar:opacity-100">
            Sentrix
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {visibleNavItems.map((item) => renderNavLink(item))}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center rounded-xl bg-slate-800 px-3 py-2 justify-center lg:group-hover/sidebar:justify-start">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {userName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="max-w-0 overflow-hidden opacity-0 transition-all duration-200 lg:group-hover/sidebar:ml-3 lg:group-hover/sidebar:max-w-[11rem] lg:group-hover/sidebar:opacity-100">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer justify-center lg:group-hover/sidebar:justify-start"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm opacity-0 transition-all duration-200 lg:group-hover/sidebar:ml-3 lg:group-hover/sidebar:max-w-[8rem] lg:group-hover/sidebar:opacity-100">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/55 lg:hidden"
              aria-label="Close navigation menu"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-slate-800 bg-slate-900 text-white lg:hidden"
            >
              <div className="h-16 flex items-center border-b border-slate-800 px-4 gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600">
                  <Fingerprint size={20} />
                </div>
                <span className="text-lg font-bold">Sentrix</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="ml-auto p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
                {visibleNavItems.map((item) => renderNavLink(item, true))}
              </nav>

              <div className="border-t border-slate-800 p-3 space-y-2">
                <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white">
                    {userName[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{userName}</p>
                    <p className="truncate text-xs text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        <header className="h-16 flex-shrink-0 border-b border-slate-100 bg-white px-4 sm:px-6 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h2 className="truncate text-base sm:text-lg font-semibold text-slate-900">{currentPage}</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {canReadAlerts && (
              <Link
                to="/alerts"
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
              >
                <Bell size={20} />
                {unresolvedCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse-dot" />
                )}
              </Link>
            )}

            <div className="hidden sm:block h-8 w-px bg-slate-200" />

            <div className="hidden md:block text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{userName}</span>
            </div>

            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white">
              {userName[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="min-h-full p-4 sm:p-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
