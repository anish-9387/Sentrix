import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Input, Button } from '../components/UI';
import { User, Lock, Fingerprint, ShieldCheck, Activity, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      // toast handled by store
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - decorative */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-slate-900 via-indigo-950 to-violet-950 relative overflow-hidden"
      >
        {/* Background grid */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Glowing orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-600 rounded-full blur-[150px] opacity-20" />

        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-600/30 rounded-2xl backdrop-blur-sm border border-indigo-500/20">
                <Fingerprint size={32} />
              </div>
              <h1 className="text-4xl font-bold">Sentrix</h1>
            </div>
            <p className="text-xl text-indigo-200 mb-12 leading-relaxed max-w-md">
              Enterprise Security & Access Control Platform. Monitor, manage, and protect your organization's digital assets.
            </p>

            {/* Feature cards */}
            <div className="space-y-4">
              {[
                { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Fine-grained permission control' },
                { icon: Activity, title: 'Real-time Monitoring', desc: 'Track all authentication events' },
                { icon: Lock, title: 'IP Threat Protection', desc: 'Auto-block suspicious activity' },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <f.icon size={20} className="text-indigo-300" />
                  </div>
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="text-sm text-slate-400">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right - login form */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center p-8 bg-slate-50"
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
              <Fingerprint size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Sentrix</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={User}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-slate-100 rounded-xl">
            <p className="text-xs text-slate-500 text-center">
              Demo: <span className="font-mono text-slate-700">admin</span> / <span className="font-mono text-slate-700">Admin@123</span>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">&copy; 2026 Sentrix. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
};
