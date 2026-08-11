// src/features/room-editor/hooks/use-element-size.ts — tamaño en vivo del contenedor del lienzo.
// Konva necesita un ancho/alto en píxeles explícito para el <Stage> (no crece solo con flex como un
// <div>), así que el tamaño del contenedor se mide con ResizeObserver y se pasa como prop.

"use client";

import { type RefObject, useEffect, useState } from "react";

export function useElementSize<T extends HTMLElement>(
  ref: RefObject<T | null>,
): { widthPx: number; heightPx: number } {
  const [size, setSize] = useState({ widthPx: 0, heightPx: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentBoxSize[0];
      setSize({ widthPx: box.inlineSize, heightPx: box.blockSize });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
