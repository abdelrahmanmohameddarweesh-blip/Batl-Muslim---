---
name: ui-ux-pro-max
description: Professional UI/UX design framework and visual guidelines for building world-class, modern, high-converting, accessible, and stunning user interfaces across mobile and web apps.
---

# UI/UX Pro Max Skill Guide

## 🎨 Core Design Principles & Visual Philosophy
1. **First-Glance Impact (The WOW Factor)**:
   - Users form opinions in 50ms. Use harmonious color palettes, sleek dark modes, vibrant gradients, and elegant glassmorphism.
   - Avoid plain default colors (pure #000000 black, raw red/blue). Use curated HSL/Hex tokens like Emerald `#10B981`, Deep Pine `#044E3F`, Warm Amber `#F59E0B`, Crimson `#E11D48`, and Midnight Slate `#0F172A`.

2. **Strict Typography Hierarchy**:
   - Primary Arabic Font: `IBMPlexSansArabic-Bold`, `Medium`, `SemiBold`, `Regular`.
   - Never mix font families randomly. Keep 3 distinct scale sizes: Title (20-28px), Subtitle/Body (14-16px), Caption/Meta (11-12px).
   - Ensure proper line height (`1.4` to `1.6` for Arabic reading clarity).

3. **Touch Targets & Ergonomics**:
   - Minimum tap target size for all interactive buttons and icons: `44x44pt`.
   - Comfortable padding (minimum 12-16px padding inside cards, 20px screen margins).
   - Dynamic feedback on tap: Scale animations (`activeOpacity={0.8}` or Spring `Animated.Value(0.95)`).

4. **RTL (Right-to-Left) Native Alignment**:
   - Icon-only back buttons must point right (`➔` or `M5 12h14 M12 5l7 7-7 7`).
   - Text alignments: `textAlign: 'right'` for Arabic titles and body.
   - Flex direction: `flexDirection: 'row-reverse'` for labels with leading icons.

5. **Gamification & Micro-Interactions**:
   - Glow effects and subtle outer borders (`borderWidth: 1.5`, `borderColor: 'rgba(16, 185, 129, 0.3)'`).
   - Status pills and animated progress badges with distinct emojis (`🕯️`, `✨`, `👑`, `🏆`, `⚡`).
   - Smooth modals with semi-transparent backdrop (`rgba(0,0,0,0.75)`).

## 🛠️ Color Token System
- **Primary Accent**: `#10B981` (Emerald Green)
- **Primary Deep**: `#044E3F` / `#059669`
- **Gold/Reward**: `#F59E0B` (Warm Amber/Siraj Gold)
- **Error/Alert**: `#EF4444` / `#E11D48`
- **Background Dark**: `#0F172A` (Midnight Slate)
- **Surface Dark**: `#1E293B` (Slate Container)
- **Text Primary**: `#FFFFFF` / `#0F172A`
- **Text Muted**: `#94A3B8` / `#64748B`

## 📋 Quality Checklist for New UI Screens
- [ ] No clipping or wrapped single-letter lines.
- [ ] Tap targets minimum 44x44pt.
- [ ] Soft shadows (`shadowOpacity: 0.15`, `shadowRadius: 10`, `elevation: 4`).
- [ ] High contrast text readability against dark/light backgrounds.
- [ ] Clean RTL layout alignment.
