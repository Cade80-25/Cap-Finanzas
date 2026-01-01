import { useState } from "react";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

type Evento = { fecha: Date; titulo: string; tipo: string; monto: number };

export default function Calendario() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Datos vacíos - el usuario agregará sus propios eventos
  const eventosData: Evento[] = [];

  const eventosDelDia = eventosData.filter(
    (evento) =>
      date &&
      evento.fecha.getDate() === date.getDate() &&
      evento.fecha.getMonth() === date.getMonth() &&
      evento.fecha.getFullYear() === date.getFullYear()
  );

  const eventosPorFecha = eventosData.reduce((acc, evento) => {
    const key = evento.fecha.toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(evento);
    return acc;
  }, {} as Record<string, typeof eventosData>);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Calendario Financiero
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualiza y planifica tus transacciones en el tiempo
          </p>
        </div>
        <Button className="shadow-soft">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
            <CardDescription>
              Selecciona un día para ver las transacciones programadas
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
                hasEvent: (date) => {
                  return Object.keys(eventosPorFecha).some(
                    (key) => new Date(key).toDateString() === date.toDateString()
                  );
                },
              }}
              modifiersClassNames={{
                hasEvent: "bg-primary/10 font-bold",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Eventos del Día
            </CardTitle>
            <CardDescription>
              {date ? date.toLocaleDateString("es-ES", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              }) : "Selecciona una fecha"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventosDelDia.length > 0 ? (
              <div className="space-y-4">
                {eventosDelDia.map((evento, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{evento.titulo}</h3>
                      <Badge variant={evento.tipo === "ingreso" ? "default" : "secondary"}>
                        {evento.tipo}
                      </Badge>
                    </div>
                    <p className={`text-lg font-bold ${evento.tipo === "ingreso" ? "text-success" : "text-destructive"}`}>
                      {evento.tipo === "ingreso" ? "+" : "-"}${evento.monto.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay eventos para este día</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
          <CardDescription>Transacciones programadas para los próximos días</CardDescription>
        </CardHeader>
        <CardContent>
          {eventosData.length > 0 ? (
            <div className="space-y-3">
              {eventosData
                .filter((e) => e.fecha >= new Date())
                .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
                .map((evento, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-sm font-semibold">{evento.fecha.getDate()}</div>
                        <div className="text-xs text-muted-foreground">
                          {evento.fecha.toLocaleDateString("es-ES", { month: "short" })}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{evento.titulo}</p>
                        <Badge variant={evento.tipo === "ingreso" ? "default" : "secondary"} className="text-xs">
                          {evento.tipo}
                        </Badge>
                      </div>
                    </div>
                    <p className={`font-bold ${evento.tipo === "ingreso" ? "text-success" : "text-destructive"}`}>
                      {evento.tipo === "ingreso" ? "+" : "-"}${evento.monto.toFixed(2)}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay eventos programados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
