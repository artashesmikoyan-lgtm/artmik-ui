import { InteractiveCharacterHero } from "./component";
import "./styles.css";
import center from "./assets/portrait-center.svg";
import north from "./assets/portrait-00.svg";
import northeast from "./assets/portrait-01.svg";
import east from "./assets/portrait-02.svg";
import southeast from "./assets/portrait-03.svg";
import south from "./assets/portrait-04.svg";
import southwest from "./assets/portrait-05.svg";
import west from "./assets/portrait-06.svg";
import northwest from "./assets/portrait-07.svg";

const directionalFrames = [east, southeast, south, southwest, west, northwest, north, northeast];

export function InteractiveCharacterHeroDemo() {
  return (
    <InteractiveCharacterHero
      frames={directionalFrames}
      centerSrc={center}
      alt="Original illustrated bronze observatory automaton"
      eyebrow="THE OBSERVATORY / 08 VIEWS"
      headline={["LOOK", "CLOSER."]}
      description="A small shift in perspective changes the whole picture."
      ctaLabel="Find your angle"
      ctaHref="#angle"
      faceAnchor={{ x: 50, y: 36 }}
      deadzone={36}
      touchBehavior="follow"
    />
  );
}
