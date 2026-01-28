import ReactSelect, { StylesConfig, components, DropdownIndicatorProps } from 'react-select';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

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
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <ChevronDown size={16} />
      </motion.div>
    </components.DropdownIndicator>
  );
};

export function Select({ value, onChange, options, placeholder = 'Select...', className = '' }: SelectProps) {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const customStyles: StylesConfig<Option> = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--color-bg-tertiary)',
      borderColor: state.isFocused ? 'var(--color-accent)' : 'var(--color-border-subtle)',
      borderWidth: '1px',
      borderRadius: '8px',
      padding: '1px 4px',
      boxShadow: state.isFocused ? '0 0 0 3px var(--color-accent-light)' : 'none',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      minHeight: '32px',
      '&:hover': {
        backgroundColor: 'var(--color-bg-hover)',
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--color-text-primary)',
      fontSize: '0.875rem',
      fontWeight: 500,
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--color-text-secondary)',
      fontSize: '0.875rem',
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--color-bg-secondary)',
      borderRadius: '8px',
      border: '1px solid var(--color-border-subtle)',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
      marginTop: '4px',
      zIndex: 100,
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      maxHeight: '200px',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--color-accent)'
        : state.isFocused
          ? 'var(--color-bg-hover)'
          : 'transparent',
      color: state.isSelected ? 'white' : 'var(--color-text-primary)',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: state.isSelected ? 500 : 400,
      padding: '6px 10px',
      borderRadius: '6px',
      transition: 'all 0.15s ease',
      '&:active': {
        backgroundColor: 'var(--color-accent)',
        color: 'white',
      },
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: 'var(--color-text-secondary)',
      padding: '4px',
      '&:hover': {
        color: 'var(--color-text-primary)',
      },
    }),
  };

  return (
    <div className={className}>
      <ReactSelect
        value={selectedOption}
        onChange={(option) => {
          if (option && !Array.isArray(option) && 'value' in option) {
            onChange(option.value);
          }
        }}
        options={options}
        styles={customStyles}
        placeholder={placeholder}
        components={{ DropdownIndicator }}
        isSearchable={false}
      />
    </div>
  );
}
