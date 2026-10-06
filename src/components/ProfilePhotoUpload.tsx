import { useState, useRef, useEffect } from "react";
import { Camera, X, Check, Loader2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProfilePhotoUploadProps {
  profileId: string;
  currentPhotoUrl?: string | null;
  currentAvatar: string;
  onPhotoUploaded: (url: string) => void;
  onPhotoRemoved: () => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];
const MIN_BYTES = 1024; // 1KB
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ProfilePhotoUpload({
  profileId,
  currentPhotoUrl,
  currentAvatar,
  onPhotoUploaded,
  onPhotoRemoved,
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manage object URL lifecycle for preview
  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    setPreviewError(null);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
      reader.readAsDataURL(file);
    });

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (file: File): string | null => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return `Extensión .${ext || "?"} no permitida. Usa JPG, PNG, GIF o WEBP.`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "El archivo no parece ser una imagen válida. Solo JPG, PNG, GIF o WEBP.";
    }
    if (file.size < MIN_BYTES) {
      return `La imagen es demasiado pequeña (${formatBytes(file.size)}). Mínimo 1 KB.`;
    }
    if (file.size > MAX_BYTES) {
      return `La imagen pesa ${formatBytes(file.size)}. El máximo permitido es 5 MB.`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const errorMsg = validate(file);
    if (errorMsg) {
      toast.error(errorMsg);
      resetInput();
      return;
    }

    setPendingFile(file);
    resetInput();
  };

  const cancelPreview = () => {
    setPendingFile(null);
    setPreviewError(null);
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);

    try {
      const isDesktopApp =
        window.location.protocol === "file:" || typeof (window as any).electron !== "undefined";

      if (isDesktopApp) {
        const localPhoto = await fileToDataUrl(pendingFile);
        onPhotoUploaded(localPhoto);
        toast.success("Foto de perfil guardada");
        setPendingFile(null);
        return;
      }

      const ext = pendingFile.name.split(".").pop() || "jpg";
      const fileName = `${profileId}-${Date.now()}.${ext}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, pendingFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      onPhotoUploaded(urlData.publicUrl);
      toast.success("Foto de perfil actualizada");
      setPendingFile(null);
    } catch (err: any) {
      console.error("Error uploading photo:", err);
      const message = String(err?.message || "").toLowerCase();

      // Fall back to local storage silently on network/upload issues
      try {
        const localPhoto = await fileToDataUrl(pendingFile);
        onPhotoUploaded(localPhoto);
        if (message.includes("network") || message.includes("fetch")) {
          toast.warning("Sin conexión: foto guardada localmente");
        } else {
          toast.success("Foto guardada localmente");
        }
        setPendingFile(null);
      } catch {
        toast.error("No se pudo procesar la imagen. Intenta con otro archivo.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        {currentPhotoUrl ? (
          <div className="relative">
            <img
              src={currentPhotoUrl}
              alt="Foto de perfil"
              className="h-20 w-20 rounded-full object-cover border-2 border-primary/30"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-1 -right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onPhotoRemoved}
              aria-label="Quitar foto"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-3xl border-2 border-dashed border-muted-foreground/30">
            {currentAvatar}
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        <Camera className="h-3 w-3" />
        {currentPhotoUrl ? "Cambiar foto" : "Subir foto"}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        JPG, PNG, GIF o WEBP · hasta 5 MB
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={!!pendingFile} onOpenChange={(o) => !o && !uploading && cancelPreview()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
            <DialogDescription>
              Revisa la imagen antes de guardarla como foto de perfil.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-2">
            {previewUrl && !previewError ? (
              <img
                src={previewUrl}
                alt="Vista previa"
                onError={() => setPreviewError("La imagen está dañada o no se puede mostrar.")}
                className="h-40 w-40 rounded-full object-cover border-2 border-primary/40 shadow-soft"
              />
            ) : (
              <div className="h-40 w-40 rounded-full bg-muted flex flex-col items-center justify-center text-muted-foreground gap-1">
                <ImageOff className="h-8 w-8" />
                <span className="text-xs px-3 text-center">{previewError || "Sin vista previa"}</span>
              </div>
            )}

            {pendingFile && (
              <div className="text-xs text-muted-foreground text-center space-y-0.5">
                <p className="font-medium text-foreground truncate max-w-[240px]">{pendingFile.name}</p>
                <p>{formatBytes(pendingFile.size)} · {pendingFile.type.replace("image/", "").toUpperCase()}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={cancelPreview} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={confirmUpload} disabled={uploading || !!previewError} className="gap-2">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmar y subir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
