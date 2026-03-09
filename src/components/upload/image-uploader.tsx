"use client";

import { Camera, ImageIcon, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { cloudinaryConfig } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string) => void;
  folder: string;
  aspectRatio?: "1:1" | "16:9";
  className?: string;
}

const isCloudinaryConfigured = !!cloudinaryConfig.cloudName;

export function ImageUploader({
  value,
  onChange,
  folder,
  aspectRatio = "1:1",
  className,
}: ImageUploaderProps) {
  const isSquare = aspectRatio === "1:1";

  if (!isCloudinaryConfigured) {
    return (
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-2 text-muted-foreground",
          isSquare ? "w-32 h-32" : "w-full h-40",
          className
        )}
      >
        <CloudOff className="w-5 h-5 opacity-50" />
        <span className="text-xs text-center px-2">Cloudinary no configurado</span>
      </div>
    );
  }

  // Dynamic import to avoid errors when credentials are missing
  const { CldUploadWidget, CldImage } = require("next-cloudinary");

  return (
    <CldUploadWidget
      uploadPreset={cloudinaryConfig.uploadPreset}
      options={{
        folder,
        maxFiles: 1,
        resourceType: "image",
        cropping: true,
        croppingAspectRatio: isSquare ? 1 : 16 / 9,
      }}
      onSuccess={(result: { info?: { secure_url?: string } }) => {
        if (typeof result.info === "object" && result.info?.secure_url) {
          onChange(result.info.secure_url);
          toast.success("Imagen subida");
        }
      }}
    >
      {({ open }: { open: () => void }) => (
        <button
          type="button"
          onClick={() => open()}
          className={cn(
            "relative group rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden bg-muted/20",
            isSquare ? "w-32 h-32" : "w-full h-40",
            className
          )}
        >
          {value ? (
            <>
              <CldImage
                src={value}
                alt="Upload"
                fill
                className="object-cover"
                sizes={isSquare ? "128px" : "100vw"}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 text-white" />
                <span className="text-white text-xs font-medium">Cambiar imagen</span>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs">Subir imagen</span>
            </div>
          )}
        </button>
      )}
    </CldUploadWidget>
  );
}
