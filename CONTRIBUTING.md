# Contributing

Thanks for your interest in Artmik UI. Keep contributions focused, typed, accessible,
and independent of any one portfolio or application.

## Local setup

```sh
npm install
npm run dev
```

The repository root remains the public `artmik-ui` package for compatibility.
Use `corepack pnpm install` when working with the pnpm workspace.

## Validation

Run the checks before opening a contribution:

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

## Before submitting

Use existing CSS variables where possible, support reduced motion, and include a
demo or test for user-facing behavior. Do not add third-party component source
without checking its license and recording its provenance.

Registry items belong in the category directories under `registry/`. Each item
must declare standalone source and styles, install-time dependencies, required
assets, reduced-motion behavior, license, and installation instructions in the
shadcn-compatible index and item metadata. Avoid imports from the demo or
gallery.
