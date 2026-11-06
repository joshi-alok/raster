import { FileUpload, type FileUploadEntry } from "@raster/react";
import { useState } from "react";

export default function Proofs() {
  const [files, setFiles] = useState<FileUploadEntry[]>([
    { id: "cover", name: "cover.pdf", size: 820_000 },
    { id: "spread", name: "spread-04.png", size: 2_400_000, progress: 40 },
  ]);
  return (
    <FileUpload
      label="Proofs"
      description="PDF or PNG, up to 10 MB."
      acceptedFileTypes={["application/pdf", "image/png"]}
      allowsMultiple
      maxSize={10_000_000}
      files={files}
      onAdd={(added) =>
        setFiles((current) => [
          ...current,
          ...added.map((file) => ({ id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size })),
        ])
      }
      onRemove={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
    />
  );
}
