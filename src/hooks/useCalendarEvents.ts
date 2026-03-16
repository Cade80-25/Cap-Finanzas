import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  description: string;
  color: string;
  reminder: {
    enabled: boolean;
    minutesBefore: number; // 5, 10, 15, 30, 60, 1440 (1 day)
    methods: ("app" | "email" | "sms")[];
  };
  createdAt: string;
}

export interface ReminderPreferences {
  email: string;
  phone: string;
  defaultMethod: ("app" | "email" | "sms")[];
  defaultMinutesBefore: number;
}

const EVENTS_KEY = "cap-finanzas-calendar-events";
const REMINDER_PREFS_KEY = "cap-finanzas-reminder-prefs";

const EVENT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

const defaultPrefs: ReminderPreferences = {
  email: "",
  phone: "",
  defaultMethod: ["app"],
  defaultMinutesBefore: 15,
};

export function useCalendarEvents() {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>(EVENTS_KEY, []);
  const [preferences, setPreferences] = useLocalStorage<ReminderPreferences>(
    REMINDER_PREFS_KEY,
    defaultPrefs
  );

  const addEvent = useCallback(
    (event: Omit<CalendarEvent, "id" | "createdAt">): CalendarEvent => {
      const newEvent: CalendarEvent = {
        ...event,
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      setEvents((prev) => [...prev, newEvent]);
      return newEvent;
    },
    [setEvents]
  );

  const updateEvent = useCallback(
    (id: string, updates: Partial<Omit<CalendarEvent, "id" | "createdAt">>) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );
    },
    [setEvents]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    },
    [setEvents]
  );

  const getEventsForDate = useCallback(
    (date: Date) => {
      const dateStr = date.toISOString().slice(0, 10);
      return events.filter((e) => e.date === dateStr);
    },
    [events]
  );

  const getUpcomingEvents = useCallback(
    (limit = 10) => {
      const now = new Date();
      const nowStr = now.toISOString().slice(0, 10);
      return events
        .filter((e) => e.date >= nowStr)
        .sort((a, b) => {
          const dateComp = a.date.localeCompare(b.date);
          return dateComp !== 0 ? dateComp : a.time.localeCompare(b.time);
        })
        .slice(0, limit);
    },
    [events]
  );

  const updatePreferences = useCallback(
    (updates: Partial<ReminderPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...updates }));
    },
    [setPreferences]
  );

  return {
    events,
    preferences,
    eventColors: EVENT_COLORS,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getUpcomingEvents,
    updatePreferences,
  };
}
