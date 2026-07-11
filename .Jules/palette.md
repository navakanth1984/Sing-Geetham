## 2024-05-18 - [Accessible File Input]
**Learning:** Using `hidden` on file inputs breaks keyboard navigation. Users relying on keyboards cannot focus or activate the upload.
**Action:** Replace `hidden` with `sr-only` on the `<input>` and apply `focus-within:ring-2` to the wrapping `<label>` to maintain design while ensuring keyboard accessibility.
