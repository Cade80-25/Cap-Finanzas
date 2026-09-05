import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Key, Copy, Plus, Download, Trash2, Check, Shield, Mail, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GeneratedLicense {
  code: string;
  type: "full";
  createdAt: Date;
  customerEmail?: string;
  used: boolean;
}

/**
 * Genera un código de licencia usando crypto.getRandomValues() para
 * aleatoriedad criptográficamente segura.
 */
function generateLicenseCode(): string {
  const prefix = "CF-FULL";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  // Usar crypto.getRandomValues() en vez de Math.random()
  const randomBytes = new Uint32Array(8);
  crypto.getRandomValues(randomBytes);

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(randomBytes[i] % chars.length);
  }

  let checksum = 0;
  for (let i = 0; i < code.length; i++) {
    checksum += code.charCodeAt(i);
  }
  const checksumChar = chars.charAt(checksum % chars.length);

  return `${prefix}-${code.substring(0, 4)}-${code.substring(4)}${checksumChar}`;
}

export default function LicenseGenerator() {
  // Gate: no renderizar en producción
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Herramienta de Desarrollo
            </CardTitle>
            <CardDescription>
              El generador de licencias está disponible solo en modo desarrollo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Esta herramienta es para uso interno del equipo de Cap Finanzas y
              no está disponible en la aplicación instalada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <LicenseGeneratorInner />;
}

function LicenseGeneratorInner() {
  const [licenses, setLicenses] = useState<GeneratedLicense[]>(() => {
    const saved = localStorage.getItem("cap-finanzas-generated-licenses");
    return saved ? JSON.parse(saved) : [];
  });
  const [customerEmail, setCustomerEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const saveLicenses = (newLicenses: GeneratedLicense[]) => {
    setLicenses(newLicenses);
    localStorage.setItem("cap-finanzas-generated-licenses", JSON.stringify(newLicenses));
  };

  const sendLicenseEmail = async (email: string, code: string, type: string) => {
    setSendingEmail(code);
    try {
      const { data, error } = await supabase.functions.invoke("send-license-email", {
        body: { email, licenseCode: code, licenseType: type },
      });

      if (error) throw error;

      toast({
        title: "Email enviado ✉️",
        description: `Licencia enviada a ${email}`,
      });
      return true;
    } catch (err: any) {
      console.error("Error sending email:", err);
      toast({
        title: "Error al enviar email",
        description: err.message || "No se pudo enviar el correo",
        variant: "destructive",
      });
      return false;
    } finally {
      setSendingEmail(null);
    }
  };

  const generateLicenses = async () => {
    const newLicenses: GeneratedLicense[] = [];

    for (let i = 0; i < quantity; i++) {
      newLicenses.push({
        code: generateLicenseCode(),
        type: "full",
        createdAt: new Date(),
        customerEmail: customerEmail || undefined,
        used: false,
      });
    }

    saveLicenses([...newLicenses, ...licenses]);

    toast({
      title: `${quantity} licencia(s) generada(s)`,
      description: "Cap Finanzas — Acceso Completo ($10 USD)",
    });

    if (customerEmail) {
      for (const lic of newLicenses) {
        await sendLicenseEmail(customerEmail, lic.code, lic.type);
      }
    }

    setCustomerEmail("");
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado", description: code });
  };

  const deleteLicense = (code: string) => {
    saveLicenses(licenses.filter((l) => l.code !== code));
    toast({ title: "Licencia eliminada", variant: "destructive" });
  };

  const markAsUsed = (code: string) => {
    saveLicenses(licenses.map((l) => l.code === code ? { ...l, used: true } : l));
    toast({ title: "Licencia marcada como usada" });
  };

  const exportCSV = () => {
    const headers = "Código,Fecha,Email Cliente,Usada\n";
    const rows = licenses
      .map((l) => `${l.code},${new Date(l.createdAt).toLocaleDateString()},${l.customerEmail || ""},${l.used ? "Sí" : "No"}`)
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `licencias-cap-finanzas-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "CSV exportado", description: `${licenses.length} licencias exportadas` });
  };

  const unusedCount = licenses.filter((l) => !l.used).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Generador de Licencias
            </h1>
            <p className="text-muted-foreground mt-1">
              Licencia única — Acceso Completo ($10 USD)
            </p>
          </div>
          <Badge variant="outline" className="text-lg py-1 px-3">
            {unusedCount} disponibles
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Generadas</CardDescription>
              <CardTitle className="text-2xl">{licenses.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Disponibles</CardDescription>
              <CardTitle className="text-2xl">{unusedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Usadas</CardDescription>
              <CardTitle className="text-2xl">{licenses.length - unusedCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Generar Nuevas Licencias
            </CardTitle>
            <CardDescription>
              Cada licencia desbloquea acceso completo a Cap Finanzas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Select value={quantity.toString()} onValueChange={(v) => setQuantity(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 5, 10, 25, 50].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n === 1 ? "licencia" : "licencias"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email del Cliente (opcional)</Label>
                <Input
                  type="email"
                  placeholder="cliente@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full gap-2" onClick={generateLicenses}>
                  <Plus className="h-4 w-4" />
                  Generar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Licencias Generadas</CardTitle>
              <CardDescription>Historial de todos los códigos creados</CardDescription>
            </div>
            {licenses.length > 0 && (
              <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {licenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay licencias generadas aún</p>
                <p className="text-sm">Usa el formulario de arriba para crear códigos</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) => (
                    <TableRow key={license.code} className={license.used ? "opacity-50" : ""}>
                      <TableCell className="font-mono font-medium">{license.code}</TableCell>
                      <TableCell>{new Date(license.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {license.customerEmail || "—"}
                      </TableCell>
                      <TableCell>
                        {license.used ? (
                          <Badge variant="outline" className="text-muted-foreground">Usada</Badge>
                        ) : (
                          <Badge variant="outline" className="text-accent border-accent">Disponible</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(license.code)} title="Copiar código">
                            <Copy className="h-4 w-4" />
                          </Button>
                          {license.customerEmail && !license.used && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sendLicenseEmail(license.customerEmail!, license.code, license.type)}
                              disabled={sendingEmail === license.code}
                              title="Enviar por email"
                            >
                              {sendingEmail === license.code ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            </Button>
                          )}
                          {!license.used && (
                            <Button variant="ghost" size="icon" onClick={() => markAsUsed(license.code)} title="Marcar como usada">
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => deleteLicense(license.code)} title="Eliminar">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cómo Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Formato de Códigos</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <code className="bg-muted px-1 rounded">CF-FULL-XXXX-XXXXX</code> — Acceso Completo</li>
                  <li>• El último carácter es un dígito de verificación</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Flujo de Venta</h4>
                <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>Cliente paga $10 USD por PayPal</li>
                  <li>Se genera y envía la licencia automáticamente</li>
                  <li>Cliente activa en la app con el código</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
