## 2026-06-30 - Added proper ARIA roles to custom tab navigation
**Learning:** Custom tab navigations built with divs/navs often miss crucial ARIA states (role='tablist', role='tab', aria-selected), making them inaccessible to screen readers.
**Action:** Always check custom navigation components to ensure they behave semantically like tabs or lists, and explicitly add focus-visible styles to ensure keyboard users can navigate them easily.
