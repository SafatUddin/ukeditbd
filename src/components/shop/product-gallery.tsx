"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images }: { images: { url: string; alt: string }[] }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = images[active];

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      <div className="no-scrollbar flex gap-3 overflow-x-auto md:flex-col">
        {images.map((img, i) => (
          <button
            key={img.url}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            className={cn("relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-lg bg-cream ring-offset-2 transition", i === active ? "ring-1 ring-ink" : "opacity-60 hover:opacity-100")}
          >
            <Image src={img.url} alt="" fill sizes="80px" className="object-contain p-2 mix-blend-multiply" />
          </button>
        ))}
      </div>
      <div
        className="relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-cream"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        {current && (
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt}
            fill
            priority
            quality={90}
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="animate-in fade-in object-contain p-10 mix-blend-multiply transition-transform duration-200"
            style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        )}
        <span className="absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1 text-xs backdrop-blur">
          {active + 1} / {images.length}
        </span>
      </div>
    </div>
  );
}
