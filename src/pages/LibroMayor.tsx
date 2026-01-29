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
import { useAccountingData } from "@/hooks/useAccountingData";

export default function LibroMayor() {
  const { libroMayor } = useAccountingData();

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div data-tutorial="mayor-title">
        <h1 className="text-3xl font-bold mb-2">Libro Mayor</h1>
        <p className="text-muted-foreground">
          Movimientos agrupados por cuenta contable (desde Libro Diario)
        </p>
      </div>

      {libroMayor.length > 0 ? (
        <Tabs defaultValue={libroMayor[0]?.name} className="space-y-4">
          <TabsList data-tutorial="mayor-tabs" className="bg-muted flex-wrap h-auto gap-1">
            {libroMayor.map((account) => (
              <TabsTrigger 
                key={account.name} 
                value={account.name} 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {account.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {libroMayor.map((account) => (
            <TabsContent key={account.name} value={account.name}>
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>{account.label}</CardTitle>
                  <CardDescription>
                    Movimientos de la cuenta - Balance:{" "}
                    <span
                      className={`font-bold ${
                        account.balance >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      ${Math.abs(account.balance).toFixed(2)}
                    </span>
                    {" "}| Total Debe: ${account.totalDebit.toFixed(2)} | Total Haber: ${account.totalCredit.toFixed(2)}
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
      ) : (
        <Card className="shadow-soft">
          <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
            No hay cuentas registradas. Agrega transacciones en el Libro Diario para ver el Libro Mayor.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
