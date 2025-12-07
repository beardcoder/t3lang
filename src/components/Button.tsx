import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  title?: string;
  type?: "button" | "submit";
}

export function Button({
  onClick,
  children,
  icon: Icon,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  title,
  type = "button",
}: ButtonProps) {
  const baseStyles = "font-semibold flex items-center justify-center gap-2 rounded-full transition-all";

  const sizeStyles = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };

  const variantStyles = {
    primary: {
      backgroundColor: "var(--color-accent)",
      color: "white",
    },
    secondary: {
      backgroundColor: "var(--color-bg-tertiary)",
      color: "var(--color-text-primary)",
      border: "1px solid var(--color-border)",
    },
    danger: {
      backgroundColor: "var(--color-danger)",
      color: "white",
    },
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseStyles} ${sizeStyles[size]} ${className}`}
      style={variantStyles[variant]}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {Icon && <Icon size={size === "sm" ? 14 : size === "md" ? 16 : 18} />}
      {children}
    </motion.button>
  );
}
