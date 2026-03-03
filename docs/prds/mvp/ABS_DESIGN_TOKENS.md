# Asset Business Solutions (ABS)
## Unified Design Token System v1.0

This document defines the visual foundation for all ABS digital products:

- ABS Website
- Arcplus SaaS
- Admin dashboards
- Future ABS applications

Design tokens ensure consistency across teams, platforms, and AI-assisted development.

---

# 1. Design Philosophy

ABS design expresses:

- Industrial reliability
- Enterprise clarity
- Modern intelligence
- Guided simplicity

Tone:
Professional, calm, precise, trustworthy.

Avoid:
- Startup neon aesthetics
- Overly playful UI
- Heavy gradients
- Visual clutter

---

# 2. Color System

## Brand Colors

### Primary — Industrial Blue
Used for primary actions and trust signals.
--color-primary-900: #0B1F3A;
--color-primary-700: #173A63;
--color-primary-500: #1F5FAF;
--color-primary-300: #6FA3E3;
--color-primary-100: #E8F1FB;

Usage:
- Primary buttons
- Active states
- Links
- Key highlights

---

### Accent — Signal Orange
Used sparingly for emphasis.
--color-accent-600: #E35B2C;
--color-accent-400: #FF7A45;
--color-accent-100: #FFE9E1;


Usage:
- Notifications
- Selected configuration
- CTA reinforcement

---

### Neutral System
--color-neutral-900: #111827;
--color-neutral-700: #374151;
--color-neutral-500: #6B7280;
--color-neutral-300: #D1D5DB;
--color-neutral-100: #F3F4F6;
--color-neutral-50: #FAFAFA;


---

### Semantic Colors

Success:
--color-success: #16A34A;


Warning:
--color-warning: #F59E0B;


Error:
--color-error: #DC2626;


Info:
--color-info: #2563EB;


---

# 3. Typography Tokens

## Font Families
--font-heading: "Plus Jakarta Sans", sans-serif;
--font-body: "Inter", sans-serif;
--font-mono: "JetBrains Mono", monospace;


---

## Type Scale

| Token | Size | Use |
|---|---|---|
| text-display | 56px | Hero headings |
| text-h1 | 40px | Page headers |
| text-h2 | 32px | Section headers |
| text-h3 | 24px | Subsections |
| text-body-lg | 18px | Important copy |
| text-body | 16px | Default |
| text-small | 14px | Labels |
| text-xs | 12px | Metadata |

Line height:
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.7;


---

# 4. Spacing System (8px Grid)

All spacing follows an 8px rhythm.
--space-1: 4px;
--space-2: 8px;
--space-3: 16px;
--space-4: 24px;
--space-5: 32px;
--space-6: 48px;
--space-7: 64px;
--space-8: 96px;
--space-9: 128px;


Section spacing:
--section-padding-y: 96px;


---

# 5. Layout Tokens

Container widths:
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;


Grid:
12-column responsive grid
Gap: 24px desktop / 16px mobile


---

# 6. Border Radius

ABS uses soft industrial rounding.
--radius-sm: 6px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;

Cards default:
--radius-card: var(--radius-lg);

---

# 7. Elevation (Shadows)

Subtle only.
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);
--shadow-lg: 0 10px 30px rgba(0,0,0,0.12);


Rules:
- No harsh shadows
- Elevation communicates interaction

---

# 8. Motion Tokens

Motion communicates system response.

Duration:
--motion-fast: 120ms;
--motion-normal: 240ms;
--motion-slow: 400ms;

Easing:
--ease-standard: cubic-bezier(0.4,0,0.2,1);
--ease-emphasized: cubic-bezier(0.2,0,0,1);


---

# 9. Component Tokens

## Buttons

Primary:
- Background: primary-500
- Text: white
- Radius: md
- Hover: primary-700

Secondary:
- Border: neutral-300
- Background: white

---

## Cards
padding: space-5
radius: radius-lg
shadow: shadow-md
hover: shadow-lg

---

## Inputs

Height:
44px

Focus:
2px primary-500 outline


---

# 10. Interaction States

All interactive components support:

- default
- hover
- active
- focus
- disabled
- loading

---

# 11. Dark Mode (Future)

Not MVP.

Reserve tokens:
--color-bg-dark
--color-text-dark


---

# 12. Tailwind Mapping (Implementation)

Example:

```js
theme: {
  colors: {
    primary: {500:'#1F5FAF'}
  },
  borderRadius: {
    lg:'16px'
  }
}


13. Governance Rules

Never introduce new colors or spacing without token addition.

All UI must reference tokens — never hardcoded values.


14. Evolution Strategy

Version tokens:

v1.0 — Website MVP

v1.5 — Arcplus UI alignment

v2.0 — Multi-product ecosystem
