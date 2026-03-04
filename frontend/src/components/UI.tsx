import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════ */
const bgMap = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
} as const;

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  color?: keyof typeof bgMap;
}

export const StatCard = ({ icon: Icon, label, value, trend, color = 'indigo' }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        {trend && (
          <p className={`mt-1 text-sm font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </p>
        )}
      </div>
      <div className={`${bgMap[color]} rounded-xl p-3 shadow-lg shadow-${color}-200`}>
        <Icon className="text-white" size={22} />
      </div>
    </div>
    {/* decorative blob */}
    <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full ${bgMap[color]} opacity-5`} />
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════
   CARD
   ═══════════════════════════════════════════════════════════ */
interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  noPadding?: boolean;
}

export const Card = ({ title, subtitle, children, className = '', actions, noPadding }: CardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden ${className}`}
  >
    {(title || actions) && (
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={noPadding ? '' : 'p-6'}>{children}</div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════
   BUTTON
   ═══════════════════════════════════════════════════════════ */
type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type Size = 'xs' | 'sm' | 'md' | 'lg';

const variantCls: Record<Variant, string> = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm shadow-indigo-200',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400',
  danger:    'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm shadow-rose-200',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm shadow-emerald-200',
  ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
};

const sizeCls: Record<Size, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: LucideIcon;
  className?: string;
  loading?: boolean;
}

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  icon: Icon,
  className = '',
  loading = false,
}: ButtonProps) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantCls[variant]} ${sizeCls[size]} ${className}`}
  >
    {loading ? (
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : Icon ? (
      <Icon size={size === 'xs' ? 14 : size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />
    ) : null}
    {children}
  </button>
);

/* ═══════════════════════════════════════════════════════════
   BADGE
   ═══════════════════════════════════════════════════════════ */
const badgeCls = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-600/10',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  // aliases for easy mapping
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  gray: 'bg-slate-100 text-slate-700 ring-slate-600/10',
  purple: 'bg-violet-50 text-violet-700 ring-violet-600/20',
} as const;

interface BadgeProps {
  children: ReactNode;
  variant?: keyof typeof badgeCls;
  dot?: boolean;
}

export const Badge = ({ children, variant = 'slate', dot }: BadgeProps) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badgeCls[variant]}`}>
    {dot && <span className={`h-1.5 w-1.5 rounded-full bg-current`} />}
    {children}
  </span>
);

/* ═══════════════════════════════════════════════════════════
   INPUT
   ═══════════════════════════════════════════════════════════ */
interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  icon?: LucideIcon;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  min?: number | string;
  max?: number | string;
}

export const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  required,
  disabled,
  className = '',
  min,
  max,
}: InputProps) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="text-slate-400" size={18} />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border ${
          error ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
        } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-slate-50`}
      />
    </div>
    {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   TEXTAREA
   ═══════════════════════════════════════════════════════════ */
interface TextAreaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  required?: boolean;
}

export const TextArea = ({ label, placeholder, value, onChange, rows = 3, required }: TextAreaProps) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
    )}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
    />
  </div>
);

/* ═══════════════════════════════════════════════════════════
   SELECT
   ═══════════════════════════════════════════════════════════ */
interface SelectProps {
  label?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const Select = ({ label, value, onChange, options, placeholder }: SelectProps) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MODAL
   ═══════════════════════════════════════════════════════════ */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const modalSize = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export const Modal = ({ open, onClose, title, children, size = 'md' }: ModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${modalSize[size]} modal-content`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SPINNER / EMPTY STATE / PAGE HEADER
   ═══════════════════════════════════════════════════════════ */
export const Spinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="relative h-10 w-10">
      <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 animate-spin" />
    </div>
  </div>
);

export const EmptyState = ({ message = 'No data available', icon: Icon }: { message?: string; icon?: LucideIcon }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
    {Icon && <Icon size={48} strokeWidth={1.5} className="mb-3" />}
    <p className="text-base font-medium">{message}</p>
  </div>
);

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
  >
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </motion.div>
);
