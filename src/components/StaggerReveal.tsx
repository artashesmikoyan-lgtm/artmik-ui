import { Children, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export interface StaggerRevealProps extends HTMLAttributes<HTMLDivElement> {
  step?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  once?: boolean;
}

export function StaggerReveal({
  children,
  className,
  step = 80,
  duration = 500,
  distance = 16,
  threshold = 0.15,
  once = true,
  style,
  ...elementProps
}: StaggerRevealProps) {
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
      className={["amui-stagger", className].filter(Boolean).join(" ")}
      data-observed={isObserved}
      data-visible={isVisible || reducedMotion}
      ref={ref}
      style={{
        ...style,
        "--amui-stagger-step": `${Math.max(0, step)}ms`,
        "--amui-reveal-duration": `${Math.max(0, duration)}ms`,
        "--amui-reveal-distance": `${distance}px`,
      } as CSSProperties}
    >
      {Children.toArray(children).map((child, index) => (
        <div
          className="amui-stagger__item"
          key={index}
          style={{ "--amui-stagger-index": index } as CSSProperties}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
