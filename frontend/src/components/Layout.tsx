import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import {
  LayoutDashboard,
  Users,
  Shield,
  AlertTriangle,
  Activity,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Shield, label: 'Roles & Permissions', path: '/roles' },
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-indigo-900 to-indigo-700 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-indigo-600">
          {sidebarOpen ? (
            <>
              <h1 className="text-xl font-bold">Sentrix</h1>
              <button onClick={toggleSidebar} className="p-2 hover:bg-indigo-600 rounded-lg">
                <X size={20} />
              </button>
            </>
          ) : (
            <button onClick={toggleSidebar} className="p-2 hover:bg-indigo-600 rounded-lg mx-auto">
              <Menu size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 mb-1 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-indigo-900 shadow-lg'
                    : 'text-indigo-100 hover:bg-indigo-600'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
                {sidebarOpen && isActive && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-indigo-600 p-4">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-indigo-800 rounded-lg">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <User size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.username}</p>
                  <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-indigo-100 hover:bg-indigo-600 rounded-lg transition-all"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 hover:bg-indigo-600 rounded-lg transition-all mx-auto flex items-center justify-center"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {menuItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-semibold text-gray-900">{user?.full_name || user?.username}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
