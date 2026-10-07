import { useEffect, useState } from "react";

export interface UseScrollSpyOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  initialActiveId?: string | null;
}

export function useScrollSpy(
  sectionIds: readonly string[],
  options: UseScrollSpyOptions = {},
): string | null {
  const {
    root = null,
    rootMargin = "0px 0px -10% 0px",
    threshold = 0.1,
    initialActiveId = sectionIds[0] ?? null,
  } = options;
  const sectionKey = sectionIds.join("\u0000");
  const thresholdsKey = Array.isArray(threshold) ? `array:${threshold.join(",")}` : `number:${threshold}`;
  const [activeId, setActiveId] = useState<string | null>(() =>
    sectionIds.includes(initialActiveId ?? "") ? initialActiveId : sectionIds[0] ?? null
  );

  useEffect(() => {
    const ids = sectionKey ? sectionKey.split("\u0000") : [];
    const parsedThresholds = thresholdsKey.startsWith("array:")
      ? thresholdsKey.slice(6).split(",").filter(Boolean).map(Number)
      : null;
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (!sections.length || typeof IntersectionObserver === "undefined") {
      return;
    }

    let observerThreshold: number | number[];
    if (parsedThresholds === null) {
      observerThreshold = Number(thresholdsKey.slice(7));
    } else {
      observerThreshold = parsedThresholds.length ? parsedThresholds : 0;
    }

    const visibleSections = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        const rootBounds = root?.getBoundingClientRect();
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            visibleSections.add(id);
          } else {
            visibleSections.delete(id);
          }
        }

        const rootTop = rootBounds?.top ?? 0;
        const rootHeight = rootBounds?.height ?? window.innerHeight;
        const activeLine = rootTop + rootHeight * 0.45;
        const next = [...visibleSections]
          .map((id) => {
            const rect = document.getElementById(id)?.getBoundingClientRect();
            if (!rect) return null;
            const distanceToLine = rect.top <= activeLine && rect.bottom >= activeLine
              ? 0
              : Math.min(Math.abs(rect.top - activeLine), Math.abs(rect.bottom - activeLine));
            return { id, distanceToLine, distanceToTop: Math.abs(rect.top - activeLine) };
          })
          .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
          .sort((a, b) => a.distanceToLine - b.distanceToLine || a.distanceToTop - b.distanceToTop)[0]?.id;

        if (next) {
          setActiveId(next);
        }
      },
      {
        root,
        rootMargin,
        threshold: observerThreshold,
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [root, rootMargin, sectionKey, thresholdsKey]);

  useEffect(() => {
    const ids = sectionKey ? sectionKey.split("\u0000") : [];
    if (!ids.includes(activeId ?? "")) {
      setActiveId(initialActiveId && ids.includes(initialActiveId) ? initialActiveId : ids[0] ?? null);
    }
  }, [activeId, initialActiveId, sectionKey]);

  return activeId;
}
