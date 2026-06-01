import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

type Op = "+" | "-" | "×" | "÷" | null;

interface FullCalculatorProps {
  /** Optional initial value loaded into the display. */
  initialValue?: number | string;
  /** Called with the numeric result when the user taps "Aplicar". */
  onApply?: (value: number) => void;
  /** Label for the apply action. Defaults to "Aplicar". */
  applyLabel?: string;
  /** Hide the apply button (useful when value is read live via onChange). */
  hideApply?: boolean;
  /** Called on every display change with the parsed number. */
  onChange?: (value: number) => void;
  className?: string;
}

/**
 * Full 4-function calculator (+, −, ×, ÷) with %, sign toggle, decimal, clear
 * and backspace. Self-contained — no eval, no external deps.
 */
export function FullCalculator({
  initialValue,
  onApply,
  applyLabel = "Aplicar",
  hideApply = false,
  onChange,
  className,
}: FullCalculatorProps) {
  const init = initialValue != null && initialValue !== "" ? String(initialValue) : "0";
  const [display, setDisplay] = useState<string>(init);
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [waiting, setWaiting] = useState<boolean>(false);

  useEffect(() => {
    onChange?.(parseFloat(display) || 0);
  }, [display, onChange]);

  const inputDigit = useCallback((d: string) => {
    setDisplay((cur) => {
      if (waiting) {
        setWaiting(false);
        return d;
      }
      if (cur === "0") return d;
      if (cur.replace(/[^0-9]/g, "").length >= 14) return cur;
      return cur + d;
    });
  }, [waiting]);

  const inputDot = useCallback(() => {
    setDisplay((cur) => {
      if (waiting) {
        setWaiting(false);
        return "0.";
      }
      return cur.includes(".") ? cur : cur + ".";
    });
  }, [waiting]);

  const clearAll = useCallback(() => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setWaiting(false);
  }, []);

  const backspace = useCallback(() => {
    setDisplay((cur) => {
      if (waiting) return cur;
      if (cur.length <= 1 || (cur.length === 2 && cur.startsWith("-"))) return "0";
      return cur.slice(0, -1);
    });
  }, [waiting]);

  const toggleSign = useCallback(() => {
    setDisplay((cur) => (cur === "0" ? cur : cur.startsWith("-") ? cur.slice(1) : "-" + cur));
  }, []);

  const percent = useCallback(() => {
    setDisplay((cur) => {
      const n = parseFloat(cur) || 0;
      return formatResult(n / 100);
    });
  }, []);

  const compute = (a: number, b: number, operator: Op): number => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? 0 : a / b;
      default: return b;
    }
  };

  const setOperator = useCallback((next: Exclude<Op, null>) => {
    const current = parseFloat(display) || 0;
    if (prev == null) {
      setPrev(current);
    } else if (!waiting && op) {
      const result = compute(prev, current, op);
      setPrev(result);
      setDisplay(formatResult(result));
    }
    setOp(next);
    setWaiting(true);
  }, [display, prev, op, waiting]);

  const equals = useCallback(() => {
    if (op == null || prev == null) return;
    const current = parseFloat(display) || 0;
    const result = compute(prev, current, op);
    setDisplay(formatResult(result));
    setPrev(null);
    setOp(null);
    setWaiting(true);
  }, [op, prev, display]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Avoid hijacking when typing in other inputs outside this calc
      const target = e.target as HTMLElement | null;
      if (target && target.closest("[data-fullcalc-root]") == null) return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); inputDigit(e.key); return; }
      if (e.key === ".") { e.preventDefault(); inputDot(); return; }
      if (e.key === "+" || e.key === "-") { e.preventDefault(); setOperator(e.key as "+"|"-"); return; }
      if (e.key === "*" || e.key.toLowerCase() === "x") { e.preventDefault(); setOperator("×"); return; }
      if (e.key === "/") { e.preventDefault(); setOperator("÷"); return; }
      if (e.key === "Enter" || e.key === "=") { e.preventDefault(); equals(); return; }
      if (e.key === "Backspace") { e.preventDefault(); backspace(); return; }
      if (e.key === "Escape") { e.preventDefault(); clearAll(); return; }
      if (e.key === "%") { e.preventDefault(); percent(); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inputDigit, inputDot, setOperator, equals, backspace, clearAll, percent]);

  const expressionLine = prev != null && op
    ? `${formatResult(prev)} ${op}${waiting ? "" : " " + display}`
    : "";

  return (
    <div data-fullcalc-root className={cn("space-y-3 rounded-md border bg-muted/30 p-3", className)}>
      {/* Display */}
      <div className="rounded-md border bg-background px-3 py-2 text-right">
        <div className="text-xs text-muted-foreground h-4 truncate">{expressionLine || "\u00A0"}</div>
        <div className="text-2xl font-bold tabular-nums truncate" aria-live="polite">
          {display}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-1.5">
        <CalcButton variant="muted" onClick={clearAll}>C</CalcButton>
        <CalcButton variant="muted" onClick={toggleSign} aria-label="Cambiar signo">±</CalcButton>
        <CalcButton variant="muted" onClick={percent} aria-label="Porcentaje">%</CalcButton>
        <CalcButton variant="op" onClick={() => setOperator("÷")} active={op === "÷"}>÷</CalcButton>

        <CalcButton onClick={() => inputDigit("7")}>7</CalcButton>
        <CalcButton onClick={() => inputDigit("8")}>8</CalcButton>
        <CalcButton onClick={() => inputDigit("9")}>9</CalcButton>
        <CalcButton variant="op" onClick={() => setOperator("×")} active={op === "×"}>×</CalcButton>

        <CalcButton onClick={() => inputDigit("4")}>4</CalcButton>
        <CalcButton onClick={() => inputDigit("5")}>5</CalcButton>
        <CalcButton onClick={() => inputDigit("6")}>6</CalcButton>
        <CalcButton variant="op" onClick={() => setOperator("-")} active={op === "-"}>−</CalcButton>

        <CalcButton onClick={() => inputDigit("1")}>1</CalcButton>
        <CalcButton onClick={() => inputDigit("2")}>2</CalcButton>
        <CalcButton onClick={() => inputDigit("3")}>3</CalcButton>
        <CalcButton variant="op" onClick={() => setOperator("+")} active={op === "+"}>+</CalcButton>

        <CalcButton onClick={() => inputDigit("0")} className="col-span-2">0</CalcButton>
        <CalcButton onClick={inputDot}>.</CalcButton>
        <CalcButton variant="primary" onClick={equals} aria-label="Igual">=</CalcButton>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" className="gap-1 text-xs" onClick={backspace}>
          <Delete className="h-3.5 w-3.5" /> Borrar
        </Button>
        {!hideApply && onApply && (
          <Button
            type="button"
            size="sm"
            onClick={() => onApply(parseFloat(display) || 0)}
          >
            {applyLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function CalcButton({
  children,
  onClick,
  variant = "default",
  active = false,
  className,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "muted" | "op" | "primary";
  active?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-md text-base font-semibold transition-colors select-none",
        "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "default" && "bg-background border hover:bg-accent",
        variant === "muted" && "bg-muted text-muted-foreground hover:bg-muted/70",
        variant === "op" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        active && variant === "op" && "ring-2 ring-primary",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function formatResult(n: number): string {
  if (!isFinite(n)) return "0";
  // Trim trailing zeros while limiting precision
  const fixed = Math.abs(n) < 1e-10 ? "0" : Number(n.toPrecision(12)).toString();
  return fixed;
}
