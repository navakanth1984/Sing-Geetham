## 2024-06-28 - Keyboard Accessible File Inputs
**Learning:** Using `hidden` on an `<input type="file">` makes it impossible for keyboard users to navigate to and trigger it, breaking form accessibility.
**Action:** Replace `hidden` with Tailwind's `sr-only` (screen-reader only) class on the input, and add `focus-within:ring-2 focus-within:ring-amber-500` (along with offset classes if appropriate for the dark background) to the parent `<label>` so the visual focus indicator clearly shows the user where they are.
