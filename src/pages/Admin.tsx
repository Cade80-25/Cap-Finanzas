import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, DollarSign, Key, Package, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  totalLicenses: number;
  usedLicenses: number;
  deliveredLicenses: number;
}

interface Order {
  id: string;
  customer_email: string;
  plan_type: string;
  amount: number;
  status: string;
  paypal_txn_id: string;
  created_at: string;
}

interface License {
  id: string;
  code: string;
  license_type: string;
  customer_email: string;
  is_used: boolean;
  is_delivered: boolean;
  created_at: string;
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [tab, setTab] = useState<"orders" | "licenses">("orders");

  const fetchData = async (pwd?: string) => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("admin-dashboard", {
        body: { password: pwd || password, action: "stats" },
      });
      if (fnError) throw fnError;
      if (data.error) {
        setError(data.error);
        setAuthenticated(false);
        return;
      }
      setStats(data.stats);
      setOrders(data.orders);
      setLicenses(data.licenses);
      setAuthenticated(true);
    } catch (err: any) {
      setError(err.message || "Error al conectar");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (!password.trim()) return;
    fetchData();
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle>Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Contraseña de administrador"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planLabel = (type: string) => {
    const map: Record<string, string> = {
      simple: "Simples",
      traditional: "Tradicional",
      full: "Completa",
      account: "Cuenta",
      refund: "Reembolso",
    };
    if (type.startsWith("upgrade_")) return `⬆ ${type.replace("upgrade_", "").replace(/_/g, " → ")}`;
    return map[type] || type;
  };

  const statusBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-green-600">Completado</Badge>;
    if (status === "refunded" || status === "reversed") return <Badge variant="destructive">Reembolsado</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Package className="h-4 w-4" /> Órdenes
                </div>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <DollarSign className="h-4 w-4" /> Ingresos Brutos
                </div>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <DollarSign className="h-4 w-4" /> Ingresos Netos
                </div>
                <p className="text-2xl font-bold text-green-600">${stats.netRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Key className="h-4 w-4" /> Licencias
                </div>
                <p className="text-2xl font-bold">{stats.totalLicenses}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.usedLicenses} usadas · {stats.deliveredLicenses} entregadas
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant={tab === "orders" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("orders")}
          >
            Órdenes ({orders.length})
          </Button>
          <Button
            variant={tab === "licenses" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("licenses")}
          >
            Licencias ({licenses.length})
          </Button>
        </div>

        {tab === "orders" && (
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Txn ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString("es")}
                      </TableCell>
                      <TableCell className="text-xs">{o.customer_email}</TableCell>
                      <TableCell>{planLabel(o.plan_type)}</TableCell>
                      <TableCell>${o.amount}</TableCell>
                      <TableCell>{statusBadge(o.status)}</TableCell>
                      <TableCell className="text-xs font-mono max-w-[120px] truncate">
                        {o.paypal_txn_id}
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay órdenes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {tab === "licenses" && (
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(l.created_at).toLocaleDateString("es")}
                      </TableCell>
                      <TableCell className="font-mono font-bold">{l.code}</TableCell>
                      <TableCell>{planLabel(l.license_type)}</TableCell>
                      <TableCell className="text-xs">{l.customer_email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {l.is_used && <Badge variant="secondary">Usada</Badge>}
                          {l.is_delivered && <Badge variant="outline">Entregada</Badge>}
                          {!l.is_used && !l.is_delivered && <Badge className="bg-green-600">Disponible</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {licenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay licencias
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
