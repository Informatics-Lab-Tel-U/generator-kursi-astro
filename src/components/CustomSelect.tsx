import { useState, useRef, useEffect } from "react";
import { LuChevronDown, LuLoader } from "react-icons/lu";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "-- Pilih --",
  disabled = false,
  isLoading = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${disabled ? "disabled" : ""}`}
      style={{ position: "relative", width: "100%" }}
    >
      <button
        type="button"
        className="sidebar-select custom-select-trigger"
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          color: selectedOption ? "var(--text-primary)" : "var(--text-muted)",
          backgroundImage: "none", 
          paddingRight: "12px", 
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {isLoading ? (
          <LuLoader
            className="animate-spin"
            style={{
              flexShrink: 0,
              marginLeft: "8px",
              color: "var(--text-secondary)",
            }}
          />
        ) : (
          <LuChevronDown
            style={{
              flexShrink: 0,
              marginLeft: "8px",
              color: "var(--text-secondary)",
              transition: "transform 0.2s",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        )}
      </button>

      {isOpen && !disabled && !isLoading && (
        <ul className="custom-select-options">
          <li
            className="custom-select-option placeholder"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            {placeholder}
          </li>
          {options.map((option) => (
            <li
              key={option.value}
              className={`custom-select-option ${
                value === option.value ? "selected" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
