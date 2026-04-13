"use client";

import { useRef, useState, useCallback } from "react";
import Button from "@/components/ui/Button";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.8
        );
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const compressed = await compressImage(file);
      setPreview(URL.createObjectURL(compressed));
      onCapture(compressed);
    },
    [compressImage, onCapture]
  );

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {preview ? (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Receipt preview"
            className="w-full max-h-80 object-contain bg-gray-50"
          />
          <button
            onClick={() => {
              setPreview(null);
              if (cameraInputRef.current) cameraInputRef.current.value = "";
              if (galleryInputRef.current) galleryInputRef.current.value = "";
            }}
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white text-sm"
            aria-label="Remove photo"
          >
            &times;
          </button>
        </div>
      ) : (
        <div
          className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-divvy-teal/40 bg-white/30 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/50 transition-colors"
          onClick={() => cameraInputRef.current?.click()}
        >
          <div className="text-5xl">📸</div>
          <p className="text-divvy-dark/60 font-medium">
            Tap to take a photo
          </p>
          <p className="text-divvy-dark/40 text-sm">
            or upload a receipt image
          </p>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Take a photo of receipt"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Choose receipt from gallery"
      />

      {!preview && (
        <Button
          variant="ghost"
          onClick={() => galleryInputRef.current?.click()}
          className="mt-2"
        >
          Choose from gallery
        </Button>
      )}
    </div>
  );
}
