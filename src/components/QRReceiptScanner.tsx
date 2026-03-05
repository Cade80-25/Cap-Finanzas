import { useState, useRef, useEffect, useCallback } from "react";
import { QrCode, X, CheckCircle, Camera, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useLicense } from "@/hooks/useLicense";

interface QRScannedData {
  amount?: number;
  date?: string;
  description?: string;
  merchant?: string;
  type?: "income" | "expense";
  category?: string;
  rawData: string;
}

interface QRReceiptScannerProps {
  onDataScanned: (data: QRScannedData) => void;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "default" | "sm" | "icon";
}

/**
 * Parse CFE (Comprobante Fiscal Electrónico) Uruguay QR data.
 * CFE QR codes typically contain URLs like:
 * https://www.efactura.dgi.gub.uy/consultaQR/cfe?...
 * with params: rut, tipo, serie, nro, monto, fecha, etc.
 */
function parseCFEData(text: string): QRScannedData | null {
  try {
    const url = new URL(text);
    const isDGI =
      url.hostname.includes("dgi.gub.uy") ||
      url.hostname.includes("efactura") ||
      url.pathname.includes("cfe");

    if (!isDGI) return null;

    const params = url.searchParams;
    const monto = params.get("TotalAmount") || params.get("monto") || params.get("MontoTotal");
    const fecha = params.get("FechaEmision") || params.get("fecha") || params.get("Fecha");
    const rut = params.get("RucEmisor") || params.get("rut");
    const serie = params.get("Serie") || params.get("serie");
    const nro = params.get("Nro") || params.get("nro");

    const result: QRScannedData = {
      rawData: text,
      type: "expense",
    };

    if (monto) {
      const cleaned = monto.replace(/[^\d.,]/g, "").replace(",", ".");
      result.amount = parseFloat(cleaned);
    }

    if (fecha) result.date = fecha;
    if (rut) result.merchant = `RUT: ${rut}`;
    if (serie && nro) result.description = `CFE ${serie}-${nro}`;

    return result;
  } catch {
    return null;
  }
}

/**
 * Parse generic QR codes that may contain transaction info
 */
function parseGenericQR(text: string): QRScannedData {
  const result: QRScannedData = { rawData: text, type: "expense" };

  // Try to extract amounts from text
  const amountPatterns = [
    /(?:total|monto|importe|amount)[:\s]*\$?\s*([\d.,]+)/gi,
    /\$([\d.,]+)/g,
    /([\d]+[.,]\d{2})\b/g,
  ];

  for (const pattern of amountPatterns) {
    const match = pattern.exec(text);
    if (match) {
      const cleaned = match[1].replace(",", ".");
      const amount = parseFloat(cleaned);
      if (!isNaN(amount) && amount > 0 && amount < 1000000) {
        result.amount = amount;
        break;
      }
    }
  }

  // Try to extract date
  const datePattern = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;
  const dateMatch = text.match(datePattern);
  if (dateMatch) result.date = dateMatch[1];

  // Use the text as description if short enough
  if (text.length < 200) {
    result.description = text.substring(0, 100);
  }

  return result;
}

export default function QRReceiptScanner({
  onDataScanned,
  triggerVariant = "outline",
  triggerSize = "default",
}: QRReceiptScannerProps) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<QRScannedData | null>(null);
  const scannerRef = useRef<any>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const { status, purchasedModes } = useLicense();

  // Only available for paid users (traditional or full license)
  const isPaid = status === "active" && (
    purchasedModes.includes("traditional") || purchasedModes.length >= 2
  );
  const isTrialOrPaid = status === "trial" || isPaid;

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      stopScanner();

      // Try CFE Uruguay first
      let data = parseCFEData(decodedText);

      // Fall back to generic QR parsing
      if (!data) {
        data = parseGenericQR(decodedText);
      }

      setScannedData(data);

      if (data.amount) {
        toast.success("¡QR escaneado!", {
          description: `Monto detectado: $${data.amount.toFixed(2)}`,
        });
      } else {
        toast.info("QR leído", {
          description: "No se detectó un monto automáticamente. Puedes ingresarlo manualmente.",
        });
      }
    },
    [stopScanner]
  );

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        handleScanSuccess,
        () => {} // ignore scan failures (normal when no QR in view)
      );
    } catch (err) {
      console.error("Error starting QR scanner:", err);
      setScanning(false);
      toast.error("No se pudo acceder a la cámara", {
        description: "Verifica los permisos de cámara en tu navegador.",
      });
    }
  }, [handleScanSuccess]);

  // Clean up on unmount or dialog close
  useEffect(() => {
    if (!open) {
      stopScanner();
      setScannedData(null);
    }
  }, [open, stopScanner]);

  const handleUseData = () => {
    if (scannedData) {
      onDataScanned(scannedData);
      setOpen(false);
      toast.success("Datos aplicados al movimiento");
    }
  };

  if (!isTrialOrPaid) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className="gap-2">
          <QrCode className="h-4 w-4" />
          {triggerSize !== "icon" && "Escanear QR"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Escanear Código QR
          </DialogTitle>
          <DialogDescription>
            Apunta la cámara al código QR de tu recibo o factura electrónica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!scannedData ? (
            <>
              <div
                id="qr-reader"
                ref={videoRef}
                className="w-full rounded-lg overflow-hidden bg-muted min-h-[300px] flex items-center justify-center"
              >
                {!scanning && (
                  <div className="text-center p-6">
                    <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Presiona el botón para iniciar la cámara
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!scanning ? (
                  <Button onClick={startScanner} className="flex-1 gap-2">
                    <Camera className="h-4 w-4" />
                    Iniciar Cámara
                  </Button>
                ) : (
                  <Button
                    onClick={stopScanner}
                    variant="destructive"
                    className="flex-1 gap-2"
                  >
                    <StopCircle className="h-4 w-4" />
                    Detener
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Compatible con QR de facturas electrónicas (CFE Uruguay) y códigos QR genéricos
              </p>
            </>
          ) : (
            <Card className="border-primary/30">
              <CardContent className="py-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    {scannedData.amount ? (
                      <p className="font-semibold text-lg">
                        Monto: ${scannedData.amount.toFixed(2)}
                      </p>
                    ) : (
                      <p className="font-semibold text-lg">QR leído correctamente</p>
                    )}
                    {scannedData.date && (
                      <p className="text-sm text-muted-foreground">Fecha: {scannedData.date}</p>
                    )}
                    {scannedData.merchant && (
                      <p className="text-sm text-muted-foreground">{scannedData.merchant}</p>
                    )}
                    {scannedData.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {scannedData.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUseData} className="flex-1">
                    Usar estos datos
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScannedData(null);
                      startScanner();
                    }}
                  >
                    Escanear otro
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
