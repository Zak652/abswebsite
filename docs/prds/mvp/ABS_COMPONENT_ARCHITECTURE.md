
# ABS Component Architecture

## Developer + AI Ready UI System (v1.0)

```md
# Asset Business Solutions (ABS)
## Component Architecture System

This document defines reusable UI building blocks for:

- ABS Website
- Arcplus SaaS
- Admin dashboards
- Future ABS platforms

All UI must be assembled from components defined here.

No page-specific styling allowed outside this system.

---

# 1. Architecture Philosophy

ABS UI follows:

COMPOSE → CONFIGURE → SCALE

Pages are NOT designed individually.

Pages are composed using standardized components.

Benefits:
- Faster development
- Predictable UI
- AI-safe generation
- Cross-product consistency

---

# 2. Component Layer Model

UI is divided into 5 layers:

```

Tokens → Primitives → Components → Patterns → Pages

```

## Layer Definitions

### 1. Tokens
Colors, spacing, typography.
(Source: ABS Design Tokens)

---

### 2. Primitives (Atomic UI)

Basic reusable elements.

Examples:
- Button
- Text
- Container
- Icon
- Stack
- Grid

No business logic allowed.

---

### 3. Components (Functional UI)

Reusable UI blocks.

Examples:
- Navbar
- Product Card
- Pricing Table
- Form Input
- Stepper

Contain interaction logic.

---

### 4. Patterns (Experience Units)

Multi-component assemblies.

Examples:
- Hero Section
- Configurator Panel
- Guided Flow
- Feature Grid

---

### 5. Pages

Compositions of patterns only.

---

# 3. Folder Structure (Next.js)

```

/components
/primitives
/ui
/patterns
/layouts
/sections

```

---

# 4. Primitive Components

## Button

Variants:
- primary
- secondary
- ghost
- danger

Props:

```

<Button
variant="primary"
size="md"
loading={false}

>

```

Rules:
- Uses token colors only
- Includes hover/focus states
- Supports loading spinner

---

## Container

Controls layout width.

```

<Container size="xl">
```

Sizes:

* sm
* md
* lg
* xl

---

## Stack

Vertical spacing abstraction.

```
<Stack gap="space-5">
```

Prevents manual margins.

---

## Text

Typography wrapper.

```
<Text variant="h2">
```

Variants map to token scale.

---

# 5. Core UI Components

## Navbar

Purpose:
Primary navigation + conversion entry.

Features:

* Sticky
* Scroll background transition
* Mobile collapse

Props:

```
<Navbar transparent />
```

Includes:

* Logo
* Navigation links
* Primary CTA

---

## HeroSection

Reusable hero engine.

Props:

```
<HeroSection
  title=""
  subtitle=""
  primaryCTA=""
  secondaryCTA=""
/>
```

Supports:

* image background
* video background
* gradient overlay

---

## ProductCard

Used across hardware + software.

Props:

```
<ProductCard
  title=""
  description=""
  image=""
  href=""
/>
```

Behavior:

* Hover elevation
* CTA reveal

---

## FeatureGrid

Displays solution capabilities.

```
<FeatureGrid columns={3} />
```

Responsive automatically.

---

## PricingTable

Supports Arcplus subscriptions.

Features:

* Monthly/Annual toggle
* Recommended highlight

---

## Stepper

Used for:

* RFQ flow
* Training registration
* Trial onboarding

```
<Stepper currentStep={2} />
```

---

## FormInput

Unified form system.

Types:

* text
* email
* select
* textarea

Includes validation visuals.

---

# 6. ABS Signature Components

These differentiate ABS from generic SaaS sites.

---

## ConfiguratorPanel ⭐

Core hardware experience.

Layout:
Left: visualization
Right: configuration

Features:

* Dynamic updates
* Sticky summary
* Progressive disclosure

Props:

```
<ConfiguratorPanel
  options={}
  onChange={}
>
```

---

## QuoteSummaryCard

Displays live RFQ summary.

Auto-updates selections.

---

## GuidedPathSelector

Homepage interaction.

Three selectable paths:

* Software
* Hardware
* Services

Animated hover expansion.

---

## WorkflowVisualizer

Shows asset lifecycle.

Tag → Capture → Manage → Verify → Optimize

Animated arrows.

---

# 7. Layout Components

## PageLayout

```
<PageLayout>
  children
</PageLayout>
```

Includes:

* Navbar
* Footer
* SEO wrapper

---

## DashboardLayout (Arcplus)

Sidebar + Content layout.

Reusable for SaaS.

---

# 8. Interaction Standards

All components must support:

```
default
hover
focus
active
disabled
loading
```

No exceptions.

---

# 9. Animation System

Libraries:

* Framer Motion (micro)
* GSAP (scroll storytelling)

Rules:

* Motion explains interaction
* Max duration: 400ms

---

# 10. Data Integration Pattern

Components NEVER fetch data directly.

Use:

```
/hooks
/services/api
```

Pattern:

```
Page → Hook → API → Backend
```

---

# 11. AI Generation Rules

AI agents must:

✅ Use existing components
✅ Extend props only
❌ Create new visual styles
❌ Hardcode spacing/colors

AI prompt template:

"Build using ABS component system only."

---

# 12. Naming Convention

```
PascalCase for components
camelCase for props
```

Examples:

* ProductCard
* GuidedPathSelector

---

# 13. MVP Component Priority

Build in this order:

1. Primitives
2. Navbar
3. HeroSection
4. ProductCard
5. GuidedPathSelector
6. ConfiguratorPanel
7. PricingTable
8. Stepper
9. Forms
10. Layouts

---

# 14. Future Expansion

Components must work across:

* Website
* Arcplus app
* Customer portal
* Mobile apps (future)

---

# Execution Rule

If a UI element repeats twice,
it becomes a component.

If used across products,
it becomes a core component.

---