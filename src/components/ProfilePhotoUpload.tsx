import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProfilePhotoUploadProps {
  profileId: string;
  currentPhotoUrl?: string | null;
  currentAvatar: string;
  onPhotoUploaded: (url: string) => void;
  onPhotoRemoved: () => void;
}

export function ProfilePhotoUpload({
  profileId,
  currentPhotoUrl,
  currentAvatar,
  onPhotoUploaded,
  onPhotoRemoved,
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${profileId}-${Date.now()}.${ext}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      onPhotoUploaded(urlData.publicUrl);
      toast.success("Foto de perfil actualizada");
    } catch (err) {
      console.error("Error uploading photo:", err);
      toast.error("Error al subir la foto");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        {uploading ? (
          <>Subiendo...</>
        ) : (
          <>
            <Camera className="h-3 w-3" />
            {currentPhotoUrl ? "Cambiar foto" : "Subir foto"}
          </>
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
