## 2026-06-27 - Icon-only buttons accessibility pattern

**Learning:** We observed a pattern where icon-only action buttons (e.g., toggle states, refresh functionality, call controls) in complex components lack descriptive ARIA labels, making them invisible to screen readers, and lack focus-visible styles, limiting keyboard navigation for assistive technologies.

**Action:** Ensure that all custom icon-only controls use ARIA labels corresponding to their current state or intended action, and add explicit `focus-visible:ring-*` classes rather than relying on default focus rings which often aren't visible against varying backgrounds in this interface.
