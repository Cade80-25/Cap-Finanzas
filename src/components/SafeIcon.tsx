import { forwardRef, type ComponentType, type SVGProps } from "react";
import { HelpCircle, type LucideProps } from "lucide-react";

type IconLike = ComponentType<LucideProps> | ComponentType<SVGProps<SVGSVGElement>> | undefined | null;

interface SafeIconProps extends LucideProps {
  /** Icono original (puede ser undefined si el paquete no exportó ese símbolo). */
  icon: IconLike;
  /** Icono de respaldo. Default: HelpCircle. */
  fallback?: ComponentType<LucideProps>;
}

/**
 * Renderiza un ícono de lucide-react con un fallback seguro.
 * Si el ícono no existe (p.ej. tras un cambio de versión que removió el símbolo),
 * muestra un ícono genérico en lugar de romper la UI con un crash.
 *
 * Uso:
 *   import { Github } from "lucide-react";
 *   <SafeIcon icon={Github} className="h-4 w-4" />
 */
export const SafeIcon = forwardRef<SVGSVGElement, SafeIconProps>(
  ({ icon: Icon, fallback: Fallback = HelpCircle, ...props }, ref) => {
    try {
      if (Icon && typeof Icon === "function") {
        const Cmp = Icon as ComponentType<LucideProps>;
        return <Cmp ref={ref as never} {...props} />;
      }
    } catch {
      // Ignorar y caer al fallback.
    }
    return <Fallback ref={ref as never} aria-label="icono no disponible" {...props} />;
  }
);

SafeIcon.displayName = "SafeIcon";
