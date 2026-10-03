import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Key, Copy, Plus, Download, Trash2, Shield, Mail, Loader2, Lock, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CONFIG } from "@/lib/config";

/**
 * Planes que ofrece el generador manual.
 * - `value` es el `license_type` real de la base (CHECK de public.licenses:
 *   simple, traditional, full, account).
 * - La etiqueta muestra el plan comercial de CONFIG.PRICING para que el vendedor
 *   no confunda "Personal" (pago unico) con "Empresarial" (semestral).
 */
const PLANS = [
  { value: "full", label: `Personal ($${CONFIG.PRICING.PERSONAL.price} · pago unico)` },
  { value: "account", label: `Empresarial ($${CONFIG.PRICING.EMPRESARIAL.price} · semestral)` },
  { value: "simple", label: "Simple (solo movimientos)" },
  { value: "traditional", label: "Tradicional (contabilidad completa)" },
] as const;

const PLAN_LABEL: Record<string, string> = Object.fromEntries(PLANS.map((p) => [p.value, p.label]));

interface LicenseRow {
  id: string;
  code: string;
  license_type: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_ref: string | null;
  is_used: boolean;
  is_delivered: boolean;
  revoked: boolean;
  created_at: string;
  activated_at: string | null;
}

export default function LicenseGenerator() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);

  // Formulario
  const [quantity, setQuantity] = useState(1);
  const [plan, setPlan] = useState<string>("full");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerRef, setCustomerRef] = useState("");
  const [sendByEmail, setSendByEmail] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<LicenseRow[]>([]);

  const sendLicenseEmail = useCallback(async (email: string, code: string, type: string) => {
    setSendingEmail(code);
    try {
      const { error } = await supabase.functions.invoke("send-license-email", {
        body: { email, licenseCode: code, licenseType: type },
      });
      if (error) throw error;
      toast({ title: "Email enviado", description: `Licencia enviada a ${email}` });
      return true;
    } catch (err: any) {
      toast({
        title: "Error al enviar email",
        description: err.message || "No se pudo enviar el correo",
        variant: "destructive",
      });
      return false;
    } finally {
      setSendingEmail(null);
    }
  }, []);

  const loadLicenses = useCallback(
    async (pwd?: string) => {
      const pass = pwd ?? password;
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("admin-dashboard", {
          body: { password: pass, action: "list-licenses" },
        });
        if (error) throw new Error(error.message || "No se pudo conectar");
        if (data?.error) throw new Error(data.error);
        setLicenses((data?.licenses ?? []) as LicenseRow[]);
        setAuthenticated(true);
      } catch (err: any) {
        setAuthenticated(false);
        toast({ title: "No se pudo conectar", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [password],
  );

  useEffect(() => {
    if (authenticated) void loadLicenses();
  }, [authenticated, loadLicenses]);

  const adminCall = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-dashboard", {
      body: { password, ...body },
    });
    if (error) throw new Error(error.message || "No se pudo conectar con el servidor");
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const generateLicenses = async () => {
    if (!authenticated) {
      toast({ title: "Falta la contrasena de administrador", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setLastCreated([]);
    try {
      const data = await adminCall({
        action: "create-licenses",
        quantity,
        licenseType: plan,
        email: customerEmail || undefined,
        name: customerName || undefined,
        ref: customerRef || undefined,
      });
      const created = (data?.created ?? []) as LicenseRow[];
      setLastCreated(created);
      toast({
        title: `${data?.createdCount ?? created.length} licencia(s) creada(s)`,
        description: `${PLAN_LABEL[plan] ?? plan} · ya quedan validas en el servidor`,
      });

      if (sendByEmail && customerEmail && created.length) {
        for (const lic of created) {
          await sendLicenseEmail(customerEmail, lic.code, lic.license_type);
        }
      }

      setCustomerEmail("");
      setCustomerName("");
      setCustomerRef("");
      await loadLicenses();
    } catch (err: any) {
      toast({ title: "Error al generar", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const toggleRevoked = async (code: string, revoked: boolean) => {
    try {
      await adminCall({ action: "set-license-revoked", code, revoked });
      toast({ title: revoked ? "Licencia revocada" : "Licencia reactivada", description: code });
      await loadLicenses();
    } catch (err: any) {
      toast({ title: "No se pudo actualizar", description: err.message, variant: "destructive" });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Codigo copiado", description: code });
  };

  const exportCSV = () => {
    const headers = "Codigo,Plan,Fecha,Email,Nombre,Identificacion,Estado\n";
    const rows = licenses
      .map((l) => {
        const estado = l.revoked ? "Revocada" : l.is_used ? "Usada" : "Disponible";
        return [l.code, l.license_type, new Date(l.created_at).toLocaleDateString(), l.customer_email || "", l.customer_name || "", l.customer_ref || "", estado].join(",");
      })
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

  const unusedCount = licenses.filter((l) => !l.is_used && !l.revoked).length;
  const usedCount = licenses.filter((l) => l.is_used).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Generador de Licencias
            </h1>
            <p className="text-muted-foreground mt-1">
              Las licencias se crean en el servidor y quedan validas al instante
            </p>
          </div>
          {authenticated && (
            <Badge variant="outline" className="text-lg py-1 px-3">
              {unusedCount} disponibles
            </Badge>
          )}
        </div>

        {!authenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Acceso de administrador
              </CardTitle>
              <CardDescription>Necesario para crear y consultar licencias reales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="space-y-2 flex-1">
                  <Label>Contrasena de administrador</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && password.trim() && loadLicenses()}
                  />
                </div>
                <Button className="gap-2" onClick={() => loadLicenses()} disabled={loading || !password.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Conectar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {authenticated && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total</CardDescription>
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
                  <CardTitle className="text-2xl">{usedCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" /> Generar nuevas licencias
                </CardTitle>
                <CardDescription>Los datos del cliente son opcionales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Select value={quantity.toString()} onValueChange={(v) => setQuantity(parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 5, 10, 25, 50, 100].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} {n === 1 ? "licencia" : "licencias"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de plan</Label>
                    <Select value={plan} onValueChange={setPlan}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLANS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Email (opcional)</Label>
                    <Input
                      type="email"
                      placeholder="cliente@email.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre (opcional)</Label>
                    <Input
                      placeholder="Nombre y apellido"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Identificacion (opcional)</Label>
                    <Input
                      placeholder="DNI, telefono, usuario interno..."
                      value={customerRef}
                      onChange={(e) => setCustomerRef(e.target.value)}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground pb-2">
                    <Checkbox
                      checked={sendByEmail}
                      onCheckedChange={(v) => setSendByEmail(Boolean(v))}
                      disabled={!customerEmail}
                    />
                    Enviar por correo al cliente
                  </label>
                  <Button className="w-full gap-2" onClick={generateLicenses} disabled={generating}>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Generar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {lastCreated.length > 0 && (
              <Card className="border-primary/40">
                <CardHeader>
                  <CardTitle>Licencias recien creadas</CardTitle>
                  <CardDescription>Ya estan validas: copialas o envialas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {lastCreated.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                      <span className="font-mono font-medium">{l.code}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{PLAN_LABEL[l.license_type] ?? l.license_type}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(l.code)} title="Copiar">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Licencias en el servidor</CardTitle>
                  <CardDescription>Historial real de la base de datos</CardDescription>
                </div>
                {licenses.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
                    <Download className="h-4 w-4" /> Exportar CSV
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {licenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Todavia no hay licencias</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {licenses.map((license) => {
                        const cliente = [license.customer_name, license.customer_email, license.customer_ref]
                          .filter(Boolean)
                          .join(" · ") || "—";
                        return (
                          <TableRow key={license.id} className={license.revoked ? "opacity-50" : ""}>
                            <TableCell className="font-mono font-medium">{license.code}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {PLAN_LABEL[license.license_type] ?? license.license_type}
                            </TableCell>
                            <TableCell>{new Date(license.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-muted-foreground">{cliente}</TableCell>
                            <TableCell>
                              {license.revoked ? (
                                <Badge variant="outline" className="text-destructive border-destructive">Revocada</Badge>
                              ) : license.is_used ? (
                                <Badge variant="outline" className="text-muted-foreground">Usada</Badge>
                              ) : (
                                <Badge variant="outline" className="text-accent border-accent">Disponible</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(license.code)} title="Copiar codigo">
                                  <Copy className="h-4 w-4" />
                                </Button>
                                {license.customer_email && !license.is_used && !license.revoked && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => sendLicenseEmail(license.customer_email!, license.code, license.license_type)}
                                    disabled={sendingEmail === license.code}
                                    title="Enviar por email"
                                  >
                                    {sendingEmail === license.code ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleRevoked(license.code, !license.revoked)}
                                  title={license.revoked ? "Reactivar" : "Revocar"}
                                >
                                  {license.revoked ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Como usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Formato de codigos</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <code className="bg-muted px-1 rounded">CF-SIMPLE-XXXX-XXXXX</code> — plan Simple</li>
                  <li>• <code className="bg-muted px-1 rounded">CF-TRAD-XXXX-XXXXX</code> — plan Tradicional</li>
                  <li>• <code className="bg-muted px-1 rounded">CF-FULL-XXXX-XXXXX</code> — plan Full</li>
                  <li>• <code className="bg-muted px-1 rounded">CF-ACCT-XXXX-XXXXX</code> — plan Cuenta</li>
                  <li>• El ultimo caracter es un digito de verificacion</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Flujo de venta</h4>
                <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>Cliente paga por PayPal</li>
                  <li>Generas la licencia (plan + datos del cliente)</li>
                  <li>Se entrega por correo o copiando el codigo</li>
                  <li>El cliente la activa en la app</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
