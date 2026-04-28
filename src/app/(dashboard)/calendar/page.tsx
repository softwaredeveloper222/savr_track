"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CircleDot,
  X,
  ExternalLink,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import StatusBadge from "@/components/StatusBadge";

interface DeadlineItem {
  id: string;
  title: string;
  expirationDate: string;
  status: string;
  completedAt: string | null;
  category: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

function getStatusColor(status: string): string {
  switch (status) {
    case "overdue":
      return "bg-red-500";
    case "due_soon":
      return "bg-amber-400";
    case "completed":
      return "bg-blue-400";
    default:
      return "bg-emerald-400";
  }
}

function getStatusRingColor(status: string): string {
  switch (status) {
    case "overdue":
      return "ring-red-200";
    case "due_soon":
      return "ring-amber-200";
    case "completed":
      return "ring-blue-200";
    default:
      return "ring-emerald-200";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "overdue":
      return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
    case "due_soon":
      return <Clock className="h-3.5 w-3.5 text-amber-500" />;
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />;
    default:
      return <CircleDot className="h-3.5 w-3.5 text-emerald-500" />;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "overdue":
      return "Overdue";
    case "due_soon":
      return "Due Soon";
    case "completed":
      return "Completed";
    default:
      return "Active";
  }
}

function SkeletonCalendar() {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 animate-fade-in">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`h-${i}`} className="h-8 shimmer rounded-lg mb-2" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl p-2">
            <div className="h-5 w-5 shimmer rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetchDeadlines();
  }, [currentMonth]);

  async function fetchDeadlines() {
    try {
      setLoading(true);
      const res = await fetch("/api/deadlines");
      if (!res.ok) throw new Error("Failed to fetch deadlines");
      const data = await res.json();
      setDeadlines(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load deadlines"
      );
    } finally {
      setLoading(false);
    }
  }

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const deadlinesByDay = useMemo(() => {
    const map = new Map<string, DeadlineItem[]>();
    deadlines.forEach((d) => {
      const key = format(new Date(d.expirationDate), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });
    return map;
  }, [deadlines]);

  const selectedDayDeadlines = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return deadlinesByDay.get(key) || [];
  }, [selectedDay, deadlinesByDay]);

  // Summary counts for the legend
  const monthlySummary = useMemo(() => {
    let overdue = 0, dueSoon = 0, active = 0, completed = 0;
    deadlines.forEach((d) => {
      const date = new Date(d.expirationDate);
      if (isSameMonth(date, currentMonth)) {
        if (d.status === "overdue") overdue++;
        else if (d.status === "due_soon") dueSoon++;
        else if (d.status === "completed") completed++;
        else active++;
      }
    });
    return { overdue, dueSoon, active, completed, total: overdue + dueSoon + active + completed };
  }, [deadlines, currentMonth]);

  function handlePrevMonth() {
    setCurrentMonth((m) => subMonths(m, 1));
    setSelectedDay(null);
  }

  function handleNextMonth() {
    setCurrentMonth((m) => addMonths(m, 1));
    setSelectedDay(null);
  }

  function handleToday() {
    setCurrentMonth(new Date());
    setSelectedDay(null);
  }

  function handleDayClick(day: Date) {
    const key = format(day, "yyyy-MM-dd");
    const items = deadlinesByDay.get(key);
    if (items && items.length > 0) {
      setSelectedDay((prev) => (prev && isSameDay(prev, day) ? null : day));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visualize your compliance timeline</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="btn-ghost text-xs"
          >
            Today
          </button>
          <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-card">
            <button
              onClick={handlePrevMonth}
              className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-l-xl transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-900 min-w-[160px] text-center px-3">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-r-xl transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700 animate-fade-in">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonCalendar />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Calendar Grid */}
          <div className="animate-fade-in" style={{ animationDelay: "50ms" }}>
            {/* Desktop */}
            <div className="hidden md:block bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-slate-50/80 border-b border-slate-100">
                {DAY_HEADERS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-3"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayDeadlines = deadlinesByDay.get(key) || [];
                  const inMonth = isSameMonth(day, currentMonth);
                  const today = isToday(day);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const hasDeadlines = dayDeadlines.length > 0;
                  const hasOverdue = dayDeadlines.some((d) => d.status === "overdue");
                  const hasDueSoon = dayDeadlines.some((d) => d.status === "due_soon");

                  return (
                    <div
                      key={key}
                      onClick={() => handleDayClick(day)}
                      className={`
                        relative min-h-[90px] border-b border-r border-slate-100/80 p-1.5 transition-all duration-200
                        ${!inMonth ? "bg-slate-50/50" : ""}
                        ${today && !isSelected ? "bg-teal-50/60" : ""}
                        ${isSelected ? "bg-teal-50 ring-2 ring-inset ring-teal-400" : ""}
                        ${hasDeadlines && inMonth ? "cursor-pointer hover:bg-slate-50/80" : ""}
                      `}
                    >
                      {/* Day number */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`
                            inline-flex items-center justify-center text-xs font-medium w-6 h-6 rounded-lg
                            ${today
                              ? "bg-teal-600 text-white font-bold"
                              : inMonth
                                ? "text-slate-700"
                                : "text-slate-300"
                            }
                          `}
                        >
                          {format(day, "d")}
                        </span>
                        {inMonth && hasDeadlines && (
                          <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 ${
                            hasOverdue
                              ? "bg-red-100 text-red-600"
                              : hasDueSoon
                                ? "bg-amber-100 text-amber-600"
                                : "bg-slate-100 text-slate-500"
                          }`}>
                            {dayDeadlines.length}
                          </span>
                        )}
                      </div>

                      {/* Deadline indicators */}
                      {inMonth && hasDeadlines && (
                        <div className="space-y-0.5">
                          {dayDeadlines.slice(0, 3).map((d) => (
                            <div
                              key={d.id}
                              className={`
                                flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate
                                ${d.status === "overdue"
                                  ? "bg-red-50 text-red-700"
                                  : d.status === "due_soon"
                                    ? "bg-amber-50 text-amber-700"
                                    : d.status === "completed"
                                      ? "bg-blue-50 text-blue-600"
                                      : "bg-emerald-50 text-emerald-700"
                                }
                              `}
                              title={d.title}
                            >
                              <div className={`w-1 h-1 rounded-full flex-shrink-0 ${getStatusColor(d.status)}`} />
                              <span className="truncate">{d.title}</span>
                            </div>
                          ))}
                          {dayDeadlines.length > 3 && (
                            <span className="text-[10px] text-slate-400 px-1.5">
                              +{dayDeadlines.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-3 stagger-children">
              {calendarDays
                .filter((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  return (
                    isSameMonth(day, currentMonth) &&
                    (deadlinesByDay.get(key)?.length ?? 0) > 0
                  );
                })
                .map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayDeadlines = deadlinesByDay.get(key) || [];
                  const today = isToday(day);
                  return (
                    <div
                      key={key}
                      className={`bg-white rounded-2xl shadow-card border p-4 card-hover ${
                        today
                          ? "border-teal-200 bg-teal-50/30"
                          : "border-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {today && (
                            <span className="w-2 h-2 rounded-full bg-teal-500" />
                          )}
                          <span
                            className={`text-sm font-semibold ${
                              today ? "text-teal-700" : "text-slate-900"
                            }`}
                          >
                            {format(day, "EEEE, MMMM d")}
                          </span>
                          {today && (
                            <span className="text-[10px] font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                          {dayDeadlines.length} item{dayDeadlines.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {dayDeadlines.map((d) => (
                          <Link
                            key={d.id}
                            href={`/deadlines/${d.id}`}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
                          >
                            {getStatusIcon(d.status)}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-slate-900 group-hover:text-teal-700 transition-colors truncate block">
                                {d.title}
                              </span>
                              <span className="text-xs text-slate-500">
                                {d.owner.firstName} {d.owner.lastName}
                              </span>
                            </div>
                            <StatusBadge status={d.status} size="sm" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              {calendarDays.filter((day) => {
                const key = format(day, "yyyy-MM-dd");
                return (
                  isSameMonth(day, currentMonth) &&
                  (deadlinesByDay.get(key)?.length ?? 0) > 0
                );
              }).length === 0 && (
                <div className="text-center py-20 animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 mb-1">No deadlines this month</p>
                  <p className="text-xs text-slate-500">Try navigating to a different month</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar — Summary + Selected Day */}
          <div className="space-y-4 animate-fade-in-right" style={{ animationDelay: "150ms" }}>
            {/* Monthly Summary */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900">
                  {format(currentMonth, "MMMM")} Summary
                </h3>
              </div>
              {monthlySummary.total === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No deadlines this month</p>
              ) : (
                <div className="space-y-2.5">
                  {monthlySummary.overdue > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-red-100" />
                        <span className="text-sm text-slate-700">Overdue</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">{monthlySummary.overdue}</span>
                    </div>
                  )}
                  {monthlySummary.dueSoon > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-100" />
                        <span className="text-sm text-slate-700">Due Soon</span>
                      </div>
                      <span className="text-sm font-bold text-amber-600">{monthlySummary.dueSoon}</span>
                    </div>
                  )}
                  {monthlySummary.active > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
                        <span className="text-sm text-slate-700">Active</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">{monthlySummary.active}</span>
                    </div>
                  )}
                  {monthlySummary.completed > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-blue-100" />
                        <span className="text-sm text-slate-700">Completed</span>
                      </div>
                      <span className="text-sm font-bold text-blue-600">{monthlySummary.completed}</span>
                    </div>
                  )}
                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">Total</span>
                    <span className="text-sm font-bold text-slate-900">{monthlySummary.total}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Day Detail */}
            {selectedDay && selectedDayDeadlines.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden animate-slide-down">
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 border-b border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {format(selectedDay, "EEEE")}
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {format(selectedDay, "MMMM d, yyyy")}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="p-3 space-y-1 stagger-children">
                  {selectedDayDeadlines.map((d) => (
                    <Link
                      key={d.id}
                      href={`/deadlines/${d.id}`}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                        hover:bg-slate-50
                      `}
                    >
                      <div className={`w-2 h-2 rounded-full ring-4 flex-shrink-0 ${getStatusColor(d.status)} ${getStatusRingColor(d.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 group-hover:text-teal-700 truncate transition-colors">
                          {d.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-500">
                            {d.owner.firstName} {d.owner.lastName}
                          </span>
                          <span className="text-slate-300">&middot;</span>
                          <span className={`text-xs font-medium ${
                            d.status === "overdue" ? "text-red-600"
                              : d.status === "due_soon" ? "text-amber-600"
                              : d.status === "completed" ? "text-blue-600"
                              : "text-emerald-600"
                          }`}>
                            {getStatusLabel(d.status)}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-teal-500 flex-shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-0.5">Select a day</p>
                <p className="text-xs text-slate-400">Click on a day with deadlines to see details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
