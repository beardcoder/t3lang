import ReactSelect, { StylesConfig, components, DropdownIndicatorProps } from "react-select";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

const DropdownIndicator = (props: DropdownIndicatorProps<Option>) => {
  return (
    <components.DropdownIndicator {...props}>
      <motion.div
        animate={{ rotate: props.selectProps.menuIsOpen ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <ChevronDown size={16} />
      </motion.div>
    </components.DropdownIndicator>
  );
};

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}: SelectProps) {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const customStyles: StylesConfig<Option> = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "var(--color-bg-hover)",
      borderColor: state.isFocused
        ? "var(--color-accent)"
        : "transparent",
      borderWidth: "2px",
      borderRadius: "8px",
      padding: "2px 4px",
      boxShadow: state.isFocused
        ? "0 0 0 3px rgba(30, 215, 96, 0.1)"
        : "none",
      cursor: "pointer",
      transition: "all 0.2s ease",
      minHeight: "36px",
      "&:hover": {
        borderColor: state.isFocused
          ? "var(--color-accent)"
          : "var(--color-border)",
        backgroundColor: "var(--color-bg-tertiary)",
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--color-text-primary)",
      fontSize: "0.75rem",
      fontWeight: 500,
    }),
    placeholder: (base) => ({
      ...base,
      color: "var(--color-text-secondary)",
      fontSize: "0.75rem",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-tertiary)",
      borderRadius: "12px",
      border: "1px solid var(--color-border)",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
      overflow: "hidden",
      marginTop: "4px",
      zIndex: 100,
    }),
    menuList: (base) => ({
      ...base,
      padding: "4px",
      maxHeight: "200px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "var(--color-accent)"
        : state.isFocused
        ? "var(--color-bg-hover)"
        : "transparent",
      color: state.isSelected
        ? "white"
        : "var(--color-text-primary)",
      cursor: "pointer",
      fontSize: "0.75rem",
      fontWeight: state.isSelected ? 600 : 500,
      padding: "8px 12px",
      borderRadius: "8px",
      transition: "all 0.15s ease",
      "&:active": {
        backgroundColor: "var(--color-accent)",
        color: "white",
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "var(--color-text-secondary)",
      padding: "4px",
      "&:hover": {
        color: "var(--color-text-primary)",
      },
    }),
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <ReactSelect
        value={selectedOption}
        onChange={(option) => option && onChange(option.value)}
        options={options}
        styles={customStyles}
        placeholder={placeholder}
        components={{ DropdownIndicator }}
        isSearchable={false}
      />
    </motion.div>
  );
}
