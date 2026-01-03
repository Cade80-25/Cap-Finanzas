import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAccountingData } from "@/hooks/useAccountingData";

export default function Calendario() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const navigate = useNavigate();
  const { transactions, ACCOUNT_CATEGORIES } = useAccountingData();

  // Convertir transacciones a eventos del calendario
  const eventos = useMemo(() => {
    return transactions.map((tx) => {
      const category = ACCOUNT_CATEGORIES[tx.account];
      const isIngreso = category?.type === "ingreso";
      return {
        fecha: new Date(tx.date + "T12:00:00"),
        titulo: tx.description,
        tipo: isIngreso ? "ingreso" : "gasto",
        monto: isIngreso ? tx.credit : tx.debit,
        cuenta: category?.label || tx.account,
      };
    });
  }, [transactions, ACCOUNT_CATEGORIES]);

  const eventosDelDia = useMemo(() => {
    if (!date) return [];
    return eventos.filter(
      (evento) =>
        evento.fecha.getDate() === date.getDate() &&
        evento.fecha.getMonth() === date.getMonth() &&
        evento.fecha.getFullYear() === date.getFullYear()
    );
  }, [eventos, date]);

  const eventosPorFecha = useMemo(() => {
    return eventos.reduce((acc, evento) => {
      const key = evento.fecha.toDateString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(evento);
      return acc;
    }, {} as Record<string, typeof eventos>);
  }, [eventos]);

  // Próximos eventos (futuros)
  const proximosEventos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return eventos
      .filter((e) => e.fecha >= hoy)
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .slice(0, 10);
  }, [eventos]);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Calendario Financiero
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualiza tus transacciones del Libro Diario en el tiempo
          </p>
        </div>
        <Button className="shadow-soft" onClick={() => navigate("/libro-diario")}>
          Ir al Libro Diario
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
            <CardDescription>
              Selecciona un día para ver las transacciones de esa fecha
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
                hasEvent: (d) => {
                  return Object.keys(eventosPorFecha).some(
                    (key) => new Date(key).toDateString() === d.toDateString()
                  );
                },
              }}
              modifiersClassNames={{
                hasEvent: "bg-primary/20 font-bold",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transacciones del Día</CardTitle>
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
                    <p className="text-xs text-muted-foreground mb-1">{evento.cuenta}</p>
                    <p className={`text-lg font-bold ${evento.tipo === "ingreso" ? "text-success" : "text-destructive"}`}>
                      {evento.tipo === "ingreso" ? "+" : "-"}${evento.monto.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay transacciones para este día</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes y Próximas</CardTitle>
          <CardDescription>Historial de movimientos financieros</CardDescription>
        </CardHeader>
        <CardContent>
          {eventos.length > 0 ? (
            <div className="space-y-3">
              {eventos
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
                          <Badge variant={evento.tipo === "ingreso" ? "default" : "secondary"} className="text-xs">
                            {evento.tipo}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{evento.cuenta}</span>
                        </div>
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
              <p>No hay transacciones registradas</p>
              <Button variant="link" onClick={() => navigate("/libro-diario")}>
                Agregar transacción en Libro Diario
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
