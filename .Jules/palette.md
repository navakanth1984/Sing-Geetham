## 2026-07-15 - File Input Accessibility
**Learning:** The `hidden` utility class (`display: none`) removes file inputs from the keyboard tab order entirely, preventing keyboard-only users from interacting with them.
**Action:** Use Tailwind's `sr-only` class instead on the file `<input>`, and add `focus-within` styles to its parent `<label>` wrapper. This visually hides the default input while keeping it in the tab sequence and visually indicating focus on the custom label design.
