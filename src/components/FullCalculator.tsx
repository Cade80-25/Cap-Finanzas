import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

type Op = "+" | "-" | "×" | "÷" | null;

interface FullCalculatorProps {
  /** Optional initial value loaded into the display. */
  initialValue?: number | string;
  /**
   * Called when the user taps "Aplicar".
   * Second argument is the human-readable expression (e.g. "1050 ÷ 3 = 350")
   * when one was computed via `=`, otherwise an empty string.
   */
  onApply?: (value: number, expression: string) => void;
  /** Label for the apply action. Defaults to "Aplicar". */
  applyLabel?: string;
  /** Hide the apply button (useful when value is read live via onChange). */
  hideApply?: boolean;
  /**
   * Called on every display change with the parsed number and the current
   * expression (empty until the user finishes with `=`).
   */
  onChange?: (value: number, expression: string) => void;
  className?: string;
}

/**
 * Full 4-function calculator (+, −, ×, ÷) with %, sign toggle, decimal, clear
 * and backspace. Self-contained — no eval, no external deps.
 *
 * Tracks the full operation chain so callers can persist *how* the result
 * was reached (e.g. "1050 ÷ 3 = 350"), not just the final number.
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
  /** Running chain text, e.g. "1050 ÷" or "10 + 5 ×". */
  const [chain, setChain] = useState<string>("");
  /** Final expression after `=`, e.g. "1050 ÷ 3 = 350". */
  const [finalExpr, setFinalExpr] = useState<string>("");

  useEffect(() => {
    onChange?.(parseFloat(display) || 0, finalExpr);
  }, [display, finalExpr, onChange]);

  const inputDigit = useCallback((d: string) => {
    setDisplay((cur) => {
      if (waiting) {
        setWaiting(false);
        // Starting fresh entry after a completed `=` resets the chain.
        if (finalExpr) {
          setFinalExpr("");
          setChain("");
          setPrev(null);
          setOp(null);
        }
        return d;
      }
      if (cur === "0") return d;
      if (cur.replace(/[^0-9]/g, "").length >= 14) return cur;
      return cur + d;
    });
  }, [waiting, finalExpr]);

  const inputDot = useCallback(() => {
    setDisplay((cur) => {
      if (waiting) {
        setWaiting(false);
        if (finalExpr) {
          setFinalExpr("");
          setChain("");
          setPrev(null);
          setOp(null);
        }
        return "0.";
      }
      return cur.includes(".") ? cur : cur + ".";
    });
  }, [waiting, finalExpr]);

  const clearAll = useCallback(() => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setWaiting(false);
    setChain("");
    setFinalExpr("");
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
    // Operator after `=`: continue from the result.
    if (finalExpr) {
      setFinalExpr("");
      setChain(`${formatResult(current)} ${next}`);
      setPrev(current);
      setOp(next);
      setWaiting(true);
      return;
    }
    if (prev == null) {
      setPrev(current);
      setChain(`${formatResult(current)} ${next}`);
    } else if (!waiting && op) {
      const result = compute(prev, current, op);
      setPrev(result);
      setDisplay(formatResult(result));
      setChain((c) => `${c} ${formatResult(current)} ${next}`);
    } else {
      // Operator after operator — swap the last operator.
      setChain((c) => c.replace(/[+\-×÷]\s*$/, next));
    }
    setOp(next);
    setWaiting(true);
  }, [display, prev, op, waiting, finalExpr]);

  const equals = useCallback(() => {
    if (op == null || prev == null) return;
    const current = parseFloat(display) || 0;
    const result = compute(prev, current, op);
    const expr = `${chain} ${formatResult(current)} = ${formatResult(result)}`.trim();
    setDisplay(formatResult(result));
    setFinalExpr(expr);
    setPrev(null);
    setOp(null);
    setWaiting(true);
    setChain("");
  }, [op, prev, display, chain]);

  // Keyboard support — works with the physical keyboard (PC) and external/soft
  // keyboards on mobile. Active when the calculator's root contains focus OR
  // when no editable element is focused (so the user can just type after
  // opening the calculator without tapping it first).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const root = document.querySelector("[data-fullcalc-root]") as HTMLElement | null;
      if (!root) return;
      const active = document.activeElement as HTMLElement | null;
      const isEditable =
        active &&
        active !== document.body &&
        !root.contains(active) &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.isContentEditable);
      if (isEditable) return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); inputDigit(e.key); return; }
      if (e.key === "." || e.key === ",") { e.preventDefault(); inputDot(); return; }
      if (e.key === "+" || e.key === "-") { e.preventDefault(); setOperator(e.key as "+"|"-"); return; }
      if (e.key === "*" || e.key.toLowerCase() === "x") { e.preventDefault(); setOperator("×"); return; }
      if (e.key === "/") { e.preventDefault(); setOperator("÷"); return; }
      if (e.key === "Enter" || e.key === "=") { e.preventDefault(); equals(); return; }
      if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); backspace(); return; }
      if (e.key === "Escape") { e.preventDefault(); clearAll(); return; }
      if (e.key === "%") { e.preventDefault(); percent(); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inputDigit, inputDot, setOperator, equals, backspace, clearAll, percent]);

  const liveExpression = finalExpr
    ? finalExpr
    : prev != null && op
      ? `${chain}${waiting ? "" : " " + display}`
      : "";

  return (
    <div data-fullcalc-root className={cn("space-y-3 rounded-md border bg-muted/30 p-3", className)}>
      {/* Display */}
      <div className="rounded-md border bg-background px-3 py-2 text-right">
        <div className="text-xs text-muted-foreground h-4 truncate" title={liveExpression}>
          {liveExpression || "\u00A0"}
        </div>
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
            onClick={() => onApply(parseFloat(display) || 0, finalExpr)}
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
  const fixed = Math.abs(n) < 1e-10 ? "0" : Number(n.toPrecision(12)).toString();
  return fixed;
}
