// components/ImageUpload.tsx
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { UploadDropzone } from "@uploadthing/react";
import { XIcon } from "lucide-react";
import React from "react";

interface ImageUploadProps {
  onChange: (url: string) => void;
  value: string;
  endpoint: "postImage";
}

export default function ImageUpload({ endpoint, onChange, value }: ImageUploadProps) {
  // If an image URL is present, show preview + delete button
  if (value) {
    return (
      <div className="relative mx-auto w-full max-w-xs">
        <img
          src={value}
          alt="Upload preview"
          className="rounded-lg w-full h-48 object-cover"
          onError={(e) => {
            // helpful runtime log for debugging
            // @ts-ignore
            console.error("Image preview failed to load:", e?.currentTarget?.src);
          }}
        />
        <button
          onClick={() => onChange("")}
          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full shadow-sm"
          type="button"
        >
          <XIcon className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full text-black flex justify-center">
      <UploadDropzone<OurFileRouter, "postImage">
        endpoint={endpoint}
        className="bg-white text-black w-full max-w-lg ut-label:text-black ut-button:bg-custom-orange ut-button:text-white"
        onClientUploadComplete={(res) => {
          // Debug log entire response
          console.log("UploadThing onClientUploadComplete response:", res);

          // UploadThing returns the URL in res[0].url
          if (res && res[0]?.url) {
            console.log("Image uploaded successfully, calling onChange with URL:", res[0].url);
            onChange(res[0].url);
          } else {
            // If it's not there, log everything so you can inspect
            console.error("UploadThing response did not include URL:", res);
            alert("Upload completed but no URL was returned. Check console for details.");
          }
        }}
        onUploadError={(error: Error) => {
          console.error("UploadThing error:", error);
          alert(`Upload error: ${error.message}`);
        }}
      />
    </div>
  );
}
