import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Mail, KeyRound, Loader2, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function CheckoutSuccess() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Email inválido", description: "Revisá el formato.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("resend-license-by-email", {
        body: { email: trimmed },
      });
      if (error || !data?.success) {
        toast({
          title: "No pudimos reenviarla",
          description:
            data?.error ||
            "No encontramos una licencia para ese correo. Revisá tu bandeja o escribinos.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Listo!",
          description: "Te reenviamos la licencia al correo. Revisá también spam.",
        });
        setEmail("");
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo conectar. Probá de nuevo en un minuto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>¡Gracias por tu compra! — Cap Finanzas</title>
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="https://capfinanzas.com/checkout/success" />
      </Helmet>

      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/landing" className="flex items-center gap-2 font-semibold">
            <Calculator className="h-5 w-5 text-primary" />
            Cap Finanzas
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">¡Gracias por tu compra!</h1>
          <p className="text-muted-foreground text-lg">
            Te enviamos tu código de licencia al correo. Suele llegar en menos de un minuto.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Cómo activar tu licencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span>Abrí tu correo y copiá el código que empieza con <code className="bg-muted px-1.5 py-0.5 rounded">CF-FULL-…</code></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span>
                  En Cap Finanzas, andá a <strong>Ajustes → Configuración → Licencia</strong> y
                  hacé clic en <strong>"Activar con código"</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <span>Pegá el código y listo. Tu acceso queda activado de por vida.</span>
              </li>
            </ol>
            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <Button asChild className="flex-1">
                <Link to="/ajustes?tab=configuracion">Ir a Activar licencia</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/landing">Volver al inicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              ¿No recibiste tu licencia?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ingresá el correo con el que pagaste y te la reenviamos al instante. Revisá
              también la carpeta de spam o promociones.
            </p>
            <form onSubmit={handleResend} className="space-y-3">
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Buscando…
                  </>
                ) : (
                  "Reenviar mi licencia"
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Si seguís sin recibirla, escribinos a{" "}
              <a href="mailto:soporte@capfinanzas.com" className="text-primary hover:underline">
                soporte@capfinanzas.com
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
