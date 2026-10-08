import type { CSSProperties, HTMLAttributes } from "react";
import { CursorCharacter, type CharacterAnchor, type CursorCharacterProps } from "./CursorCharacter";

export interface InteractiveCharacterHeroProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  frames: readonly string[];
  centerSrc?: string;
  alt: string;
  eyebrow?: string;
  headline?: string[];
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  faceAnchor?: CharacterAnchor;
  characterPosition?: CharacterAnchor;
  deadzone?: number;
  touchBehavior?: CursorCharacterProps["touchBehavior"];
  reducedMotion?: boolean;
}

type CharacterHeroStyle = CSSProperties & {
  "--amui-character-x": string;
  "--amui-character-y": string;
};

export function InteractiveCharacterHero({
  frames,
  centerSrc,
  alt,
  eyebrow = "A STUDY IN ATTENTION",
  headline = ["LOOK", "CLOSER."],
  description = "A small shift in perspective changes the whole picture.",
  ctaLabel = "Find your angle",
  ctaHref = "#angle",
  faceAnchor = { x: 50, y: 38 },
  characterPosition = { x: 68, y: 54 },
  deadzone = 44,
  touchBehavior = "ignore",
  reducedMotion,
  className,
  style,
  ...sectionProps
}: InteractiveCharacterHeroProps) {
  const safePosition = (value: number, fallback: number) =>
    Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
  const heroStyle: CharacterHeroStyle = {
    ...style,
    "--amui-character-x": `${safePosition(characterPosition.x, 68)}%`,
    "--amui-character-y": `${safePosition(characterPosition.y, 54)}%`,
  };
  const safeHeadline = headline.length > 0 ? headline : ["LOOK", "CLOSER."];

  return (
    <section
      {...sectionProps}
      className={["amui-interactive-character-hero", className].filter(Boolean).join(" ")}
      style={heroStyle}
      data-touch-behavior={touchBehavior}
    >
      <div className="amui-interactive-character-hero__frame">
        <div className="amui-interactive-character-hero__register" aria-hidden="true">
          <span>PORTRAIT / 08 VIEWS</span><i />
        </div>
        <CursorCharacter
          className="amui-interactive-character-hero__character"
          imageClassName="amui-interactive-character-hero__image"
          frames={frames}
          centerSrc={centerSrc ?? frames[0] ?? ""}
          alt={alt}
          faceAnchor={faceAnchor}
          deadzone={deadzone}
          touchBehavior={touchBehavior}
          reducedMotion={reducedMotion}
        />
        <div className="amui-interactive-character-hero__annotation" aria-hidden="true">
          <span>YOUR POSITION</span><i /><span>THEIR ATTENTION</span>
        </div>
      </div>
      <div className="amui-interactive-character-hero__copy">
        <p className="amui-interactive-character-hero__eyebrow">{eyebrow}</p>
        <h1 className="amui-interactive-character-hero__headline">
          {safeHeadline.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
        </h1>
        <p className="amui-interactive-character-hero__description">{description}</p>
        <a className="amui-interactive-character-hero__cta" href={ctaHref}>
          <span className="amui-interactive-character-hero__cta-mark" aria-hidden="true">↗</span>
          {ctaLabel}
        </a>
        <p className="amui-interactive-character-hero__hint">
          {touchBehavior === "follow" ? "MOVE POINTER OR TOUCH TO TURN" : "MOVE POINTER TO TURN"}
        </p>
      </div>
      <div className="amui-interactive-character-hero__edge-label" aria-hidden="true">FRAME / 01—08</div>
    </section>
  );
}
