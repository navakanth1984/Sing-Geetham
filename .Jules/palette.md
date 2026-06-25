## 2026-06-25 - [Missing ARIA labels on Icon-only Buttons]
**Learning:** Found a pattern where icon-only buttons (like LogOut and Download icons) were missing `aria-label` attributes, making them inaccessible to screen reader users. They also lacked focus rings for keyboard navigation.
**Action:** When implementing icon-only buttons, always include an `aria-label` that describes the action, and add `focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-amber-500 rounded-md` for clear keyboard focus states.
