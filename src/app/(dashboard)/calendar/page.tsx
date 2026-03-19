"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      return "bg-amber-500";
    case "completed":
      return "bg-blue-500";
    default:
      return "bg-green-500";
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[100px] border border-slate-100 rounded p-1"
          >
            <div className="h-4 bg-slate-200 rounded w-6 mb-2" />
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

  function handlePrevMonth() {
    setCurrentMonth((m) => subMonths(m, 1));
    setSelectedDay(null);
  }

  function handleNextMonth() {
    setCurrentMonth((m) => addMonths(m, 1));
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-lg font-semibold text-slate-900 min-w-[180px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonCalendar />
      ) : (
        <>
          {/* Desktop Calendar Grid */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-slate-500 py-2"
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

                return (
                  <div
                    key={key}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[100px] border border-slate-100 p-1 transition-colors ${
                      today ? "bg-indigo-50 border-indigo-200" : ""
                    } ${isSelected ? "ring-2 ring-indigo-400" : ""} ${
                      dayDeadlines.length > 0
                        ? "cursor-pointer hover:bg-slate-50"
                        : ""
                    }`}
                  >
                    <div
                      className={`text-xs font-medium mb-1 px-1 ${
                        today
                          ? "text-indigo-700 font-bold"
                          : inMonth
                          ? "text-slate-900"
                          : "text-slate-300"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    {inMonth && dayDeadlines.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-1">
                        {dayDeadlines.slice(0, 4).map((d) => (
                          <div
                            key={d.id}
                            className={`w-2 h-2 rounded-full ${getStatusColor(d.status)}`}
                            title={`${d.title} (${getStatusLabel(d.status)})`}
                          />
                        ))}
                        {dayDeadlines.length > 4 && (
                          <span className="text-[10px] text-slate-400">
                            +{dayDeadlines.length - 4}
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
          <div className="md:hidden space-y-2">
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
                    className={`bg-white rounded-xl shadow-sm border p-4 ${
                      today
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div
                      className={`text-sm font-semibold mb-2 ${
                        today ? "text-indigo-700" : "text-slate-900"
                      }`}
                    >
                      {format(day, "EEEE, MMMM d")}
                      {today && (
                        <span className="ml-2 text-xs font-medium text-indigo-500">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {dayDeadlines.map((d) => (
                        <Link
                          key={d.id}
                          href={`/deadlines/${d.id}`}
                          className="flex items-center gap-2 text-sm text-slate-700 hover:text-indigo-600 transition-colors"
                        >
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(d.status)}`}
                          />
                          <span className="truncate">{d.title}</span>
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
              <div className="text-center py-16">
                <p className="text-sm text-slate-500">
                  No deadlines this month.
                </p>
              </div>
            )}
          </div>

          {/* Selected Day Popover / Sidebar */}
          {selectedDay && selectedDayDeadlines.length > 0 && (
            <div className="hidden md:block mt-4 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {format(selectedDay, "EEEE, MMMM d, yyyy")}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="text-xs">Close</span>
                </button>
              </div>
              <div className="space-y-2">
                {selectedDayDeadlines.map((d) => (
                  <Link
                    key={d.id}
                    href={`/deadlines/${d.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusColor(d.status)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 truncate">
                        {d.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {d.owner.firstName} {d.owner.lastName} &middot;{" "}
                        {getStatusLabel(d.status)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
