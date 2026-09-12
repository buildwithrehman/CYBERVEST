# CYBERVEST Design System (Imported from Stitch)

## Overview
This document represents the visual source of truth imported from the CYBERVEST Stitch project (ID: 2379895230365187565).

## Color Palette
### Core Financial & Risk (Primary)
- **Deep Forest Green (Primary Base):** `#0F3F2E`. Authoritative, institutional, secure. Used for primary actions, sidebar navigation, and critical brand moments.
- **Emerald/Teal (Accent):** `#14533D`. Vibrant contrast for data visualizations and active states.
- **Soft Mint (Surface):** `#E8F3EE`. For selected states, subtle highlights, and secondary action backgrounds.

### Neutrals (Typography & Structure)
- **Slate Dark (Primary Text):** `#111827`. High-contrast charcoal. For primary headings, financial figures, and core body text.
- **Slate Medium (Secondary Text):** `#4B5563`. Neutral Slate. For column headers, supporting descriptions, and metadata.
- **Text Muted:** `#9CA3AF`. Slate Muted. For placeholders, disabled conditions, and tertiary timestamps.

### Semantic Status
- **Financial Risk High / Threat:** `#B91C1C` / `#FEF2F2`. Crimson on tinted pink.
- **Financial Risk Moderate / Warning:** `#B45309` / `#FFFBEB`. Warm amber on golden haze.
- **Secured / Positive ROI:** `#15803D` / `#F0FDF4`. Emerald positive indicator.

## Typography
Typography is rendered exclusively through Inter.
- **Tabular Data:** Use `font-variant-numeric: tabular-nums` for financial valuations and metrics.

## Layout & Spacing
- **Base Grid:** Strict 8pt base grid system.
- **Desktop:** 12-column fluid grid, max `1600px`. Margin 48px, Gutter 24px.
- **Tablet:** 8-column layout. Margin 32px, Gutter 16px.
- **Mobile:** 4-column layout. Margin 16px, Gutter 12px.

## Elevation & Depth
1. **Base Ground (Level 0):** `#F9FAF8`.
2. **Elevated Cards (Level 1):** `#FFFFFF` with border `#E2E8E0`. Shadow: `0px 1px 3px rgba(15, 63, 46, 0.04), 0px 4px 12px rgba(15, 63, 46, 0.03)`.
3. **Dropdown Menus (Level 2):** Stronger shadow.
4. **Modals (Level 3):** `#0F3F2E` 35% opacity scrim with 8px blur.

## Components
- **Buttons:** Primary (`#0F3F2E`), Secondary (White with `#E2E8E0` border), Ghost. Radius 8px.
- **Inputs & Selectors:** Height 40px, 8px radius, border `#E2E8E0`.
- **Data Cards:** `#FFFFFF` background, 16px corner radius.
- **Chips & Badges:** Fully rounded pills (height 24px).
- **Checkboxes/Radio:** 16px size. Checked `#0F3F2E`.
- **Financial Telemetry:** Large 32px tabular readout paired with currency symbol.
