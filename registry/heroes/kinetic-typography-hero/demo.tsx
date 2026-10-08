import { KineticTypographyHero } from "./component";
import "./styles.css";

export function KineticTypographyHeroDemo() {
  return (
    <KineticTypographyHero
      eyebrow="SIGNAL / 03"
      lines={["Make", "a little", "noise."]}
      supportingText="Words are the material. Rhythm is the architecture."
      ctaLabel="Follow the thought"
      ctaHref="#thought"
      scrollAware
    />
  );
}
