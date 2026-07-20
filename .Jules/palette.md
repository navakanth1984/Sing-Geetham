
## 2026-07-20 - Accessible File Input Component Styling
**Learning:** In Tailwind CSS, setting `type="file"` inputs to `hidden` entirely removes them from the accessibility tree, making it impossible to navigate them using a keyboard or screen reader. Wrapping them in a `<label>` only solves the pointer (click) issue.
**Action:** Use Tailwind's `sr-only` on the `<input>` instead, so it remains in the accessibility tree and is focusable. Then, apply `focus-within:ring-2 focus-within:ring-amber-500` to the parent `<label>` to visually indicate keyboard focus when the hidden input receives it.
