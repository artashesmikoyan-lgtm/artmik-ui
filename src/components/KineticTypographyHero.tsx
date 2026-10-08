import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from "react";
import { useReducedMotion } from "./useReducedMotion";

export interface KineticTypographyHeroProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: string;
  lines?: string[];
  supportingText?: string;
  ctaLabel?: string;
  ctaHref?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headlineFont?: string;
  wordDelay?: number;
  scrollAware?: boolean;
  reducedMotion?: boolean;
}

type KineticStyle = CSSProperties & {
  "--amui-kinetic-accent": string;
  "--amui-kinetic-background": string;
  "--amui-kinetic-text": string;
  "--amui-kinetic-headline-font": string;
  "--amui-kinetic-word-delay": string;
  "--amui-kinetic-progress": number;
};

const DEFAULT_LINES = ["Ideas in", "their own", "orbit."];

export function KineticTypographyHero({
  eyebrow = "TYPE / IN MOTION",
  lines = DEFAULT_LINES,
  supportingText = "Let the words land first. Everything else can follow.",
  ctaLabel = "Read the signal",
  ctaHref = "#signal",
  accentColor = "#e94f2c",
  backgroundColor = "#efede7",
  textColor = "#20201e",
  headlineFont = "'Arial Narrow', 'Helvetica Neue', sans-serif",
  wordDelay = 80,
  scrollAware = false,
  reducedMotion: reducedMotionOverride,
  className,
  style,
  ...sectionProps
}: KineticTypographyHeroProps) {
  const prefersReducedMotion = useReducedMotion() || reducedMotionOverride === true;
  const sectionRef = useRef<HTMLElement>(null);
  const progressFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!scrollAware || prefersReducedMotion) return;
    const updateProgress = () => {
      progressFrameRef.current = 0;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const distance = window.innerHeight + rect.height;
      const progress = distance > 0 ? Math.max(0, Math.min(1, (window.innerHeight - rect.top) / distance)) : 0;
      section.style.setProperty("--amui-kinetic-progress", String(progress));
    };
    const scheduleProgress = () => {
      if (!progressFrameRef.current) {
        progressFrameRef.current = window.requestAnimationFrame(updateProgress);
      }
    };
    updateProgress();
    window.addEventListener("scroll", scheduleProgress, { passive: true });
    window.addEventListener("resize", scheduleProgress, { passive: true });
    return () => {
      window.removeEventListener("scroll", scheduleProgress);
      window.removeEventListener("resize", scheduleProgress);
      if (progressFrameRef.current) window.cancelAnimationFrame(progressFrameRef.current);
    };
  }, [prefersReducedMotion, scrollAware]);

  const safeLines = lines.length > 0 ? lines : DEFAULT_LINES;
  const safeDelay = Number.isFinite(wordDelay) ? Math.max(0, Math.min(500, wordDelay)) : 80;
  const heroStyle: KineticStyle = {
    ...style,
    "--amui-kinetic-accent": accentColor,
    "--amui-kinetic-background": backgroundColor,
    "--amui-kinetic-text": textColor,
    "--amui-kinetic-headline-font": headlineFont,
    "--amui-kinetic-word-delay": `${safeDelay}ms`,
    "--amui-kinetic-progress": 0,
  };
  let wordIndex = 0;

  return (
    <section
      {...sectionProps}
      ref={sectionRef}
      className={["amui-kinetic-typography-hero", className].filter(Boolean).join(" ")}
      style={heroStyle}
      data-reduced-motion={prefersReducedMotion}
      data-scroll-aware={scrollAware}
    >
      <div className="amui-kinetic-typography-hero__margin" aria-hidden="true">
        <span>INDEX / 03</span><span>WORDS HAVE WEIGHT</span>
      </div>
      <div className="amui-kinetic-typography-hero__content">
        <p className="amui-kinetic-typography-hero__eyebrow">{eyebrow}</p>
        <h1 className="amui-kinetic-typography-hero__title" aria-label={safeLines.join(" ")}>
          {safeLines.map((line, lineIndex) => (
            <span className="amui-kinetic-typography-hero__line" aria-hidden="true" key={`${line}-${lineIndex}`}>
              {line.split(/(\s+)/).filter(Boolean).map((word, partIndex) => {
                if (/^\s+$/.test(word)) return <span className="amui-kinetic-typography-hero__space" key={`space-${lineIndex}-${partIndex}`}>{word}</span>;
                const currentWord = wordIndex++;
                return (
                  <span
                    className="amui-kinetic-typography-hero__word"
                    style={{ "--amui-kinetic-index": currentWord } as CSSProperties}
                    key={`word-${lineIndex}-${partIndex}`}
                  >
                    {word}
                  </span>
                );
              })}
            </span>
          ))}
        </h1>
        <div className="amui-kinetic-typography-hero__footer">
          <p>{supportingText}</p>
          <a href={ctaHref}>{ctaLabel}<span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <div className="amui-kinetic-typography-hero__registration" aria-hidden="true">
        <span /><span /><span />
      </div>
      <div className="amui-kinetic-typography-hero__scroll-rule" aria-hidden="true" />
    </section>
  );
}
