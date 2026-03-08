import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Key, Copy, Plus, Download, Trash2, Check, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface GeneratedLicense {
  code: string;
  type: "simple" | "traditional" | "full" | "account";
  createdAt: Date;
  customerEmail?: string;
  used: boolean;
}

// Simple hash function for license validation
function generateLicenseCode(type: "simple" | "traditional" | "full" | "account"): string {
  const prefix = type === "simple" ? "CF-SIMP" : type === "full" ? "CF-FULL" : type === "account" ? "CF-ACCT" : "CF-TRAD";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding confusing characters
  let code = "";
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add checksum digit
  let checksum = 0;
  for (let i = 0; i < code.length; i++) {
    checksum += code.charCodeAt(i);
  }
  const checksumChar = chars.charAt(checksum % chars.length);
  
  return `${prefix}-${code.substring(0, 4)}-${code.substring(4)}${checksumChar}`;
}

export default function LicenseGenerator() {
  const [licenses, setLicenses] = useState<GeneratedLicense[]>(() => {
    const saved = localStorage.getItem("cap-finanzas-generated-licenses");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedType, setSelectedType] = useState<"simple" | "traditional" | "full" | "account">("traditional");
  const [customerEmail, setCustomerEmail] = useState("");
  const [quantity, setQuantity] = useState(1);

  const saveLicenses = (newLicenses: GeneratedLicense[]) => {
    setLicenses(newLicenses);
    localStorage.setItem("cap-finanzas-generated-licenses", JSON.stringify(newLicenses));
  };

  const generateLicenses = () => {
    const newLicenses: GeneratedLicense[] = [];
    
    for (let i = 0; i < quantity; i++) {
      newLicenses.push({
        code: generateLicenseCode(selectedType),
        type: selectedType,
        createdAt: new Date(),
        customerEmail: customerEmail || undefined,
        used: false,
      });
    }
    
    saveLicenses([...newLicenses, ...licenses]);
    setCustomerEmail("");
    
    toast({
      title: `${quantity} licencia(s) generada(s)`,
      description: `Tipo: ${selectedType === "simple" ? "Finanzas Simples ($8)" : selectedType === "full" ? "Licencia Completa ($13)" : selectedType === "account" ? "Cuenta Adicional ($3)" : "Contabilidad Completa ($11)"}`,
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado",
      description: code,
    });
  };

  const deleteLicense = (code: string) => {
    const updated = licenses.filter((l) => l.code !== code);
    saveLicenses(updated);
    toast({
      title: "Licencia eliminada",
      variant: "destructive",
    });
  };

  const markAsUsed = (code: string) => {
    const updated = licenses.map((l) =>
      l.code === code ? { ...l, used: true } : l
    );
    saveLicenses(updated);
    toast({
      title: "Licencia marcada como usada",
    });
  };

  const exportCSV = () => {
    const headers = "Código,Tipo,Fecha,Email Cliente,Usada\n";
    const typeLabel = (t: string) => t === "simple" ? "Finanzas Simples" : t === "full" ? "Licencia Completa" : t === "account" ? "Cuenta Adicional" : "Contabilidad Completa";
    const rows = licenses
      .map(
        (l) =>
          `${l.code},${typeLabel(l.type)},${new Date(l.createdAt).toLocaleDateString()},${l.customerEmail || ""},${l.used ? "Sí" : "No"}`
      )
      .join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `licencias-cap-finanzas-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "CSV exportado",
      description: `${licenses.length} licencias exportadas`,
    });
  };

  const unusedCount = licenses.filter((l) => !l.used).length;
  const simpleCount = licenses.filter((l) => l.type === "simple").length;
  const traditionalCount = licenses.filter((l) => l.type === "traditional").length;
  const fullCount = licenses.filter((l) => l.type === "full").length;
  const accountCount = licenses.filter((l) => l.type === "account").length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Generador de Licencias
            </h1>
            <p className="text-muted-foreground mt-1">
              Herramienta administrativa para crear códigos de activación
            </p>
          </div>
          <Badge variant="outline" className="text-lg py-1 px-3">
            {unusedCount} disponibles
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Generadas</CardDescription>
              <CardTitle className="text-2xl">{licenses.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Finanzas Simples ($8)</CardDescription>
              <CardTitle className="text-2xl">{simpleCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Contabilidad ($11)</CardDescription>
              <CardTitle className="text-2xl">{traditionalCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completa ($13)</CardDescription>
              <CardTitle className="text-2xl">{fullCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cuenta Extra ($3)</CardDescription>
              <CardTitle className="text-2xl">{accountCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Generator Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Generar Nuevas Licencias
            </CardTitle>
            <CardDescription>
              Crea códigos de activación para enviar a tus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Licencia</Label>
                <Select value={selectedType} onValueChange={(v: "simple" | "traditional" | "full" | "account") => setSelectedType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Finanzas Simples ($8)</SelectItem>
                    <SelectItem value="traditional">Contabilidad Completa ($11)</SelectItem>
                    <SelectItem value="full">Licencia Completa ($13)</SelectItem>
                    <SelectItem value="account">Cuenta Adicional ($3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

        {/* Licenses Table */}
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
                    <TableHead>Tipo</TableHead>
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
                      <TableCell>
                        <Badge variant={license.type === "simple" ? "secondary" : license.type === "full" ? "outline" : license.type === "account" ? "secondary" : "default"}>
                          {license.type === "simple" ? "Simple $5" : license.type === "full" ? "Completa $12" : license.type === "account" ? "Cuenta $2" : "Contabilidad $10"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(license.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {license.customerEmail || "—"}
                      </TableCell>
                      <TableCell>
                        {license.used ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            Usada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-accent border-accent">
                            Disponible
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(license.code)}
                            title="Copiar código"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {!license.used && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsUsed(license.code)}
                              title="Marcar como usada"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteLicense(license.code)}
                            title="Eliminar"
                          >
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

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Cómo Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Formato de Códigos</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <code className="bg-muted px-1 rounded">CF-SIMP-XXXX-XXXXX</code> - Finanzas Simples</li>
                  <li>• <code className="bg-muted px-1 rounded">CF-TRAD-XXXX-XXXXX</code> - Contabilidad Completa</li>
                  <li>• El último carácter es un dígito de verificación</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Flujo de Venta</h4>
                <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>Cliente paga por PayPal ($5 o $10)</li>
                  <li>Generas una licencia del tipo correspondiente</li>
                  <li>Copias el código y lo envías por email</li>
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
