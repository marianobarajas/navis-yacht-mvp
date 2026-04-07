"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

export type CustomSelectOption = { value: string; label: string };

export function CustomSelect({
  options,
  value,
  defaultValue,
  onChange,
  name,
  placeholder = "Select…",
  disabled = false,
  className = "",
  triggerClassName = "",
  emphasizeValue = false,
  required = false,
  form,
}: {
  options: CustomSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  emphasizeValue?: boolean;
  required?: boolean;
  form?: string;
}) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? value ?? "");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const displayLabel = options.find((o) => o.value === currentValue)?.label ?? placeholder;

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        document.getElementById("custom-select-dropdown")?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function handleScroll() {
      setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [open]);

  function selectOption(val: string) {
    if (!isControlled) setInternalValue(val);
    onChange?.(val);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {name && (
        <input type="hidden" name={name} value={currentValue} required={required} form={form} />
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`custom-select-trigger flex h-[46px] w-full items-center justify-between rounded-[var(--apple-radius)] border border-[var(--apple-border-strong)] bg-[var(--apple-dropdown-bg)] px-4 py-2 text-left text-base text-[var(--apple-text-primary)] transition-colors hover:border-[var(--apple-accent)] focus:border-[var(--apple-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-accent-muted)] disabled:cursor-not-allowed disabled:opacity-60 ${triggerClassName}`}
      >
        <span className={currentValue ? (emphasizeValue ? "font-semibold" : "") : "text-[var(--apple-text-tertiary)]"}>
          {displayLabel}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-[var(--apple-text-tertiary)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id="custom-select-dropdown"
            className="custom-select-dropdown fixed z-[100] min-w-[200px] max-h-60 overflow-auto rounded-[var(--apple-radius)] border-2 border-[var(--apple-border-strong)] bg-[var(--apple-bg-elevated)] py-1"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: Math.max(dropdownPos.width || 200, 200),
              boxShadow: "var(--apple-shadow-dropdown)",
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => selectOption(opt.value)}
                className={`block w-full whitespace-nowrap px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--apple-bg-subtle)] ${
                  currentValue === opt.value
                    ? "font-medium text-[var(--apple-accent)]"
                    : "text-[var(--apple-text-primary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
