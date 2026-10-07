import { useCallback, useState, type CSSProperties, type HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export interface EyeAnchor {
  x: number;
  y: number;
  size?: number;
}

export interface HeadTrackerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  src: string;
  alt: string;
  scale?: number;
  trackingStrength?: number;
  eyeTracking?: boolean;
  eyeAnchors?: readonly EyeAnchor[];
  touchBehavior?: "ignore" | "follow";
  reducedMotion?: boolean;
  imageClassName?: string;
}

const defaultEyeAnchors: readonly EyeAnchor[] = [
  { x: 42, y: 38, size: 8 },
  { x: 58, y: 38, size: 8 },
];

export function HeadTracker({
  src,
  alt,
  scale = 1.04,
  trackingStrength = 0.7,
  eyeTracking = false,
  eyeAnchors = defaultEyeAnchors,
  touchBehavior = "ignore",
  reducedMotion: reducedMotionOverride,
  imageClassName,
  className,
  onPointerMove,
  onPointerLeave,
  ...elementProps
}: HeadTrackerProps) {
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = systemReducedMotion || reducedMotionOverride === true;
  const [tracking, setTracking] = useState({ x: 0, y: 0 });
  const strength = Number.isFinite(trackingStrength) ? Math.max(0, Math.min(1, trackingStrength)) : 0;
  const safeScale = Number.isFinite(scale) ? Math.max(0.1, scale) : 1;

  const updateTracking = useCallback<NonNullable<HTMLAttributes<HTMLDivElement>["onPointerMove"]>>(
    (event) => {
      onPointerMove?.(event);
      if (reducedMotion || (event.pointerType === "touch" && touchBehavior === "ignore")) return;

      const bounds = event.currentTarget.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      setTracking({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
    },
    [onPointerMove, reducedMotion, touchBehavior],
  );

  const resetTracking = useCallback<NonNullable<HTMLAttributes<HTMLDivElement>["onPointerLeave"]>>(
    (event) => {
      onPointerLeave?.(event);
      setTracking({ x: 0, y: 0 });
    },
    [onPointerLeave],
  );

  const style = {
    ...elementProps.style,
    "--amui-head-x": `${reducedMotion ? 0 : tracking.x * strength * 18}px`,
    "--amui-head-y": `${reducedMotion ? 0 : tracking.y * strength * 12}px`,
    "--amui-head-scale": reducedMotion ? 1 : safeScale,
    "--amui-gaze-x": `${reducedMotion ? 0 : tracking.x * strength * 7}px`,
    "--amui-gaze-y": `${reducedMotion ? 0 : tracking.y * strength * 7}px`,
  } as CSSProperties;

  return (
    <div
      {...elementProps}
      className={["amui-head-tracker", className].filter(Boolean).join(" ")}
      data-reduced-motion={reducedMotion}
      onPointerLeave={resetTracking}
      onPointerMove={updateTracking}
      style={style}
    >
      <img className={["amui-head-tracker__image", imageClassName].filter(Boolean).join(" ")} src={src} alt={alt} />
      {eyeTracking && !reducedMotion && (
        <span className="amui-head-tracker__eyes" aria-hidden="true">
          {eyeAnchors.map((eye, index) => (
            <span
              className="amui-head-tracker__eye"
              key={`${eye.x}-${eye.y}-${index}`}
              style={{
                left: `${eye.x}%`,
                top: `${eye.y}%`,
                width: `${Math.max(2, eye.size ?? 8)}px`,
                height: `${Math.max(2, eye.size ?? 8)}px`,
              }}
            />
          ))}
        </span>
      )}
    </div>
  );
}
