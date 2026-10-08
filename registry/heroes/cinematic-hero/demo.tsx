import { CinematicHero } from "./component";
import "./styles.css";

export function CinematicHeroDemo() {
  return (
    <CinematicHero
      eyebrow="FIELD NOTES / 01"
      title={["A quieter", "kind of bold."]}
      subtitle="Motion with room to breathe. A cinematic opening frame for what comes next."
      ctaLabel="Discover the collection"
      ctaHref="#collection"
      height="min(760px, 100svh)"
    />
  );
}
