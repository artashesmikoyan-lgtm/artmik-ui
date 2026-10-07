import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  delay?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  once?: boolean;
}

export function Reveal({
  children,
  className,
  delay = 0,
  duration = 500,
  distance = 20,
  threshold = 0.15,
  once = true,
  style,
  ...elementProps
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const [isObserved, setIsObserved] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion || typeof IntersectionObserver === "undefined") return;

    setIsVisible(false);
    setIsObserved(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [once, reducedMotion, threshold]);

  return (
    <div
      {...elementProps}
      className={["amui-reveal", className].filter(Boolean).join(" ")}
      data-observed={isObserved}
      data-visible={isVisible || reducedMotion}
      ref={ref}
      style={{
        ...style,
        "--amui-reveal-delay": `${Math.max(0, delay)}ms`,
        "--amui-reveal-duration": `${Math.max(0, duration)}ms`,
        "--amui-reveal-distance": `${distance}px`,
      } as CSSProperties}
    >
      {children}
    </div>
  );
}
