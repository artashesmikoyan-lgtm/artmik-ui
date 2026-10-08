import { useCallback, useEffect, useRef, useState, type HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

const TAU = Math.PI * 2;
const RESPONSE = 0.26;
const HYSTERESIS = 1.12;

export interface CharacterAnchor {
  x: number;
  y: number;
}

export interface CursorCharacterProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  frames: readonly string[];
  centerSrc: string;
  alt: string;
  faceAnchor?: CharacterAnchor;
  deadzone?: number;
  touchBehavior?: "ignore" | "follow";
  reducedMotion?: boolean;
  imageClassName?: string;
}

function wrapAngle(angle: number): number {
  return ((angle % TAU) + TAU) % TAU;
}

function angleDifference(from: number, to: number): number {
  return wrapAngle(to - from + Math.PI) - Math.PI;
}

function getFrameIndex(angle: number, count: number): number {
  return Math.round((wrapAngle(angle) / TAU) * count) % count;
}

export function CursorCharacter({
  frames,
  centerSrc,
  alt,
  faceAnchor = { x: 50, y: 40 },
  deadzone = 56,
  touchBehavior = "ignore",
  reducedMotion: reducedMotionOverride,
  imageClassName,
  className,
  ...elementProps
}: CursorCharacterProps) {
  if (frames.length === 0) {
    throw new Error("CursorCharacter requires at least one directional frame.");
  }

  const systemReducedMotion = useReducedMotion();
  const reducedMotion = systemReducedMotion || reducedMotionOverride === true;
  const [frameIndex, setFrameIndex] = useState<number | null>(null);
  const currentFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const preloadedImagesRef = useRef<HTMLImageElement[]>([]);
  const showFrame = useCallback((nextFrame: number | null) => {
    if (currentFrameRef.current === nextFrame) return;
    currentFrameRef.current = nextFrame;
    setFrameIndex(nextFrame);
  }, []);

  const anchorX = Number.isFinite(faceAnchor.x) ? Math.max(0, Math.min(100, faceAnchor.x)) : 50;
  const anchorY = Number.isFinite(faceAnchor.y) ? Math.max(0, Math.min(100, faceAnchor.y)) : 40;
  const safeDeadzone = Number.isFinite(deadzone) ? Math.max(0, deadzone) : 56;

  useEffect(() => {
    if (reducedMotion) {
      showFrame(null);
      return;
    }

    let targetAngle = 0;
    let currentAngle = 0;
    let previousTime = 0;
    let trackingActive = false;
    let animationFrame = 0;

    const cancelTracking = () => {
      trackingActive = false;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      showFrame(null);
    };

    const animate = (time: number) => {
      animationFrame = 0;
      if (!trackingActive) return;

      const elapsed = previousTime ? Math.min(64, time - previousTime) : 1000 / 60;
      previousTime = time;
      const progress = 1 - Math.pow(1 - RESPONSE, elapsed / (1000 / 60));
      const difference = angleDifference(currentAngle, targetAngle);
      currentAngle = wrapAngle(currentAngle + difference * progress);
      showFrame(getFrameIndex(currentAngle, frames.length));

      if (Math.abs(difference) > 0.005) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        previousTime = 0;
      }
    };

    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType === "touch" && touchBehavior === "ignore") {
        cancelTracking();
        return;
      }

      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds?.width || !bounds.height) {
        cancelTracking();
        return;
      }

      const dx = event.clientX - (bounds.left + (anchorX / 100) * bounds.width);
      const dy = event.clientY - (bounds.top + (anchorY / 100) * bounds.height);
      const distance = Math.hypot(dx, dy);

      if (trackingActive ? distance < safeDeadzone : distance <= safeDeadzone * HYSTERESIS) {
        cancelTracking();
        return;
      }

      targetAngle = Math.atan2(dy, dx);
      if (!trackingActive) {
        trackingActive = true;
        currentAngle = targetAngle;
        previousTime = 0;
        showFrame(getFrameIndex(currentAngle, frames.length));
      }

      if (!animationFrame) animationFrame = window.requestAnimationFrame(animate);
    };

    const endTouch = (event: PointerEvent) => {
      if (event.pointerType === "touch") cancelTracking();
    };
    const onWindowBlur = () => cancelTracking();
    const onDocumentMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget) cancelTracking();
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerup", endTouch);
    window.addEventListener("pointercancel", cancelTracking);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("mouseout", onDocumentMouseOut);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerup", endTouch);
      window.removeEventListener("pointercancel", cancelTracking);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("mouseout", onDocumentMouseOut);
    };
  }, [anchorX, anchorY, frames.length, reducedMotion, safeDeadzone, showFrame, touchBehavior]);

  useEffect(() => {
    if (reducedMotion) return;
    const images = frames.map((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      return image;
    });
    preloadedImagesRef.current = images;
    return () => {
      preloadedImagesRef.current = [];
    };
  }, [frames, reducedMotion]);

  return (
    <div
      {...elementProps}
      ref={containerRef}
      className={["amui-cursor-character", className].filter(Boolean).join(" ")}
      data-reduced-motion={reducedMotion}
      data-tracking-frame={reducedMotion ? "center" : frameIndex ?? "center"}
    >
      <img
        className={["amui-cursor-character__image", imageClassName].filter(Boolean).join(" ")}
        src={reducedMotion ? centerSrc : frameIndex === null ? centerSrc : frames[frameIndex]}
        alt={alt}
      />
    </div>
  );
}
