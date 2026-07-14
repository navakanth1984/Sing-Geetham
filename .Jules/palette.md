## 2026-07-14 - [File Input Accessibility]
**Learning:** Using `hidden` or `display: none` on file inputs makes them completely inaccessible to keyboard users and screen readers, breaking form navigation.
**Action:** Use Tailwind's `sr-only` class instead to hide the input visually while keeping it in the accessible DOM, and add `focus-within` styles to its parent `<label>` to provide clear visual feedback when focused.
