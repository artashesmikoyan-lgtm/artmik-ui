---
name: component-authoring
description: Author or extract reusable components for the Artmik UI React library.
---

# Artmik UI Component Authoring

Use this workflow when creating or extracting a reusable component:

1. Understand the interaction or problem being solved.
2. Design the public API before implementation.
3. Confirm the behavior is generic and not portfolio-specific.
4. Identify dependencies and prefer the smallest dependency set.
5. Implement with strict TypeScript.
6. Add accessible semantics and keyboard behavior.
7. Add reduced-motion support when motion is involved.
8. Support responsive and touch behavior where applicable.
9. Add or update generic demo usage.
10. Add or update automated tests.
11. Export intentionally through the public API.
12. Run lint, typecheck, tests, library build, and demo build.

## Authoring Checklist

- Is this component actually reusable?
- Does the API expose implementation details unnecessarily?
- Is any personal content hardcoded?
- Is third-party-derived code involved?
- Are event listeners cleaned up?
- Are observers disconnected?
- Does keyboard navigation work?
- Does touch work?
- Does reduced motion work?
- Are focus states visible?
- Does the component require a dependency that can be avoided?
- Is tree-shaking preserved?
- Are TypeScript declarations generated?
- Has the demo been updated?
- Have tests been added?
