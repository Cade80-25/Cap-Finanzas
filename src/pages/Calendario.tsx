import { Calendar as CalendarIcon, Plus, Bell, Settings, Clock, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
import { useNotifications } from "@/hooks/useNotifications";
import { CalendarEventDialog } from "@/components/CalendarEventDialog";
import { ReminderPreferencesDialog } from "@/components/ReminderPreferencesDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLicense } from "@/hooks/useLicense";

export default function Calendario() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [prefsDialogOpen, setPrefsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const navigate = useNavigate();
  const { transactions, ACCOUNT_CATEGORIES } = useAccountingData();
  const {
    events: calendarEvents,
    preferences,
    eventColors,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getUpcomingEvents,
    updatePreferences,
  } = useCalendarEvents();
  const { addNotification } = useNotifications();
  const { licenseToken, installationId } = useLicense();

  // Convert transactions to calendar display items
  const transactionEvents = useMemo(() => {
    return transactions.map((tx) => {
      const category = ACCOUNT_CATEGORIES[tx.account];
      const isIngreso = category?.type === "ingreso";
      return {
        fecha: new Date(tx.date + "T12:00:00"),
        titulo: tx.description,
        tipo: isIngreso ? "ingreso" as const : "gasto" as const,
        monto: isIngreso ? tx.credit : tx.debit,
        cuenta: category?.label || tx.account,
        isTransaction: true,
      };
    });
  }, [transactions, ACCOUNT_CATEGORIES]);

  // Events for selected date
  const eventsForSelectedDate = useMemo(() => {
    if (!date) return [];
    return getEventsForDate(date);
  }, [date, getEventsForDate]);

  const transactionsForSelectedDate = useMemo(() => {
    if (!date) return [];
    return transactionEvents.filter(
      (e) =>
        e.fecha.getDate() === date.getDate() &&
        e.fecha.getMonth() === date.getMonth() &&
        e.fecha.getFullYear() === date.getFullYear()
    );
  }, [transactionEvents, date]);

  // Dates with content (for calendar highlighting)
  const datesWithEvents = useMemo(() => {
    const set = new Set<string>();
    calendarEvents.forEach((e) => set.add(e.date));
    transactionEvents.forEach((e) => set.add(e.fecha.toISOString().slice(0, 10)));
    return set;
  }, [calendarEvents, transactionEvents]);

  const upcomingEvents = useMemo(() => getUpcomingEvents(10), [getUpcomingEvents]);

  // Check for in-app reminders periodically
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      calendarEvents.forEach((event) => {
        if (!event.reminder.enabled || !event.reminder.methods.includes("app")) return;
        const eventTime = new Date(`${event.date}T${event.time}`);
        const reminderTime = new Date(eventTime.getTime() - event.reminder.minutesBefore * 60000);
        const diff = reminderTime.getTime() - now.getTime();
        // Fire if within 30 seconds of reminder time
        if (diff >= -30000 && diff <= 30000) {
          addNotification({
            title: `⏰ Recordatorio: ${event.title}`,
            message: `Tu evento "${event.title}" es ${event.reminder.minutesBefore >= 60 ? `en ${Math.round(event.reminder.minutesBefore / 60)} hora(s)` : `en ${event.reminder.minutesBefore} minutos`}`,
            type: "info",
            category: "pago",
          });
          toast.info(`⏰ Recordatorio: ${event.title}`, {
            description: event.description || `A las ${event.time}`,
            duration: 10000,
          });
        }
      });
    };

    const interval = setInterval(checkReminders, 30000);
    checkReminders();
    return () => clearInterval(interval);
  }, [calendarEvents, addNotification]);

  // Schedule backend reminder (email)
  const scheduleBackendReminder = useCallback(
    async (event: CalendarEvent) => {
      if (!event.reminder.enabled) return;
      const backendMethods = event.reminder.methods.filter((m) => m === "email");
      if (backendMethods.length === 0) return;
      if (backendMethods.includes("email") && !preferences.email) return;

      try {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const reminderAt = new Date(eventDateTime.getTime() - event.reminder.minutesBefore * 60000);

        // Don't schedule if already past
        if (reminderAt <= new Date()) return;

        await supabase.functions.invoke("schedule-reminder", {
          body: {
            eventId: event.id,
            title: event.title,
            description: event.description,
            eventDate: event.date,
            eventTime: event.time,
            reminderAt: reminderAt.toISOString(),
            methods: backendMethods,
            email: preferences.email,
            phone: preferences.phone,
          },
        });
      } catch (err) {
        console.error("Error scheduling reminder:", err);
      }
    },
    [preferences]
  );

  const handleSaveEvent = (eventData: Omit<CalendarEvent, "id" | "createdAt">) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
      // Re-schedule if reminder changed
      const updated = { ...editingEvent, ...eventData };
      scheduleBackendReminder(updated);
      toast.success("Evento actualizado");
    } else {
      const created = addEvent(eventData);
      scheduleBackendReminder(created);
      toast.success("Evento creado");
    }
    setEditingEvent(null);
  };

  const handleDeleteEvent = () => {
    if (editingEvent) {
      deleteEvent(editingEvent.id);
      toast.success("Evento eliminado");
      setEditingEvent(null);
      setEventDialogOpen(false);
    }
  };

  const openNewEvent = () => {
    setEditingEvent(null);
    setEventDialogOpen(true);
  };

  const openEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventDialogOpen(true);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div data-tutorial="calendario-title">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Calendario Financiero
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Visualiza transacciones, crea eventos y configura recordatorios
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPrefsDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-1" />
            Preferencias
          </Button>
          <Button size="sm" onClick={openNewEvent}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card data-tutorial="calendario-calendar" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
            <CardDescription>
              Días con puntos de color tienen eventos o transacciones
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              className="rounded-md border shadow-soft"
              modifiers={{
                hasEvent: (d) => datesWithEvents.has(d.toISOString().slice(0, 10)),
              }}
              modifiersClassNames={{
                hasEvent: "bg-primary/20 font-bold",
              }}
            />
          </CardContent>
        </Card>

        {/* Day detail */}
        <Card data-tutorial="calendario-detalle">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {date
                    ? date.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })
                    : "Selecciona fecha"}
                </CardTitle>
                <CardDescription>
                  {date?.toLocaleDateString("es-ES", { weekday: "long", year: "numeric" })}
                </CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={openNewEvent}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Calendar events for selected day */}
            {eventsForSelectedDate.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                style={{ borderLeft: `4px solid ${event.color}` }}
                onClick={() => openEditEvent(event)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">{event.title}</h3>
                  <div className="flex items-center gap-1">
                    {event.reminder.enabled && (
                      <Bell className="h-3 w-3 text-primary" />
                    )}
                    <span className="text-xs text-muted-foreground">{event.time}</span>
                  </div>
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                )}
                {event.reminder.enabled && (
                  <div className="flex gap-1 mt-1">
                    {event.reminder.methods.map((m) => (
                      <Badge key={m} variant="outline" className="text-[10px] px-1 py-0">
                        {m === "app" ? "App" : m === "email" ? "Email" : "SMS"}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Transaction events for selected day */}
            {transactionsForSelectedDate.map((evento, index) => (
              <div
                key={`tx-${index}`}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">{evento.titulo}</h3>
                  <Badge variant={evento.tipo === "ingreso" ? "default" : "secondary"} className="text-xs">
                    {evento.tipo}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{evento.cuenta}</p>
                <p className={`text-sm font-bold ${evento.tipo === "ingreso" ? "text-success" : "text-destructive"}`}>
                  {evento.tipo === "ingreso" ? "+" : "-"}${evento.monto.toFixed(2)}
                </p>
              </div>
            ))}

            {eventsForSelectedDate.length === 0 && transactionsForSelectedDate.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin actividad este día</p>
                <Button variant="link" size="sm" onClick={openNewEvent}>
                  + Agregar evento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Próximos Eventos
              </CardTitle>
              <CardDescription>Tus eventos y recordatorios programados</CardDescription>
            </div>
            <Button size="sm" onClick={openNewEvent}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  style={{ borderLeft: `4px solid ${event.color}` }}
                  onClick={() => openEditEvent(event)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <div className="text-sm font-semibold">
                        {new Date(event.date + "T12:00:00").getDate()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.date + "T12:00:00").toLocaleDateString("es-ES", {
                          month: "short",
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground">{event.time}</span>
                        {event.reminder.enabled && (
                          <div className="flex gap-1">
                            {event.reminder.methods.map((m) => (
                              <Badge key={m} variant="outline" className="text-[10px] px-1 py-0">
                                {m === "app" ? "🔔" : m === "email" ? "📧" : "💬"}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditEvent(event);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEvent(event.id);
                        toast.success("Evento eliminado");
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tienes eventos próximos</p>
              <Button variant="link" onClick={openNewEvent}>
                Crear tu primer evento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
          <CardDescription>Historial de movimientos financieros</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionEvents.length > 0 ? (
            <div className="space-y-3">
              {transactionEvents
                .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
                .slice(0, 10)
                .map((evento, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <div className="text-sm font-semibold">{evento.fecha.getDate()}</div>
                        <div className="text-xs text-muted-foreground">
                          {evento.fecha.toLocaleDateString("es-ES", { month: "short" })}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{evento.titulo}</p>
                        <div className="flex gap-2 items-center">
                          <Badge
                            variant={evento.tipo === "ingreso" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {evento.tipo}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{evento.cuenta}</span>
                        </div>
                      </div>
                    </div>
                    <p
                      className={`font-bold ${
                        evento.tipo === "ingreso" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {evento.tipo === "ingreso" ? "+" : "-"}${evento.monto.toFixed(2)}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay transacciones registradas</p>
              <Button variant="link" onClick={() => navigate("/libro-diario")}>
                Agregar transacción en Libro Diario
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CalendarEventDialog
        open={eventDialogOpen}
        onOpenChange={(open) => {
          setEventDialogOpen(open);
          if (!open) setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={editingEvent ? handleDeleteEvent : undefined}
        initialDate={date?.toISOString().slice(0, 10)}
        editEvent={editingEvent}
        eventColors={eventColors}
        preferences={preferences}
      />

      <ReminderPreferencesDialog
        open={prefsDialogOpen}
        onOpenChange={setPrefsDialogOpen}
        preferences={preferences}
        onSave={updatePreferences}
      />
    </div>
  );
}
