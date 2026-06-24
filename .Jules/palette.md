## 2026-06-24 - [File Input Accessibility]
**Learning:** Using `hidden` on file inputs makes them completely inaccessible to keyboard users and screen readers, breaking standard form accessibility. Hiding them visually while keeping them semantically available is crucial.
**Action:** Always use Tailwind's `sr-only` class instead of `hidden` for file inputs and apply `focus-within` styles to the parent wrapper (like `<label>`) to ensure keyboard users receive clear visual focus feedback.
