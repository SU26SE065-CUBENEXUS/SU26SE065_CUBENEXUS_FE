import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

const variantClass = {
  primary: 'bg-[#eab308] hover:bg-[#ca8a04] text-black font-bold shadow-sm hover:shadow-md',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-medium',
  outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm',
};

const sizeClass = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-2.5 text-sm rounded-xl gap-2',
};

export function AppButton({
  variant = 'outline',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}: AppButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="h-4 w-4 flex-shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="h-4 w-4 flex-shrink-0" />}
    </button>
  );
}
