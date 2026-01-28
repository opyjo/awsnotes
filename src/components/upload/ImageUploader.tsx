"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadImageToS3 } from "@/lib/aws/s3";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  className?: string;
}

export const ImageUploader = ({
  onUploadComplete,
  className,
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);

      try {
        const url = await uploadImageToS3(file, user.userId);
        onUploadComplete(url);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image");
      } finally {
        setUploading(false);
      }
    },
    [user, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    multiple: false,
    disabled: uploading || !user,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors",
        isDragActive
          ? "border-primary bg-accent"
          : "border-muted-foreground/25 hover:border-primary/50",
        uploading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="text-sm text-muted-foreground">Uploading...</div>
      ) : (
        <div className="text-sm text-muted-foreground">
          {isDragActive
            ? "Drop the image here"
            : "Drag & drop an image here, or click to select"}
        </div>
      )}
    </div>
  );
};
