import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ModeComparison } from "./ModeComparison";
import { LicenseMode } from "@/hooks/useLicense";

interface ModeComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightMode?: LicenseMode;
}

export function ModeComparisonDialog({ open, onOpenChange, highlightMode }: ModeComparisonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Simple vs Completo
          </DialogTitle>
          <DialogDescription>
            Compará qué incluye cada modo con ejemplos claros
          </DialogDescription>
        </DialogHeader>
        <ModeComparison highlightMode={highlightMode} />
      </DialogContent>
    </Dialog>
  );
}
