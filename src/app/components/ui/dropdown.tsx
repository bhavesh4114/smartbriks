"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "./utils";
import { Label } from "./label";

export type DropdownOption = { value: string; label: string };

function normalizeOptions(options: DropdownOption[] | string[]): DropdownOption[] {
  if (!Array.isArray(options) || options.length === 0) return [];
  return options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );
}

export interface DropdownProps {
  label?: string;
  options: DropdownOption[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** KYC glass style when true (dark theme) */
  variant?: "glass" | "default";
}

export function Dropdown({
  label,
  options: rawOptions,
  value,
  onChange,
  placeholder = "Select...",
  error,
  disabled = false,
  id,
  className,
  variant = "glass",
}: DropdownProps) {
  const options = normalizeOptions(rawOptions);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayValue = selectedOption?.label ?? "";

  const isGlass = variant === "glass";

  const baseTriggerClasses =
    "w-full h-12 rounded-[12px] pl-4 pr-10 text-base text-left outline-none transition-all duration-200 flex items-center";
  const triggerClasses = isGlass
    ? "border border-white/30 bg-white/20 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 focus:bg-white/25 hover:bg-white/25"
    : "border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
  const errorClasses = error ? "border-red-400 focus:border-red-400 focus:ring-red-400/30" : "";
  const disabledClasses = disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "";

  const close = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, close]);

  useEffect(() => {
    if (!open || options.length === 0) return;
    const selectedIdx = options.findIndex((o) => o.value === value);
    setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
  }, [open, value, options]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        close();
        return;
      case "Enter":
        e.preventDefault();
        if (open && options[highlightedIndex]) {
          onChange(options[highlightedIndex].value);
          close();
        } else if (!open) {
          setOpen(true);
        }
        return;
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setHighlightedIndex((i) => (i < options.length - 1 ? i + 1 : i));
        }
        return;
      case "ArrowUp":
        e.preventDefault();
        if (open) {
          setHighlightedIndex((i) => (i > 0 ? i - 1 : 0));
        }
        return;
      case "Tab":
        close();
        break;
      default:
        break;
    }
  };

  const handleSelect = (opt: DropdownOption) => {
    onChange(opt.value);
    close();
  };

  return (
    <div ref={containerRef} className={cn("relative z-[100]", className)}>
      {label && (
        <Label
          htmlFor={id}
          className={cn(
            "mb-1.5 block text-sm font-medium",
            isGlass ? "text-white/90" : "text-slate-700"
          )}
        >
          {label}
        </Label>
      )}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label ?? "Dropdown"}
        aria-describedby={error ? `${id}-error` : undefined}
        disabled={disabled}
        className={cn(
          baseTriggerClasses,
          triggerClasses,
          errorClasses,
          disabledClasses
        )}
        onClick={() => !disabled && options.length > 0 && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
      >
        <span className={cn(!displayValue && (isGlass ? "text-white/60" : "text-gray-500"))}>
          {displayValue || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none transition-transform duration-200",
            open && "rotate-180",
            isGlass ? "text-white/60" : "text-gray-500"
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            role="listbox"
            aria-activedescendant={options[highlightedIndex] ? `option-${options[highlightedIndex].value}` : undefined}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute left-0 right-0 top-full z-[100] mt-1 max-h-60 overflow-y-auto rounded-[12px] py-1 shadow-lg",
              isGlass
                ? "border border-white/20 bg-slate-800/95 backdrop-blur-md"
                : "border border-gray-200 bg-white"
            )}
            style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}
          >
            {options.length === 0 ? (
              <li className="px-4 py-3 text-sm text-white/60">No options</li>
            ) : (
              options.map((opt, idx) => (
                <li
                  key={opt.value}
                  data-index={idx}
                  id={`option-${opt.value}`}
                  role="option"
                  aria-selected={value === opt.value}
                  className={cn(
                    "cursor-pointer px-4 py-2.5 text-base transition-colors",
                    value === opt.value
                      ? "bg-blue-500/90 text-white"
                      : isGlass
                        ? "text-white/90 hover:bg-white/15"
                        : "text-slate-800 hover:bg-gray-100",
                    idx === highlightedIndex && value !== opt.value && (isGlass ? "bg-white/10" : "bg-gray-100")
                  )}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelect(opt)}
                >
                  {opt.label}
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <p id={id ? `${id}-error` : undefined} className="mt-1.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
