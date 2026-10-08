# Artmik UI

**Editorial and motion-focused React components for modern web interfaces.**

[![CI](https://github.com/artashesmikoyan-lgtm/artmik-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/artashesmikoyan-lgtm/artmik-ui/actions/workflows/ci.yml)
![Version 0.1.0](https://img.shields.io/badge/version-0.1.0-1d1d1b)
![MIT License](https://img.shields.io/badge/license-MIT-1d1d1b)
![React](https://img.shields.io/badge/React-18%20%7C%2019-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)

Artmik UI is a small, independent React component library for accessible navigation,
editorial layouts, cursor-responsive imagery, and lightweight reveal motion. The
components are designed to be composed and themed rather than tied to one site.
The v0.1 implementation is original and does not redistribute React Bits component
source.

Runtime dependencies are limited to React and React DOM peer dependencies.
IntersectionObserver, matchMedia, CSS, and React handle motion and interaction.

## Components and hooks

| Export | Purpose |
| --- | --- |
| `FloatingNavbar` | Floating, scroll-collapsing navigation with a responsive menu |
| `HeadTracker` | Pointer-responsive image with optional configurable gaze markers |
| `CursorCharacter` | Character that turns through supplied directional frames to follow the pointer |
| `EditorialSection` | Section structure with optional index, eyebrow, and title |
| `EditorialCard` | Monochrome editorial article/card surface |
| `Reveal` | Lightweight, once-on-view entrance reveal |
| `StaggerReveal` | Staggered entrance for a group of children |
| `useScrollSpy` | Track the active section from arbitrary element IDs |
| `useReducedMotion` | Subscribe to the user's reduced-motion preference |

## Design philosophy

- Editorial structure before decoration.
- Motion that supports hierarchy and respects user preferences.
- Small, composable APIs with no portfolio-specific content.
- Browser primitives and CSS instead of unnecessary runtime dependencies.

## Installation and local development

Requirements: Node.js 20.19+ or 22.12+. npm remains supported for library
consumers and local development; pnpm is used for workspace validation.

Clone the tagged release, install dependencies, and build the library:

```sh
git clone --branch v0.1.0 https://github.com/artashesmikoyan-lgtm/artmik-ui.git
cd artmik-ui
npm install
npm run build
```

Start the demo during local development:

```sh
npm run dev
```

The demo shows the interactive character hero and library components. The
library and demo can be built independently:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run build:demo
npm run validate:registry
npm run test:registry-install
npm run test:package-consumer
```

`npm run build` creates ESM and CommonJS bundles, CSS, and TypeScript declarations
in `dist/`. React and React DOM are peer dependencies and are not bundled. The
test suite uses Vitest, React Testing Library, user-event, and jsdom.

The repository is also a pnpm workspace. The root remains the published
`artmik-ui` package so existing root-level installs, package exports, and npm
packing continue to work:

```sh
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Source registry

`registry.json` is a shadcn-compatible registry index. The initial
`editorial-card` item is in
[`registry/sections/editorial-card`](./registry/sections/editorial-card); it
contains installable component source and its standalone stylesheet, plus a
demo and metadata. It depends only on React and uses no gallery-private
imports or external assets. Registry entries include category, tags, framework,
dependency, installation, reduced-motion, and license metadata.

Run `npm run validate:registry` to check catalog entries and required files, and
`npm run test:registry-install` to stage and verify the files an installer
would receive. Registry files are currently consumed from the local checkout;
a hosted registry endpoint is intentionally outside this phase.

## Usage

Install from a local checkout while developing an application:

```sh
npm install ../artmik-ui
```

Import the library stylesheet once in the application entry point:

```tsx
import "artmik-ui/styles.css";
import {
  EditorialCard,
  EditorialSection,
  FloatingNavbar,
  CursorCharacter,
  HeadTracker,
  Reveal,
  StaggerReveal,
  useReducedMotion,
  useScrollSpy,
} from "artmik-ui";

const navigation = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
];

const directionalFrames = [
  "/images/character-right.webp",
  "/images/character-down-right.webp",
  "/images/character-down.webp",
  "/images/character-down-left.webp",
  "/images/character-left.webp",
  "/images/character-up-left.webp",
  "/images/character-up.webp",
  "/images/character-up-right.webp",
] as const;

function Page() {
  const reducedMotion = useReducedMotion();
  const activeId = useScrollSpy(["work", "about"]);

  return (
    <>
      <FloatingNavbar brand="Studio" items={navigation} activeId={activeId ?? undefined} />
      <EditorialSection id="work" index="01" eyebrow="Selected work" title="Work">
        <StaggerReveal>
          <EditorialCard title="First project">A short description.</EditorialCard>
          <EditorialCard title="Second project">Another short description.</EditorialCard>
        </StaggerReveal>
      </EditorialSection>
      <Reveal>
        <HeadTracker src="/images/example.webp" alt="An abstract illustrated face" eyeTracking />
      </Reveal>
      <CursorCharacter
        frames={directionalFrames}
        centerSrc="/images/character-center.webp"
        alt="Illustrated character looking toward the pointer"
      />
      <p>{reducedMotion ? "Reduced motion is on." : "Motion is available."}</p>
    </>
  );
}
```

`FloatingNavbar` reads active state from hash links with `useScrollSpy` when
`activeId` is not supplied. Pass arbitrary `items` (`href` and `label`); the
component has no built-in destination names or brand. `collapseAfter` controls
the scroll position in pixels at which its links collapse.

`useScrollSpy(sectionIds, options)` accepts any ordered array of section IDs.
Options are `root` (an optional scrolling element), `rootMargin`, `threshold`,
and `initialActiveId`; it returns the active section ID or `null`.

`HeadTracker` accepts `src`, `alt`, `scale`, and `trackingStrength` (clamped from
0 to 1). `eyeTracking` adds decorative moving gaze markers; set `eyeAnchors` to
place them as percentages within the image and optionally provide each marker's
pixel `size`. `touchBehavior` is `"ignore"` by default or `"follow"`. Keep the
image's own `alt` text meaningful; gaze markers are decorative and hidden from
assistive technology. A reduced-motion system preference always disables
tracking; the `reducedMotion` prop can additionally force it off. An action slot
can be passed to `FloatingNavbar` with its `action` prop.

`CursorCharacter` accepts a clockwise-ordered `frames` array (starting with the
character facing right), a `centerSrc`, and meaningful `alt` text. Frames should
be evenly spaced across a full turn and share the same dimensions; `faceAnchor`
sets the gaze point as image percentages and `deadzone` sets the center-look
radius in pixels. `touchBehavior="follow"` enables touch tracking; by default
touch input is ignored. The system reduced-motion preference, or
`reducedMotion`, keeps the character on its center frame.

`Reveal` and `StaggerReveal` take `delay`/`step`, `duration`, `distance`,
`threshold`, and `once` props. Stagger items are wrapped in non-visual
`display: contents` elements. If `IntersectionObserver` is unavailable or
reduced motion is requested, content stays visible without entrance motion.

## Customization

The stylesheet defines defaults as CSS custom properties on `:root`; override
them in the application after importing `artmik-ui/styles.css`:

```css
:root {
  --amui-bg: #f7f5f0;
  --amui-surface: #fff;
  --amui-text: #20201e;
  --amui-text-muted: #77756f;
  --amui-border: rgb(32 32 30 / 14%);
  --amui-accent: #b9492d;
  --amui-radius-sm: 0.4rem;
  --amui-radius-md: 0.9rem;
  --amui-motion-fast: 140ms;
  --amui-motion-normal: 300ms;
}
```

Components also accept `className`; their `amui-*` classes are available for
targeted styling. Defaults are intentionally neutral and can be replaced with
your own palette, spacing, and typography.

## Accessibility

- Navigation uses native links and a real button with `aria-expanded`,
  `aria-controls`, and a labelled navigation landmark.
- The navigation toggle and links have visible `:focus-visible` outlines; the
  menu closes on Escape and returns focus to its toggle.
- Sections/cards use semantic section/article elements with heading hierarchy.
- Reveal effects do not remove content from the document and fall back to
  visible content when observation cannot run.
- Motion responds to `prefers-reduced-motion`; CSS transitions and pointer
  tracking are disabled for that preference.
- Provide useful image alternative text and ensure custom color overrides keep
  adequate contrast.

## Contributions

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, validation, and the
component authoring checklist. The repository's [AGENTS.md](./AGENTS.md) records
the standing implementation and publishing rules.

## Browser support

Target current evergreen browsers (Chrome, Edge, Firefox, and Safari) with
IntersectionObserver, `matchMedia`, pointer events, CSS custom properties, and
`color-mix()` support. Server rendering is supported: browser APIs are only
accessed after mount or through the reduced-motion external-store snapshot.

## License

MIT. See [LICENSE](./LICENSE).
