import {
  EditorialCard,
  EditorialSection,
  FloatingNavbar,
  HeadTracker,
  Reveal,
  StaggerReveal,
  useReducedMotion,
  useScrollSpy,
} from "../src";

const sections = [
  { href: "#principles", label: "Principles" },
  { href: "#components", label: "Components" },
  { href: "#motion", label: "Motion" },
] as const;

function ActiveSectionStatus() {
  const activeId = useScrollSpy(["principles", "components", "motion"]);
  return <p className="demo-active">Scroll spy: <strong>{activeId ?? "—"}</strong></p>;
}

export function App() {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <FloatingNavbar
        brand={<span>AM / UI</span>}
        items={sections}
        action={<a className="demo-nav-action" href="#components">Explore</a>}
        ariaLabel="Demo sections"
        collapseAfter={48}
      />
      <main>
        <section className="demo-hero">
          <p className="demo-kicker">Small pieces, considered motion</p>
          <h1>Editorial building blocks<br />for the open web.</h1>
          <p>Independent components that bring clarity, rhythm, and a little movement to interfaces.</p>
          <ActiveSectionStatus />
          <p className="demo-active">Motion preference: <strong>{reducedMotion ? "Reduced" : "Full"}</strong></p>
        </section>

        <EditorialSection id="principles" index="01" eyebrow="Foundation" title="A quiet foundation.">
          <div className="demo-two-column">
            <Reveal>
              <p className="demo-copy">
                Artmik UI is a small collection of composable React primitives. Start with structure,
                then add only the motion and detail your content needs.
              </p>
            </Reveal>
            <HeadTracker
              className="demo-avatar"
              src={new URL("./avatar.svg", import.meta.url).href}
              alt="Illustrated abstract face"
              scale={1.08}
              trackingStrength={0.8}
              eyeTracking
              eyeAnchors={[{ x: 43, y: 40 }, { x: 59, y: 40 }]}
            />
          </div>
        </EditorialSection>

        <EditorialSection id="components" index="02" eyebrow="Primitives" title="Structure with room to breathe.">
          <StaggerReveal className="demo-card-grid" step={110}>
            <EditorialCard index="A" eyebrow="Layout" title="EditorialSection">
              A clear section wrapper with an optional index, eyebrow, title, and content slot.
            </EditorialCard>
            <EditorialCard index="B" eyebrow="Surface" title="EditorialCard">
              A restrained monochrome surface for a note, feature, or short piece of content.
            </EditorialCard>
            <EditorialCard index="C" eyebrow="Navigation" title="FloatingNavbar">
              A responsive navigation bar that compacts after scrolling and exposes an accessible menu.
            </EditorialCard>
          </StaggerReveal>
        </EditorialSection>

        <EditorialSection id="motion" index="03" eyebrow="Motion" title="Movement with a reason.">
          <div className="demo-motion-grid">
            <Reveal delay={80} distance={28}>
              <div className="demo-motion-note">
                <span className="demo-motion-orb" aria-hidden="true" />
                <p>Reveal enters once, when the content is in view.</p>
              </div>
            </Reveal>
            <p className="demo-copy">
              Reveal and StaggerReveal use the browser's IntersectionObserver. Both render content
              visibly when observation is unavailable and honor reduced-motion preferences.
            </p>
          </div>
        </EditorialSection>
      </main>
      <footer className="demo-footer">Artmik UI · local component demo</footer>
    </>
  );
}
