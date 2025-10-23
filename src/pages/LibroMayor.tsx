import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const accounts = [
  {
    name: "Banco",
    transactions: [
      { date: "2025-10-20", description: "Salario Mensual", debit: 5000, credit: 0, balance: 5000 },
      { date: "2025-10-17", description: "Venta de Artículo", debit: 200, credit: 0, balance: 5200 },
    ],
    total: 5200,
  },
  {
    name: "Gastos Varios",
    transactions: [
      { date: "2025-10-19", description: "Supermercado", debit: 0, credit: 350, balance: -350 },
    ],
    total: -350,
  },
  {
    name: "Servicios",
    transactions: [
      { date: "2025-10-18", description: "Factura de Luz", debit: 0, credit: 120, balance: -120 },
    ],
    total: -120,
  },
];

export default function LibroMayor() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold mb-2">Libro Mayor</h1>
        <p className="text-muted-foreground">
          Movimientos agrupados por cuenta contable
        </p>
      </div>

      <Tabs defaultValue={accounts[0].name} className="space-y-4">
        <TabsList className="bg-muted">
          {accounts.map((account) => (
            <TabsTrigger key={account.name} value={account.name} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {account.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {accounts.map((account) => (
          <TabsContent key={account.name} value={account.name}>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>{account.name}</CardTitle>
                <CardDescription>
                  Movimientos de la cuenta - Balance:{" "}
                  <span
                    className={`font-bold ${
                      account.total >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    ${Math.abs(account.total).toFixed(2)}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Debe</TableHead>
                      <TableHead className="text-right">Haber</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {account.transactions.map((transaction, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="text-right font-medium text-success">
                          {transaction.debit > 0 ? `$${transaction.debit.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {transaction.credit > 0 ? `$${transaction.credit.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ${Math.abs(transaction.balance).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
