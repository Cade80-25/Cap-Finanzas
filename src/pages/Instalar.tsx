import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, CheckCircle2, Share, MoreVertical, Plus, Apple, Laptop, ShieldCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useLicense } from "@/hooks/useLicense";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const GITHUB_RELEASES = "https://github.com/Cade80-25/cap-finanzas/releases/latest";

export default function Instalar() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();
  const { status } = useLicense();
  const hasLicense = status === "active" || status === "trial";

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

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
    <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="h-20 w-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
          <img src="/icon-final.png" alt="Cap Finanzas" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Descargar Cap Finanzas
        </h1>
        <p className="text-muted-foreground mt-2">
          Disponible para celular, tablet y escritorio
        </p>
      </div>

      {/* Purchase requirement notice */}
      <Alert className="border-primary/30 bg-primary/5">
        <CreditCard className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <span className="font-medium">
            Las descargas para celular y escritorio serán autorizadas una vez realizada la compra de la licencia.
          </span>
          <span className="text-sm text-muted-foreground">
            Puedes probar la aplicación gratis durante 30 días. Para continuar usándola, adquiere tu licencia por PayPal y recibe tu código de activación. Con la licencia activa podrás descargar e instalar Cap Finanzas en cualquier dispositivo.
          </span>
          {!hasLicense && (
            <Button variant="outline" size="sm" className="w-fit mt-1" onClick={() => navigate("/landing")}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Ver planes y precios
            </Button>
          )}
          {hasLicense && (
            <Badge variant="default" className="w-fit">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Licencia {status === "trial" ? "de prueba activa" : "activada"}
            </Badge>
          )}
        </AlertDescription>
      </Alert>

      {/* Tabs: Mobile / Desktop */}
      <Tabs defaultValue="mobile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mobile" className="gap-2">
            <Smartphone className="h-4 w-4" />
            Celular / Tablet
          </TabsTrigger>
          <TabsTrigger value="desktop" className="gap-2">
            <Monitor className="h-4 w-4" />
            Escritorio
          </TabsTrigger>
        </TabsList>

        {/* ===== MOBILE TAB ===== */}
        <TabsContent value="mobile" className="space-y-4 mt-4">
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
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="h-5 w-5" />
                  iPhone / iPad
                </CardTitle>
                <CardDescription>Instala como app desde Safari</CardDescription>
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

          {/* Android instructions */}
          {!isIOS && !deferredPrompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="h-5 w-5" />
                  Android
                </CardTitle>
                <CardDescription>Instala como app desde Chrome</CardDescription>
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

          <p className="text-xs text-muted-foreground text-center">
            Todas las versiones incluyen 30 días de prueba. Después necesitarás activar tu licencia para continuar usando la app.
          </p>
        </TabsContent>

        {/* ===== DESKTOP TAB ===== */}
        <TabsContent value="desktop" className="space-y-4 mt-4">
          {!hasLicense && (
            <Alert variant="destructive" className="bg-destructive/5">
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Necesitas una licencia activa para descargar la versión de escritorio.</span>{" "}
                <Button variant="link" className="p-0 h-auto text-destructive" onClick={() => navigate("/landing")}>
                  Adquirir licencia →
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            {/* Windows */}
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Monitor className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Windows</p>
                  <p className="text-sm text-muted-foreground">Instalador .exe — Windows 10/11</p>
                </div>
                <Button
                  onClick={() => window.open(GITHUB_RELEASES, "_blank")}
                  disabled={!hasLicense}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </CardContent>
            </Card>

            {/* macOS */}
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Apple className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">macOS</p>
                  <p className="text-sm text-muted-foreground">Archivo .dmg — macOS 11+</p>
                </div>
                <Button
                  onClick={() => window.open(GITHUB_RELEASES, "_blank")}
                  disabled={!hasLicense}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </CardContent>
            </Card>

            {/* Linux */}
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <Laptop className="h-6 w-6 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Linux</p>
                  <p className="text-sm text-muted-foreground">AppImage / .deb — Ubuntu, Fedora, etc.</p>
                </div>
                <Button
                  onClick={() => window.open(GITHUB_RELEASES, "_blank")}
                  disabled={!hasLicense}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Desktop install instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instrucciones de instalación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">1</div>
                <p className="text-sm"><span className="font-medium">Adquiere tu licencia</span> — Realiza el pago vía PayPal y recibe tu código de activación.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">2</div>
                <p className="text-sm"><span className="font-medium">Descarga el instalador</span> — Selecciona la versión para tu sistema operativo arriba.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">3</div>
                <p className="text-sm"><span className="font-medium">Instala y activa</span> — Ejecuta el instalador y activa con tu código en Licencia → Activar Licencia.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
            <p className="font-medium text-sm">Multiplataforma</p>
            <p className="text-xs text-muted-foreground">Windows, Mac, Linux y celular</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
