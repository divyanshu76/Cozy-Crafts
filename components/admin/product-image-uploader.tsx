"use client";
import * as React from "react";
import { Upload, X, Star, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedImage {
  /** Local object URL for preview (revoked on unmount) */
  previewUrl: string;
  /** File object — optional for existing images */
  file?: File;
  /** Set after successful upload */
  uploadedUrl?: string;
  /** Storage path for potential cleanup */
  storagePath?: string;
}

interface ProductImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  error?: string;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_EXT = ["png", "jpg", "jpeg", "webp"];
const MAX_IMAGES = 4;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function validateFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}" has an unsupported type (${file.type}). Use PNG, JPG, JPEG, or WEBP.`;
  }
  if (!ALLOWED_EXT.includes(ext)) {
    return `"${file.name}" has an unsupported extension (.${ext}). Use .png, .jpg, .jpeg, or .webp.`;
  }
  if (file.size > MAX_SIZE) {
    return `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB, which exceeds the 5 MB limit.`;
  }
  return null;
}

export function ProductImageUploader({ images, onChange, error }: ProductImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    setLocalError(null);

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setLocalError(`You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    const toAdd: UploadedImage[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      if (toAdd.length >= remaining) {
        errors.push(`You can upload a maximum of ${MAX_IMAGES} images. ${fileArray.length - remaining} file(s) were skipped.`);
        break;
      }
      const err = validateFile(file);
      if (err) {
        errors.push(err);
        continue;
      }
      toAdd.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    if (errors.length > 0) setLocalError(errors[0]);
    if (toAdd.length > 0) onChange([...images, ...toAdd]);
  }

  function removeImage(index: number) {
    const img = images[index];
    URL.revokeObjectURL(img.previewUrl);
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
    setLocalError(null);
  }

  function setMain(index: number) {
    if (index === 0) return;
    const updated = [...images];
    const [main] = updated.splice(index, 1);
    updated.unshift(main);
    onChange(updated);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  const displayError = localError ?? error;

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload product images"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
          dragOver
            ? "border-sage bg-sage/5"
            : "border-taupe/40 hover:border-sage/60 hover:bg-cream-soft/30",
          images.length >= MAX_IMAGES && "opacity-50 pointer-events-none"
        )}
      >
        <div className="w-12 h-12 rounded-full bg-cream-soft flex items-center justify-center mb-3">
          <Upload className="h-5 w-5 text-espresso-soft" />
        </div>
        <p className="text-sm font-medium text-espresso">Click to upload images</p>
        <p className="text-xs text-espresso-soft mt-1">or drag and drop</p>
        <p className="text-xs text-taupe mt-3">PNG, JPG, JPEG, WEBP · Max {MAX_IMAGES} images · 5 MB each</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="sr-only"
        aria-label="Select product images"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />

      {/* Error */}
      {displayError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {displayError}
        </p>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={img.previewUrl} className="relative group rounded-xl overflow-hidden aspect-square bg-cream-soft border border-taupe/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={`Product image ${i + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-espresso/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMain(i); }}
                    className="flex items-center gap-1 bg-white/90 text-espresso text-xs px-2 py-1 rounded-md font-medium hover:bg-white transition-colors"
                    aria-label={`Set image ${i + 1} as main`}
                  >
                    <Star className="h-3 w-3" />
                    Main
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  className="flex items-center justify-center w-7 h-7 bg-white/90 rounded-md hover:bg-white transition-colors"
                  aria-label={`Remove image ${i + 1}`}
                >
                  <X className="h-3.5 w-3.5 text-espresso" />
                </button>
              </div>

              {/* Main badge */}
              {i === 0 && (
                <div className="absolute top-2 left-2 bg-espresso text-cream text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide">
                  Main
                </div>
              )}

              {/* Image number */}
              <div className="absolute bottom-1.5 right-2 text-[10px] text-white/80 font-mono">
                {i + 1}/{MAX_IMAGES}
              </div>
            </div>
          ))}

          {/* Add more slot */}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-taupe/30 flex flex-col items-center justify-center text-taupe hover:border-sage/60 hover:text-sage transition-colors"
              aria-label="Add more images"
            >
              <ImageIcon className="h-5 w-5 mb-1" />
              <span className="text-xs">Add image</span>
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-espresso-soft">
        {images.length}/{MAX_IMAGES} images uploaded. The first image will be shown as the main product photo.
      </p>
    </div>
  );
}
