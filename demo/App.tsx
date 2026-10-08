import {
  EditorialCard,
  EditorialSection,
  FloatingNavbar,
  CursorCharacter,
  Reveal,
  StaggerReveal,
  useReducedMotion,
  useScrollSpy,
} from "../src";

const characterFrames = [
  new URL("./assets/cursor-character/frame_00.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_04.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_08.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_12.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_16.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_20.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_24.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_28.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_32.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_36.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_40.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_44.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_48.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_52.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_56.webp", import.meta.url).href,
  new URL("./assets/cursor-character/frame_60.webp", import.meta.url).href,
] as const;

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
        className="demo-hero-nav"
        brand={<span>ARTMIK <span className="demo-nav-mark">/ UI</span></span>}
        items={sections}
        action={<a className="demo-nav-action" href="#components">Explore <span aria-hidden="true">↗</span></a>}
        ariaLabel="Demo sections"
        collapseAfter={48}
      />
      <main>
        <section className="demo-hero-page" aria-labelledby="demo-hero-title">
          <div className="demo-hero-stage">
            <CursorCharacter
              className="demo-hero-character"
              frames={characterFrames}
              centerSrc={new URL("./assets/cursor-character/center.webp", import.meta.url).href}
              alt="A hooded cat looking toward the pointer"
              faceAnchor={{ x: 56, y: 42 }}
              deadzone={42}
            />
          </div>
          <div className="demo-hero-shade" aria-hidden="true" />
          <div className="demo-hero-intro">
            <p className="demo-hero-eyebrow">A characterful UI library</p>
            <h1 id="demo-hero-title">A little more<br />character.</h1>
            <p className="demo-hero-copy">
              Thoughtful building blocks for interfaces that feel a little more human.
            </p>
            <div className="demo-hero-actions">
              <a className="demo-hero-button demo-hero-button--light" href="#components">
                Explore components <span aria-hidden="true">↗</span>
              </a>
              <a className="demo-hero-button demo-hero-button--glass" href="#principles">
                Our approach
              </a>
            </div>
          </div>
          <p className="demo-hero-hint">
            <span className="demo-hero-hint__dot" aria-hidden="true" />
            Move your cursor; watch the character follow
          </p>
        </section>

        <EditorialSection id="principles" index="01" eyebrow="Foundation" title="A quiet foundation.">
          <div className="demo-two-column">
            <Reveal>
              <p className="demo-copy">
                Artmik UI is a small collection of composable React primitives. Start with structure,
                then add only the motion and detail your content needs.
              </p>
            </Reveal>
            <div className="demo-principles-status">
              <ActiveSectionStatus />
              <p className="demo-active">
                Motion preference: <strong>{reducedMotion ? "Reduced" : "Full"}</strong>
              </p>
            </div>
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
