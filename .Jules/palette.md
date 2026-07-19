## 2025-03-01 - Accessible Custom File Inputs
**Learning:** Using `display: none` (like Tailwind's `hidden`) on file inputs makes them completely invisible to both screen readers and keyboard navigation (they cannot be focused via tab).
**Action:** Always use visually hidden techniques (like Tailwind's `sr-only`) on the `<input>` element instead, and apply focus styles (e.g., `focus-within:ring-2`) to its wrapping `<label>` so keyboard users have a visual indicator when the input receives focus.
