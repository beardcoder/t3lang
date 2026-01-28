import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  title?: string;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

export function Button({
  onClick,
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  title,
  type = 'button',
  fullWidth = false,
}: ButtonProps) {
  const baseStyles = `
    font-medium flex items-center justify-center gap-2 rounded-lg
    transition-all duration-200 border relative overflow-hidden
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: `
      bg-[var(--color-accent)] text-white border-[var(--color-accent)]
      hover:bg-[var(--color-accent-hover)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]
      active:scale-[0.98]
    `,
    secondary: `
      bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]
      border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]
      hover:border-[var(--color-border-strong)]
    `,
    danger: `
      bg-[var(--color-danger)] text-white border-[var(--color-danger)]
      hover:bg-[var(--color-danger-hover)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]
      active:scale-[0.98]
    `,
    success: `
      bg-[var(--color-success)] text-white border-[var(--color-success)]
      hover:bg-[var(--color-success-hover)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent text-[var(--color-text-secondary)] border-transparent
      hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]
    `,
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      whileHover={disabled ? {} : { scale: variant === 'ghost' ? 1 : 1.01 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />}
      {children}
    </motion.button>
  );
}
