import { useState } from "react";
import { Wallet, Calculator, Lightbulb, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useNumberFormat } from "@/hooks/useNumberFormat";
import { z } from "zod";

const CATEGORIES_SIMPLE = [
  { value: "luz", label: "Luz", emoji: "💡" },
  { value: "agua", label: "Agua", emoji: "💧" },
  { value: "gas", label: "Gas", emoji: "🔥" },
  { value: "internet", label: "Internet", emoji: "🌐" },
  { value: "alquiler", label: "Alquiler", emoji: "🏠" },
  { value: "comida", label: "Comida", emoji: "🍔" },
  { value: "transporte", label: "Transporte", emoji: "🚗" },
];

const ACCOUNTS_TRAD = [
  { value: "servicios", label: "Gastos Servicios" },
  { value: "alquileres", label: "Gastos Alquileres" },
  { value: "alimentacion", label: "Gastos Alimentación" },
  { value: "transporte", label: "Gastos Transporte" },
  { value: "otros", label: "Otros Gastos" },
];

const PAYMENT_SOURCES = [
  { value: "caja", label: "Caja (efectivo)" },
  { value: "banco", label: "Banco" },
  { value: "tarjeta", label: "Tarjeta de crédito" },
];

// Validación: monto positivo, máximo razonable
const amountSchema = z
  .number({ invalid_type_error: "Ingresá un número" })
  .positive("Debe ser mayor a 0")
  .max(999999999, "Demasiado grande");

export function InteractiveModeExample() {
  const { formatNumber } = useNumberFormat();
  const [amountStr, setAmountStr] = useState("50");
  const [categorySimple, setCategorySimple] = useState("luz");
  const [accountTrad, setAccountTrad] = useState("servicios");
  const [paymentSource, setPaymentSource] = useState("caja");

  // Sanitizar input: solo dígitos, coma o punto, máximo 12 caracteres
  const handleAmountChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d.,]/g, "").slice(0, 12);
    setAmountStr(cleaned);
  };

  const parsedAmount = parseFloat(amountStr.replace(",", ".")) || 0;
  const validation = amountSchema.safeParse(parsedAmount);
  const isValid = validation.success;
  const errorMsg = !isValid ? validation.error.errors[0]?.message : "";

  const cat = CATEGORIES_SIMPLE.find((c) => c.value === categorySimple)!;
  const acc = ACCOUNTS_TRAD.find((a) => a.value === accountTrad)!;
  const src = PAYMENT_SOURCES.find((s) => s.value === paymentSource)!;
  const sourceAccountLabel =
    paymentSource === "tarjeta" ? "Tarjeta por Pagar" : src.label.split(" ")[0];

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-start gap-2 mb-3">
        <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Probalo en vivo</p>
          <p className="text-xs text-muted-foreground">
            Cambiá los valores y mirá cómo se registra el mismo gasto en cada modo
          </p>
        </div>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 p-3 rounded-lg bg-background/60 border border-border">
        <div className="space-y-1">
          <Label htmlFor="ex-amount" className="text-xs">Monto</Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
            <Input
              id="ex-amount"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="h-8 pl-5 text-sm"
              maxLength={12}
              aria-invalid={!isValid}
            />
          </div>
          {!isValid && amountStr && (
            <p className="text-[10px] text-destructive">{errorMsg}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Categoría / Cuenta</Label>
          <Select value={categorySimple} onValueChange={(v) => {
            setCategorySimple(v);
            // Sincroniza una cuenta traditional razonable
            if (["luz","agua","gas","internet"].includes(v)) setAccountTrad("servicios");
            else if (v === "alquiler") setAccountTrad("alquileres");
            else if (v === "comida") setAccountTrad("alimentacion");
            else if (v === "transporte") setAccountTrad("transporte");
            else setAccountTrad("otros");
          }}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES_SIMPLE.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-sm">
                  {c.emoji} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Pagado con</Label>
          <Select value={paymentSource} onValueChange={setPaymentSource}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_SOURCES.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-sm">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resultado en vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Simple */}
        <div className="rounded-lg p-3 border-2 border-border bg-background">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">Modo Simple</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-mono">1 línea</Badge>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">Gasto</Badge>
            </div>
          </div>
          <div className="text-xs space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base">{cat.emoji}</span>
                <span className="truncate">{cat.label}</span>
              </div>
              <span className="font-mono font-semibold text-destructive whitespace-nowrap">
                -${isValid ? formatNumber(parsedAmount) : "—"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Registro directo: gasto de {cat.label.toLowerCase()} pagado con {src.label.toLowerCase()}.
            </p>
          </div>
        </div>

        {/* Completo */}
        <div className="rounded-lg p-3 border-2 border-border bg-background">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">Modo Completo</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-mono">2 líneas</Badge>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">Partida doble</Badge>
            </div>
          </div>
          <div className="text-xs">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 gap-y-1 font-mono">
              <div className="text-[10px] text-muted-foreground font-sans col-span-3 border-b border-border pb-0.5">
                Asiento contable
              </div>
              {/* Debe */}
              <span className="truncate">{acc.label}</span>
              <span className="text-success text-[10px] self-center">Debe</span>
              <span className="text-success font-semibold whitespace-nowrap">
                ${isValid ? formatNumber(parsedAmount) : "—"}
              </span>
              {/* Haber */}
              <span className="truncate pl-3 text-muted-foreground">a {sourceAccountLabel}</span>
              <span className="text-destructive text-[10px] self-center">Haber</span>
              <span className="text-destructive font-semibold whitespace-nowrap">
                ${isValid ? formatNumber(parsedAmount) : "—"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground italic mt-2 font-sans flex items-start gap-1">
              <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Aumenta el gasto y disminuye {sourceAccountLabel.toLowerCase()}.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
