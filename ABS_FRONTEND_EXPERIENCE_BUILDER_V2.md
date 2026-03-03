# ABS Unified Platform — Frontend Experience Builder v2

## Role

Act as a Senior Product Experience Architect and Enterprise Frontend Engineer.

You are building a **self-guided digital product experience**, not a marketing website.

This document defines how ABS presents products visually,
interactively, and commercially.

The website behaves as a DIGITAL SHOWROOM.

Inspired by:
- apple.com
- apple.com/store
- enterprise SaaS onboarding flows
- industrial product catalogs

---

# 1. Core Principle

Users must be able to:

SEE → UNDERSTAND → COMPARE → CONFIGURE → ACT

WITHOUT contacting ABS.

Images are not decoration.
Images ARE the primary communication layer.

---

# 2. Navigation Architecture (UPDATED)

Sticky Navigation:

LOGO | Arcplus | Scanners | Tags | Services | Training | Start Trial

---

## Scanners Menu (Mega Menu)

Categories:

### Fixed Scanners
- Barcode Fixed
- RFID Fixed

### Handheld Devices
- PDA Scanners
- Opticon Readers
- Handheld RFID

### Wearable
- Ring Scanners
- Wearable RFID

Each item shows:
- product image
- short capability description
- quick compare link

---

## Tags Menu (Mega Menu)

Categories:

### RFID Tags
- Metal mount
- Long range
- Industrial

### Barcode Tags
- Polyester
- Aluminum
- Tamper proof

### GPS Tags
- Fleet tracking
- Asset tracking

Filter by:
- Environment
- Range
- Application

---

# 3. Product Image System ⭐ (NEW)

ABS uses structured image storytelling.

Every product page includes:

1. HERO IMAGE
   - clean isolated product
   - light background

2. CONTEXT IMAGE
   - product in real environment

3. DETAIL IMAGE
   - close-up materials

4. USE CASE IMAGE
   - real workflow

5. CONFIGURATION VISUAL
   - diagram or UI overlay

---

## Image Behavior

Images must:

- scale subtly on scroll
- fade between sections
- remain distraction-free

NO:
- stock handshake imagery
- abstract tech visuals

---

# 4. Homepage — Product Showroom Flow

Hero:
"Control Every Asset."

Background:
Hardware + software blended imagery.

---

## Product Gallery (Apple-style)

Horizontal scroll:

[Arcplus] [Scanners] [Tags] [Services]

Large tiles:
- image-first
- minimal text
- hover reveal CTA

---

## Guided Decision Section

Question-based entry:

"What do you need to achieve?"

Buttons:
- Digitize asset management → Arcplus
- Capture assets faster → Scanners
- Tag assets permanently → Tags
- Build asset register → Services

---

# 5. Arcplus Experience (Expanded)

Arcplus is treated as a PRODUCT PLATFORM.

---

## Modules Showcase

Interactive grid:

- Register
- Operations
- Depreciation
- Disposal
- AACSM (asset acquisition & construction supervision module)
- Stock
- Fleet
- Maintenance

Hover reveals module capability.

Click opens detail panel.

---

## Dashboard Preview

Animated UI walkthrough.

Shows lifecycle flow:
Register → Operate → Maintain → Depreciate → Dispose.

---

# 6. Arcplus Pricing System ⭐

Pricing Cards:

Starter — Up to 1,000 assets — $4,500/year  
Growth — 1,001–5,000 assets — $7,500/year  
Professional — 5,001–20,000 assets — $12,500/year  
Enterprise — Custom pricing

---

## Billing Switcher

Toggle:

[ Monthly ]  [ Annual (Save 15%) ]

Behavior:
- price animates smoothly
- annual highlighted default

Monthly derived automatically from annual.

---

## Pricing UX Rules

- Highlight Growth as Recommended
- Feature comparison expandable
- Enterprise triggers consultation form

---

# 7. Product Configuration Experience

Configurator layout:

LEFT:
Large product visuals updating dynamically.

RIGHT:
Options selector.

BOTTOM:
Sticky summary bar.

Live feedback required.

---

# 8. Comparison Experience (NEW)

Users can compare:

- scanners
- tags
- Arcplus tiers

Comparison table appears as overlay.

---

# 9. Services Presentation (Outcome-Based)

Each service page includes:

Problem → Process → Deliverables → Result

Visual timeline required.

---

# 10. Visual Motion Rules

Motion types:

Reveal → Inform  
Scale → Focus  
Slide → Progress

Max duration: 400ms.

---

# 11. Conversion Points

Every page must include:

Primary CTA:
- Start Free Trial
OR
- Configure Solution

Secondary CTA:
- Get Quote

---

# 12. Trust Layer

Placed after product storytelling:

- Client industries
- Deployment scale
- Case outcomes

---

# 13. Mobile Experience Priority

Mobile = Guided assistant.

Menus become:
Step navigation instead of dropdown overload.

---

# 14. Experience Goal

The website must feel like:

"A digital asset management showroom."

Users should feel:
"I already understand ABS before speaking to anyone."

---

# Interaction Components (Reusable)

## Product Card
Hover lift + soft shadow increase.

## Configurator Panel
Sticky right column.
Real-time updates.

## Progress Stepper
Horizontal step indicator.

## Comparison Table
Highlight recommended option.

---

# Visual Content Rules

Images must show:
- Real equipment
- Field operations
- Professional environments
- Software UI overlays

Avoid:
- Abstract tech imagery
- Stock business handshakes

---

# Typography

Headings:
Inter / Plus Jakarta Sans

Body:
Inter

Data:
JetBrains Mono

---

# Color Philosophy

Background:
Warm white

Primary:
Deep Industrial Blue

Accent:
Signal Orange

Neutral:
Warm light grey backgrounds.

---

# Technical Stack (Frontend)

- React (Next.js)
- TailwindCSS
- GSAP animations
- Framer Motion (micro interactions)
- REST API integration

---

# Performance Requirements

- Lighthouse ≥ 90
- Lazy-loaded images
- Route-based code splitting
- Optimized fonts

---

# Accessibility

- WCAG AA contrast
- Keyboard navigation
- Form labels required
- Motion reduced when prefers-reduced-motion enabled

---

# Build Sequence (MANDATORY)

1. Build navigation + layout shell
2. Implement homepage guided flow
3. Build Arcplus journey
4. Implement hardware configurator
5. Implement RFQ engine
6. Add services pages
7. Add training registration
8. Connect APIs
9. Optimize performance

---

# Execution Directive

Do not build pages.

Build a guided decision system.

Every scroll should help the user decide:
"What do I need next?"