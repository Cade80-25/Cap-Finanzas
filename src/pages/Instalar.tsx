import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, CheckCircle2, Share, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Instalar() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <CheckCircle2 className="h-20 w-20 text-success mb-6" />
        <h1 className="text-3xl font-bold mb-2">¡App Instalada!</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Cap Finanzas ya está instalada en tu dispositivo. Puedes abrirla desde tu pantalla de inicio.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center">
        <div className="h-20 w-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
          <img src="/icon-final.png" alt="Cap Finanzas" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Instalar Cap Finanzas
        </h1>
        <p className="text-muted-foreground mt-2">
          Instala la app en tu dispositivo para acceder más rápido y usarla sin conexión
        </p>
      </div>

      {/* Direct install button for Android/Desktop Chrome */}
      {deferredPrompt && (
        <Card className="border-primary/50">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <Download className="h-10 w-10 text-primary" />
            <p className="text-center font-medium">Tu navegador soporta instalación directa</p>
            <Button size="lg" onClick={handleInstall} className="w-full max-w-xs shadow-soft">
              <Download className="h-5 w-5 mr-2" />
              Instalar Ahora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* iOS instructions */}
      {isIOS && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Instrucciones para iPhone / iPad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">1</div>
              <div>
                <p className="font-medium">Toca el botón Compartir</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Es el ícono <Share className="h-4 w-4 inline" /> en la barra inferior de Safari
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">2</div>
              <div>
                <p className="font-medium">Selecciona "Agregar a Inicio"</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Busca la opción <Plus className="h-4 w-4 inline" /> Agregar a pantalla de inicio
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">3</div>
              <div>
                <p className="font-medium">Confirma "Agregar"</p>
                <p className="text-sm text-muted-foreground">La app aparecerá en tu pantalla de inicio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Android instructions (when no prompt available) */}
      {!isIOS && !deferredPrompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Instrucciones para Android
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">1</div>
              <div>
                <p className="font-medium">Abre el menú del navegador</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Toca los tres puntos <MoreVertical className="h-4 w-4 inline" /> en la esquina superior
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">2</div>
              <div>
                <p className="font-medium">Selecciona "Instalar app" o "Agregar a inicio"</p>
                <p className="text-sm text-muted-foreground">La opción puede variar según tu navegador</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">3</div>
              <div>
                <p className="font-medium">Confirma la instalación</p>
                <p className="text-sm text-muted-foreground">La app aparecerá en tu pantalla de inicio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Smartphone className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium text-sm">Sin tiendas</p>
            <p className="text-xs text-muted-foreground">Instala directo desde el navegador</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Download className="h-8 w-8 mx-auto mb-2 text-success" />
            <p className="font-medium text-sm">Funciona offline</p>
            <p className="text-xs text-muted-foreground">Usa la app sin conexión</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Monitor className="h-8 w-8 mx-auto mb-2 text-accent-foreground" />
            <p className="font-medium text-sm">PC y Celular</p>
            <p className="text-xs text-muted-foreground">Funciona en cualquier dispositivo</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}