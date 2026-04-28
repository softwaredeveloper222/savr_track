"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  searchable?: boolean;
  className?: string;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
  direction: "down" | "up";
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  error = false,
  disabled = false,
  icon,
  searchable = false,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  // Calculate dropdown position from trigger rect
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const maxH = 280;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const direction = spaceBelow >= maxH || spaceBelow >= spaceAbove ? "down" : "up";

    setPos({
      top: direction === "down" ? rect.bottom + 6 : rect.top - 6,
      left: rect.left,
      width: rect.width,
      direction,
    });
  }, []);

  // Recalculate on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  // Focus search when opening
  useLayoutEffect(() => {
    if (open && searchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 30);
    }
  }, [open, searchable]);

  // Scroll active item into view
  useLayoutEffect(() => {
    if (open && value && listRef.current) {
      const active = listRef.current.querySelector("[data-active='true']");
      if (active) {
        active.scrollIntoView({ block: "nearest" });
      }
    }
  }, [open, value]);

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    close();
  }

  function handleToggle() {
    if (disabled) return;
    if (open) {
      close();
    } else {
      setOpen(true);
    }
  }

  const dropdown = open && pos ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] animate-slide-down"
      style={{
        top: pos.direction === "down" ? pos.top : undefined,
        bottom: pos.direction === "up" ? window.innerHeight - pos.top : undefined,
        left: pos.left,
        width: Math.max(pos.width, 200),
        maxHeight: 280,
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-elevated overflow-hidden">
        {/* Search */}
        {searchable && (
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border-0 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-slate-100 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Options */}
        <div ref={listRef} className="overflow-y-auto p-1" style={{ maxHeight: searchable ? 220 : 260 }}>
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-400 text-center">
              No results found
            </div>
          ) : (
            filtered.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  data-active={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left
                    transition-all duration-150
                    opacity-0 animate-fade-in
                    ${isSelected
                      ? "bg-teal-50 text-teal-900"
                      : "text-slate-700 hover:bg-slate-50"
                    }
                  `}
                  style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
                >
                  {option.icon && (
                    <span className="flex-shrink-0 text-slate-400">{option.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`block truncate ${isSelected ? "font-semibold" : "font-medium"}`}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="block text-xs text-slate-400 truncate mt-0.5">
                        {option.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`
          w-full flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm text-left
          transition-all duration-200
          ${error
            ? "border-red-300 focus:ring-red-500/40 focus:border-red-400"
            : open
              ? "border-teal-500 ring-2 ring-teal-500/40"
              : "border-slate-200 hover:border-slate-300"
          }
          ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer"}
          focus:outline-none
        `}
      >
        {icon && <span className="text-slate-400 flex-shrink-0">{icon}</span>}
        <span className={`flex-1 truncate ${selectedOption ? "text-slate-900" : "text-slate-400"}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {dropdown}
    </div>
  );
}
