import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Info, Shield, Wifi, Smartphone, Coins, BookOpen, Sparkles, Heart } from "lucide-react";
import { MenubarItem } from "@/components/ui/menubar";
import packageJson from "../../package.json";

interface AboutDialogProps {
  /** Render as a menu item trigger (default) or a custom trigger element via children */
  asMenuItem?: boolean;
  children?: React.ReactNode;
}

const benefits = [
  {
    icon: Wifi,
    title: "100% offline",
    desc: "Todos tus datos quedan en tu dispositivo. Funciona sin conexión.",
  },
  {
    icon: Shield,
    title: "Privacidad total",
    desc: "Sin cuentas obligatorias ni rastreo. PIN local y respaldos manuales.",
  },
  {
    icon: Smartphone,
    title: "Multiplataforma",
    desc: "Windows, macOS, Linux, Android e iOS desde una misma licencia.",
  },
  {
    icon: Coins,
    title: "Doble modo contable",
    desc: "Modo Simple para uso personal o Tradicional con partida doble.",
  },
  {
    icon: BookOpen,
    title: "Aprender haciendo",
    desc: "Tutoriales interactivos, enciclopedia financiera y ayuda contextual.",
  },
  {
    icon: Sparkles,
    title: "Pago único",
    desc: "USD 10 de por vida. Sin suscripciones ni cargos recurrentes.",
  },
];

export function AboutDialog({ asMenuItem = false, children }: AboutDialogProps) {
  const [open, setOpen] = useState(false);

  const trigger = asMenuItem ? (
    <MenubarItem onSelect={(e) => { e.preventDefault(); setOpen(true); }}>
      <Info className="mr-2 h-4 w-4" />
      Acerca de Cap Finanzas
    </MenubarItem>
  ) : (
    children ?? (
      <button className="text-sm underline text-primary">Acerca de Cap Finanzas</button>
    )
  );

  return (
    <>
      {asMenuItem ? trigger : <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-md shrink-0">
                <img src="/icon-final.png" alt="Cap Finanzas" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl bg-gradient-primary bg-clip-text text-transparent">
                  Cap Finanzas
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Versión {packageJson.version} · Edición de por vida
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cap Finanzas es una aplicación de finanzas personales y contabilidad diseñada para
              individuos, profesionales y pequeños emprendimientos. Lleva tus ingresos, gastos,
              presupuestos, calendario financiero y libros contables desde una sola herramienta,
              sin depender de la nube y con tus datos siempre bajo tu control.
            </p>

            <Separator />

            <div>
              <p className="text-sm font-semibold mb-3">Beneficios principales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {benefits.map((b) => (
                  <div key={b.title} className="flex gap-3 p-3 rounded-lg bg-muted/40">
                    <b.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium">{b.title}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Sitio web</span>
                <a href="https://capfinanzas.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  capfinanzas.com
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span>Soporte</span>
                <a href="mailto:soporte@capfinanzas.com" className="text-primary hover:underline">
                  soporte@capfinanzas.com
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span>Licencia</span>
                <Badge variant="secondary" className="text-[10px]">Uso personal / pago único</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Tecnologías</span>
                <span>React · TypeScript · Electron</span>
              </div>
            </div>

            <Separator />

            <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
              Hecho con <Heart className="h-3 w-3 text-destructive fill-destructive" /> para ayudarte a ordenar tus finanzas.
            </p>
            <p className="text-[10px] text-center text-muted-foreground">
              © {new Date().getFullYear()} Cap Finanzas. Todos los derechos reservados.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
