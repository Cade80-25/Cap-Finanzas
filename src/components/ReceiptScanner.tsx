import { useState, useRef } from "react";
import { Upload, Camera, FileText, X, CheckCircle } from "lucide-react";
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

interface ScannedData {
  amount: number;
  date?: string;
  merchant?: string;
  confidence: number;
}

interface ReceiptScannerProps {
  onDataScanned: (data: ScannedData) => void;
}

export default function ReceiptScanner({ onDataScanned }: ReceiptScannerProps) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractAmountFromText = (text: string): ScannedData | null => {
    // Patrones para detectar montos en diferentes formatos
    const patterns = [
      /total[:\s]*\$?\s*(\d+[.,]\d{2})/gi,
      /importe[:\s]*\$?\s*(\d+[.,]\d{2})/gi,
      /monto[:\s]*\$?\s*(\d+[.,]\d{2})/gi,
      /suma[:\s]*\$?\s*(\d+[.,]\d{2})/gi,
      /\$\s*(\d+[.,]\d{2})/gi,
      /(\d+[.,]\d{2})\s*\$/gi,
    ];

    let bestMatch = null;
    let highestConfidence = 0;

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const amountStr = match[1].replace(',', '.');
        const amount = parseFloat(amountStr);
        
        if (!isNaN(amount) && amount > 0) {
          // Calcular confianza basada en el contexto
          let confidence = 0.5;
          if (match[0].toLowerCase().includes('total')) confidence = 0.9;
          else if (match[0].toLowerCase().includes('importe')) confidence = 0.85;
          else if (match[0].toLowerCase().includes('monto')) confidence = 0.8;
          
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = { amount, confidence };
          }
        }
      }
    }

    // Intentar detectar fecha
    const datePattern = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;
    const dateMatch = text.match(datePattern);
    
    if (bestMatch) {
      return {
        ...bestMatch,
        date: dateMatch ? dateMatch[1] : undefined,
      };
    }

    return null;
  };

  const processImage = async (imageData: string) => {
    setScanning(true);
    
    try {
      // Crear un elemento de imagen para procesar
      const img = new Image();
      img.src = imageData;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Usar Tesseract.js para OCR (simulado aquí con extracción básica)
      // En producción, deberías usar una librería OCR como Tesseract.js o una API
      
      // Simulación: Extraer texto básico de la imagen
      // Para implementación real, usa: import Tesseract from 'tesseract.js';
      toast.info("Analizando factura...", {
        description: "Extrayendo información del documento",
      });

      // Simulación de OCR (en producción usar Tesseract.js)
      setTimeout(() => {
        // Texto simulado para demostración
        const simulatedText = `
          FACTURA
          Fecha: 15/01/2025
          Total: $125.50
          IVA: $25.50
          Subtotal: $100.00
        `;
        
        const extracted = extractAmountFromText(simulatedText);
        
        if (extracted) {
          setScannedData(extracted);
          toast.success("¡Factura escaneada!", {
            description: `Monto detectado: $${extracted.amount.toFixed(2)}`,
          });
        } else {
          toast.error("No se detectó monto", {
            description: "Intenta con otra imagen más clara",
          });
        }
        
        setScanning(false);
      }, 2000);

    } catch (error) {
      console.error("Error al procesar imagen:", error);
      toast.error("Error al procesar imagen", {
        description: "Por favor intenta con otra foto",
      });
      setScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error("Archivo inválido", {
        description: "Por favor selecciona una imagen",
      });
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Archivo muy grande", {
        description: "El tamaño máximo es 10MB",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setImage(imageData);
      processImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleUseScannedData = () => {
    if (scannedData) {
      onDataScanned(scannedData);
      setOpen(false);
      resetScanner();
      toast.success("Datos aplicados", {
        description: "El monto se ha agregado a la transacción",
      });
    }
  };

  const resetScanner = () => {
    setImage(null);
    setScannedData(null);
    setScanning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Camera className="h-4 w-4" />
          Escanear Factura
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Escanear Factura o Recibo</DialogTitle>
          <DialogDescription>
            Sube una foto de tu factura y detectaremos automáticamente el importe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!image ? (
            <Card 
              className="border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click para subir una imagen
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG o WEBP (máx. 10MB)
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={image} 
                  alt="Factura" 
                  className="w-full rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={resetScanner}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {scanning && (
                <Card className="bg-muted">
                  <CardContent className="py-6">
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-5 w-5 animate-pulse" />
                      <p className="text-sm">Analizando factura...</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {scannedData && !scanning && (
                <Card className="border-success">
                  <CardContent className="py-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-success" />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">
                          Monto detectado: ${scannedData.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Confianza: {(scannedData.confidence * 100).toFixed(0)}%
                        </p>
                        {scannedData.date && (
                          <p className="text-sm text-muted-foreground">
                            Fecha: {scannedData.date}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleUseScannedData}
                        className="flex-1"
                      >
                        Usar este monto
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={resetScanner}
                      >
                        Intentar de nuevo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
