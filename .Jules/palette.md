## 2025-03-05 - File Input Accessibility
**Learning:** Using `display: none` or Tailwind's `hidden` on a file input completely removes it from the accessibility tree, making it impossible for keyboard users to navigate to it or for screen readers to announce it.
**Action:** When creating custom styled file upload areas, apply `sr-only` to the `<input type="file">` to keep it visually hidden but accessible to assistive technologies. Then, apply `focus-within` styles to the parent `<label>` to display a visual focus indicator when the input receives keyboard focus.
