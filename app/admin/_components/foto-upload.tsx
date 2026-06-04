"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Props = {
  fotos: string[];
  onChange: (urls: string[]) => void;
};

export function FotoUpload({ fotos, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    setUploading(true);
    setError(null);
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) { setUploading(false); return; }

    try {
      const urls = await Promise.all(
        arr.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
          if (!res.ok) {
            const { error } = await res.json();
            throw new Error(error ?? "Falha ao enviar foto");
          }
          const { url } = await res.json();
          return url as string;
        })
      );
      onChange([...fotos, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  function removePhoto(index: number) {
    onChange(fotos.filter((_, i) => i !== index));
  }

  function moveLeft(index: number) {
    if (index === 0) return;
    const next = [...fotos];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveRight(index: number) {
    if (index === fotos.length - 1) return;
    const next = [...fotos];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {/* Zona de drop */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors"
        style={{
          borderColor: uploading ? "#D4888A" : "#E5D5B5",
          background: "#FAF6EE",
          padding: "2rem 1rem",
          minHeight: 120,
        }}
      >
        {uploading ? (
          <>
            <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "#D4888A", borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: "#7A5C48" }}>Enviando fotos…</p>
          </>
        ) : (
          <>
            <span style={{ fontSize: 32 }}>📸</span>
            <p className="text-sm font-medium text-center" style={{ color: "#7A5C48" }}>
              Arraste fotos aqui ou <span style={{ color: "#D4888A" }}>clique para selecionar</span>
            </p>
            <p className="text-xs" style={{ color: "#B8A898" }}>JPG, PNG, WEBP · Várias de uma vez</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />

      {error && (
        <p className="text-sm px-3 py-2 rounded-xl" style={{ background: "#FBF3F3", color: "#C97B7B" }}>
          ⚠ {error}
        </p>
      )}

      {/* Previews */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {fotos.map((url, i) => (
            <div key={url + i} className="relative group rounded-xl overflow-hidden"
              style={{ aspectRatio: "3/4", background: "#EDE0C8" }}>
              <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" sizes="150px" />

              {/* Capa badge */}
              {i === 0 && (
                <span className="absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "#D4888A", color: "#fff" }}>Capa</span>
              )}

              {/* Ações */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(74,55,40,0.55)" }}>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveLeft(i)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.2)" }} aria-label="Mover para esquerda">
                    ←
                  </button>
                  <button type="button" onClick={() => moveRight(i)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.2)" }} aria-label="Mover para direita">
                    →
                  </button>
                </div>
                <button type="button" onClick={() => removePhoto(i)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#C97B7B", color: "#fff" }} aria-label="Remover foto">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {fotos.length > 0 && (
        <p className="text-xs" style={{ color: "#B8A898" }}>
          A primeira foto é a capa. Use ← → para reordenar.
        </p>
      )}
    </div>
  );
}
