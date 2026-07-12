## 2024-07-12 - Accessible File Inputs with Tailwind
**Learning:** Using `hidden` (display: none) on file inputs makes them entirely unreachable via keyboard navigation, breaking accessibility for custom styled file dropzones.
**Action:** Always use `sr-only` on the `<input>` instead of `hidden`, and add `focus-within:ring-2 focus-within:ring-amber-500` to the wrapping parent `<label>` to provide clear visual feedback when the hidden input receives focus.
