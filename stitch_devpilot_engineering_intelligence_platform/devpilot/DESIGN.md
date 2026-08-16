---
name: DevPilot
colors:
  surface: '#121315'
  surface-dim: '#121315'
  surface-bright: '#38393b'
  surface-container-lowest: '#0d0e10'
  surface-container-low: '#1b1c1e'
  surface-container: '#1f2022'
  surface-container-high: '#292a2c'
  surface-container-highest: '#343537'
  on-surface: '#e3e2e5'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e3e2e5'
  inverse-on-surface: '#303033'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#121315'
  on-background: '#e3e2e5'
  surface-variant: '#343537'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  code-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  caption:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

## Brand & Style

This design system is built for an AI-powered engineering intelligence platform, prioritizing high information density, technical precision, and a "developer-first" aesthetic. The brand personality is focused, efficient, and authoritative, moving away from decorative fluff toward functional minimalism.

The design style is **Corporate Modern with a Developer Edge**. It utilizes deep charcoal surfaces, sharp geometric typography, and intentional color accents to highlight critical data points and AI-driven insights. It draws inspiration from modern IDEs and developer tools, favoring clarity and speed over visual noise.

**Key Visual Principles:**
- **Density over Air:** High information density is maintained through tight spacing and clear visual hierarchy.
- **AI Integration:** AI features are treated as native enhancements, signified by subtle emerald glows rather than disruptive overlays.
- **Functional Aesthetics:** Every line, border, and color serves a purpose—primarily to categorize, prioritize, or alert.

## Colors

The palette is optimized for long-duration focus in a "dark-mode-first" environment. 

- **Primary (Electric Blue):** Used for primary actions, active states, and navigation highlights.
- **Secondary (Emerald):** Reserved for "AI-positive" states, success indicators, and system health.
- **Tertiary (Amber/Red):** Used exclusively for risks, blockers, and warnings.
- **Neutrals:** A multi-layered charcoal system. The base background is `#0B0C0E`. Surfaces (cards, sidebars) use `#16181D`. Visual separation is achieved through `#242830` borders rather than heavy shadows.

For the light mode alternative, transition to a high-contrast grayscale palette using `#FFFFFF` for the background and `#F3F4F6` for surfaces, maintaining the same accent colors for consistency.

## Typography

This design system utilizes **Geist** for its systematic, utilitarian feel and high legibility in technical contexts. **JetBrains Mono** is introduced as a supporting label font for metadata, IDs, and code-related strings to reinforce the developer-centric aesthetic.

**Hierarchy Rules:**
- **Headlines:** Use semi-bold weights with slight negative letter-spacing to maintain a compact, "engineered" look.
- **Body Text:** Standardized at 14px for general use to balance density and readability.
- **Metadata:** Use JetBrains Mono for commit hashes, ticket IDs (e.g., `DEV-102`), and technical timestamps.
- **Mobile Scaling:** Headlines larger than 24px should scale down by 15% on mobile devices to prevent excessive wrapping in data-heavy views.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a focus on high-density information architecture. It uses a base 4px increment system to ensure precise alignment of technical data.

**Grid System:**
- **Desktop:** 12-column grid with 16px gutters.
- **Tablet:** 8-column grid with 16px gutters.
- **Mobile:** 4-column grid with 12px gutters.

**Spacing Philosophy:**
Internal padding within components (cards, list items) should be kept to a minimum (8px to 12px) to allow more data to be visible above the fold. Sidebars are collapsible to maximize the workspace for Kanban boards and analytics dashboards.

## Elevation & Depth

Depth is primarily communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than traditional shadows.

- **Level 0 (Base):** `#0B0C0E` - The canvas.
- **Level 1 (Surface):** `#16181D` - Cards, navigation bars, and side panels.
- **Level 2 (Overlay):** `#1C1F26` - Modals, dropdowns, and tooltips.

**Borders:** All interactive or container elements must have a 1px solid border using `#242830`.
**Shadows:** Shadows are used sparingly. When necessary (e.g., for floating modals), use a subtle, 0-blur black shadow with 40% opacity to provide lift without softening the "sharp" aesthetic.

## Shapes

The shape language is disciplined and professional. 

- **Standard Elements:** Buttons, input fields, and cards use a **4px (0.25rem)** corner radius.
- **Large Containers:** Modals and main workspace areas may use an **8px (0.5rem)** radius for a softer distinction from the background.
- **Interactive States:** Focus states should be indicated by a sharp 2px primary-colored border offset by a 1px gap.

Avoid pill-shaped buttons except for very specific, non-critical tags or status badges.

## Components

**Buttons:** 
- Primary: Electric blue background with white text. 4px radius. 
- Secondary: Ghost style with `#242830` border and no fill.
- AI Action: Emerald border with a subtle 2px inner glow.

**Cards:** 
- Minimalist containers with `#16181D` fill and `#242830` borders. 
- Headers within cards should use a 1px bottom border to separate titles from content.

**Badges & Labels:** 
- Small, uppercase text using JetBrains Mono. 
- High-contrast backgrounds (e.g., Amber for "High Priority") with reduced opacity (15%) and 100% opacity text.

**Input Fields:** 
- Deep charcoal background (`#0B0C0E`). 
- On focus, the border changes to Electric Blue with no glow/shadow.

**Sidebar:** 
- Fixed-width, collapsible. 
- Active items use a vertical 2px primary color indicator on the left edge.

**AI Insights:** 
- Denoted by a "sparkle" icon in the top right of a component. 
- Insight text uses a subtle Emerald (`#10B981`) text color or a very thin left-accent border.