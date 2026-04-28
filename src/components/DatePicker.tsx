"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parse,
  isValid,
} from "date-fns";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  error = false,
  disabled = false,
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      const d = parse(value, "yyyy-MM-dd", new Date());
      return isValid(d) ? d : new Date();
    }
    return new Date();
  });
  const [pos, setPos] = useState<{ top: number; left: number; direction: "down" | "up" } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => {
    if (!value) return null;
    const d = parse(value, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : null;
  }, [value]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd),
    });
  }, [viewMonth]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelH = 340;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const direction = spaceBelow >= panelH || spaceBelow >= spaceAbove ? "down" : "up";
    setPos({ top: direction === "down" ? rect.bottom + 6 : rect.top - 6, left: rect.left, direction });
  }, []);

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

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(t) &&
        panelRef.current && !panelRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Sync viewMonth when value changes externally
  useEffect(() => {
    if (value) {
      const d = parse(value, "yyyy-MM-dd", new Date());
      if (isValid(d)) setViewMonth(d);
    }
  }, [value]);

  function handleSelect(day: Date) {
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  function handleToggle() {
    if (disabled) return;
    setOpen(!open);
  }

  function handleToday() {
    const today = new Date();
    onChange(format(today, "yyyy-MM-dd"));
    setViewMonth(today);
    setOpen(false);
  }

  const panel = open && pos ? createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] animate-scale-in"
      style={{
        top: pos.direction === "down" ? pos.top : undefined,
        bottom: pos.direction === "up" ? window.innerHeight - pos.top : undefined,
        left: pos.left,
      }}
    >
      <div className="w-[300px] bg-white border border-slate-200 rounded-2xl shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-slate-900">
            {format(viewMonth, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-3 pt-2">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider py-1.5">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-3 pb-2">
          {calendarDays.map((day) => {
            const inMonth = isSameMonth(day, viewMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleSelect(day)}
                disabled={!inMonth}
                className={`
                  relative h-9 w-full rounded-lg text-sm font-medium transition-all duration-150
                  ${!inMonth
                    ? "text-slate-200 cursor-default"
                    : isSelected
                      ? "bg-teal-600 text-white shadow-sm"
                      : today
                        ? "bg-teal-50 text-teal-700 font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                  }
                `}
              >
                {format(day, "d")}
                {today && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={handleToday}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            Today
          </button>
          {value && (
            <button
              type="button"
              onClick={(e) => { handleClear(e); setOpen(false); }}
              className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className={`relative ${className}`}>
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
        <CalendarIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <span className={`flex-1 ${value && selectedDate ? "text-slate-900" : "text-slate-400"}`}>
          {value && selectedDate ? format(selectedDate, "MMM d, yyyy") : placeholder}
        </span>
        {value ? (
          <span
            role="button"
            onClick={handleClear}
            className="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : (
          <ChevronRight className={`h-4 w-4 text-slate-300 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
        )}
      </button>
      {panel}
    </div>
  );
}
