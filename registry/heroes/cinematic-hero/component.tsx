import { useCallback, useEffect, useRef, type CSSProperties, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "./useReducedMotion";

export interface CinematicHeroProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: ReactNode;
  title?: string[];
  subtitle?: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  height?: number | string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headlineFont?: string;
  bodyFont?: string;
  reducedMotion?: boolean;
}

type CinematicStyle = CSSProperties & {
  "--amui-cinematic-height": string;
  "--amui-cinematic-accent": string;
  "--amui-cinematic-background": string;
  "--amui-cinematic-text": string;
  "--amui-cinematic-headline-font": string;
  "--amui-cinematic-body-font": string;
};

const DEFAULT_TITLE = ["A quieter", "kind of bold."];

export function CinematicHero({
  eyebrow = "ARTMIK UI / STUDY 01",
  title = DEFAULT_TITLE,
  subtitle = "A little less noise. A little more feeling.",
  ctaLabel = "Enter the story",
  ctaHref = "#story",
  height = "min(820px, 100svh)",
  accentColor = "#dc7955",
  backgroundColor = "#171716",
  textColor = "#f0ede6",
  headlineFont = "'Georgia', 'Times New Roman', serif",
  bodyFont = "system-ui, sans-serif",
  reducedMotion: reducedMotionOverride,
  className,
  style,
  ...sectionProps
}: CinematicHeroProps) {
  const prefersReducedMotion = useReducedMotion() || reducedMotionOverride === true;
  const frameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => () => {
    if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    targetRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 18,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 18,
    };
    if (animationRef.current) return;
    const update = () => {
      animationRef.current = 0;
      const frame = frameRef.current;
      if (!frame) return;
      const currentX = Number(frame.dataset.x ?? 0);
      const currentY = Number(frame.dataset.y ?? 0);
      const nextX = currentX + (targetRef.current.x - currentX) * 0.12;
      const nextY = currentY + (targetRef.current.y - currentY) * 0.12;
      frame.dataset.x = String(nextX);
      frame.dataset.y = String(nextY);
      frame.style.setProperty("--amui-cinematic-pointer-x", `${nextX.toFixed(2)}px`);
      frame.style.setProperty("--amui-cinematic-pointer-y", `${nextY.toFixed(2)}px`);
      if (Math.abs(targetRef.current.x - nextX) > 0.08 || Math.abs(targetRef.current.y - nextY) > 0.08) {
        animationRef.current = window.requestAnimationFrame(update);
      }
    };
    animationRef.current = window.requestAnimationFrame(update);
  }, [prefersReducedMotion]);

  const handlePointerLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0 };
    const frame = frameRef.current;
    if (frame && !prefersReducedMotion && !animationRef.current) {
      const reset = () => {
        animationRef.current = 0;
        const currentX = Number(frame.dataset.x ?? 0);
        const currentY = Number(frame.dataset.y ?? 0);
        const nextX = currentX * 0.82;
        const nextY = currentY * 0.82;
        frame.dataset.x = String(nextX);
        frame.dataset.y = String(nextY);
        frame.style.setProperty("--amui-cinematic-pointer-x", `${nextX.toFixed(2)}px`);
        frame.style.setProperty("--amui-cinematic-pointer-y", `${nextY.toFixed(2)}px`);
        if (Math.abs(nextX) > 0.08 || Math.abs(nextY) > 0.08) {
          animationRef.current = window.requestAnimationFrame(reset);
        }
      };
      animationRef.current = window.requestAnimationFrame(reset);
    }
  }, [prefersReducedMotion]);

  const heroStyle: CinematicStyle = {
    ...style,
    "--amui-cinematic-height": typeof height === "number" ? `${height}px` : height,
    "--amui-cinematic-accent": accentColor,
    "--amui-cinematic-background": backgroundColor,
    "--amui-cinematic-text": textColor,
    "--amui-cinematic-headline-font": headlineFont,
    "--amui-cinematic-body-font": bodyFont,
  };
  const safeTitle = title.length > 0 ? title : DEFAULT_TITLE;

  return (
    <section
      {...sectionProps}
      className={["amui-cinematic-hero", className].filter(Boolean).join(" ")}
      style={heroStyle}
      data-reduced-motion={prefersReducedMotion}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="amui-cinematic-hero__art" aria-hidden="true">
        <div className="amui-cinematic-hero__orbit amui-cinematic-hero__orbit--outer" />
        <div className="amui-cinematic-hero__orbit amui-cinematic-hero__orbit--inner" />
        <div className="amui-cinematic-hero__sun" />
        <div className="amui-cinematic-hero__cutout" />
        <div className="amui-cinematic-hero__art-index">FIG. 01 <span>—</span> STILL / MOVING</div>
        <div className="amui-cinematic-hero__art-caption">LIGHT, HELD<br />IN SUSPENSION</div>
      </div>
      <div className="amui-cinematic-hero__grain" aria-hidden="true" />
      <div className="amui-cinematic-hero__content" ref={frameRef}>
        <p className="amui-cinematic-hero__eyebrow">{eyebrow}</p>
        <h1 className="amui-cinematic-hero__title">
          {safeTitle.map((line, index) => (
            <span key={`${line}-${index}`} style={{ "--amui-cinematic-delay": `${0.24 + index * 0.16}s` } as CSSProperties}>
              {line}
            </span>
          ))}
        </h1>
        <p className="amui-cinematic-hero__subtitle">{subtitle}</p>
        <a className="amui-cinematic-hero__cta" href={ctaHref}>
          <span>{ctaLabel}</span><span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="amui-cinematic-hero__coordinates" aria-hidden="true">
        <span>42° 52′ 48″ N</span><span>01 / 03</span><span>MOVE SLOWLY</span>
      </div>
    </section>
  );
}
