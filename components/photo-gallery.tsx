"use client";

import Image from "next/image";
import { useState, useRef } from "react";

type Foto = { id: string; url: string };

type Props = {
  fotos: Foto[];
  alt: string;
  reservada?: boolean;
};

export function PhotoGallery({ fotos, alt, reservada = false }: Props) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const total = fotos.length;

  function go(index: number) {
    const next = (index + total) % total;
    setCurrent(next);
    // Scroll thumbnail into view
    setTimeout(() => {
      const el = thumbsRef.current?.children[next] as HTMLElement | undefined;
      el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 0);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 48) go(delta < 0 ? current + 1 : current - 1);
    touchStartX.current = null;
  }

  const currentUrl = fotos[current]?.url ?? null;

  return (
    <div className="flex flex-col gap-3">
      {/* Foto principal */}
      <div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden select-none"
        style={{ background: "#EDE0C8", aspectRatio: "3/4" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {currentUrl ? (
          <Image
            key={currentUrl}
            src={currentUrl}
            alt={`${alt} — foto ${current + 1}`}
            fill
            className="object-cover"
            priority={current === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
            style={{ transition: "opacity 0.25s ease" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 72 }}>👗</div>
        )}

        {/* Overlay reservada */}
        {reservada && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(244,236,216,0.75)", backdropFilter: "blur(3px)" }}
          >
            <span className="font-display italic text-2xl sm:text-3xl" style={{ color: "#4A3728" }}>
              Reservada ⏳
            </span>
          </div>
        )}

        {/* Contador */}
        {total > 1 && (
          <div
            className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(74,55,40,0.6)", color: "#F4ECD8", backdropFilter: "blur(4px)" }}
          >
            {current + 1}/{total}
          </div>
        )}

        {/* Setas — só quando há mais de 1 foto */}
        {total > 1 && (
          <>
            <button
              onClick={() => go(current - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-95"
              style={{ background: "rgba(244,236,216,0.88)", backdropFilter: "blur(4px)", color: "#4A3728" }}
              aria-label="Foto anterior"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => go(current + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-95"
              style={{ background: "rgba(244,236,216,0.88)", backdropFilter: "blur(4px)", color: "#4A3728" }}
              aria-label="Próxima foto"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        {/* Dots — mobile, quando há poucas fotos */}
        {total > 1 && total <= 6 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {fotos.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Foto ${i + 1}`}
                className="rounded-full transition-all"
                style={{
                  width: i === current ? 20 : 6,
                  height: 6,
                  background: i === current ? "#D4888A" : "rgba(244,236,216,0.7)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {total > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1"
        >
          {fotos.map((foto, i) => (
            <button
              key={foto.id}
              onClick={() => go(i)}
              aria-label={`Ver foto ${i + 1}`}
              className="relative shrink-0 rounded-xl overflow-hidden transition-all"
              style={{
                width: 72,
                height: 88,
                background: "#EDE0C8",
                outline: i === current ? "2.5px solid #D4888A" : "2px solid transparent",
                outlineOffset: 2,
                opacity: i === current ? 1 : 0.65,
              }}
            >
              <Image
                src={foto.url}
                alt={`${alt} — miniatura ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
