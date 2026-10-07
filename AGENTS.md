# Artmik UI Mission

Artmik UI is a reusable public React + TypeScript UI library focused on:

- Editorial interfaces
- Restrained motion
- Accessibility
- Composable APIs
- Minimal runtime dependencies
- Production-quality reusable components

It is not the Art Mik personal portfolio.

## Core Rules

- Never hardcode Art Mik personal information.
- Never hardcode portfolio-specific sections or project names.
- Prefer generic reusable APIs.
- Use strict TypeScript.
- Keep runtime dependencies minimal.
- Prefer browser APIs and CSS when they solve the problem cleanly.
- Preserve keyboard accessibility.
- Support touch and mobile interactions.
- Respect `prefers-reduced-motion`.
- Components must work outside the demo app.
- Keep public APIs intentionally small.
- Avoid unnecessary abstractions.

## Third-Party Code

Classify code as **ORIGINAL**, **ADAPTED / DERIVED**, or **THIRD-PARTY**.

Do not copy React Bits or other third-party source into this library without
explicit approval and license review. React Bits-derived portfolio components
are not allowed into this repository by default.

## Component Quality

Every public component must:

- Expose typed props and support `className` when appropriate.
- Avoid personal content and use accessible semantics.
- Work responsively and support reduced motion when motion is involved.
- Avoid unnecessary side effects and clean up observers/listeners.
- Be documented in the demo or README.

## Validation

Before completing coding work, run:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run build:demo
```

Use the relevant commands if scripts differ. Do not report success if validation
fails.

## Publishing

Never create a public GitHub repository, push releases, publish to npm, or create
Git tags without explicit user approval.

## Reports

Keep final reports concise. Report files changed, major implementation
decisions, validation results, and blockers or remaining issues. Do not repeat
the full task or list every command executed.
