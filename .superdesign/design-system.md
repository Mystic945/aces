# Design System

## Product context

An automated peer-to-peer micro-lending matchmaker. An everyday investor sets
two things, a **risk appetite** (Low / Medium / High) and an **investment
amount**, and the product instantly ranks every open borrower listing from best
fit to lowest fit, recommends the **top five to fund**, splits the amount across
them, and shows the reason and the sums behind every pick. Amounts are in
Indian rupees.

- **Audience:** retail investors in India, not quants; and hackathon judges
  watching a live demo.
- **JTBD:** "When I have a small amount to lend, show me exactly which
  borrowers to fund, how much to put in each, what I can expect to earn and how
  risky it is, and let me check the working myself."
- **The product has no name on screen.** Identity is the logo mark only: an
  azure rounded tile with a white rising line ending in a lime dot. Never
  invent a product name, wordmark or tagline lockup. Copy says "we" or
  describes what the product does.
- **Honesty is part of the brand.** It runs on synthetic borrower data for
  demonstration. It recommends; it does not place loans or move money. Never
  claim regulation, user counts, money lent, awards, ratings or press.

## Pages

1. **Landing page** (new, comes first). Explains what the matchmaker does and
   sends the visitor into it with a "Start matching" button.
2. **Matchmaker** (built). One long page that follows the flow: set risk
   appetite, enter amount, fetch listings, evaluate each borrower four ways,
   calculate a suitability score, rank, select the top five, show the results.

### Landing page structure

Structure borrowed from lending sites (lendenclub.com first; also Mintos,
Prosper and Kiva): a hero with a product preview and a trust row, a plain
explainer, numbered steps, benefit blocks, a risk explanation, an FAQ, a
closing call-to-action band, and a footer that carries the risk notice.

- **Navigation:** logo mark left; section links; one primary button, "Start
  matching", right.
- **Hero:** headline and one paragraph on the left with two buttons ("Start
  matching", "See how it works") and a row of four factual proof points. On
  the right, a composed preview of the matchmaker built from real UI pieces,
  with two or three small floating stat cards overlapping it.
- **How it works:** the flow as numbered steps joined by a line.
- **The four checks:** the one dark navy band on the page.
- **What you get for each borrower:** the four facets and the worked sums.
- **Risk appetite explained:** Low, Medium, High side by side.
- **What it does not do:** a plain, honest list.
- **FAQ**, then a **closing band** with the same primary button, then the
  **footer**.

## Visual language

Light, friendly, trust-first fintech. The landing page and the matchmaker must
read as one product.

### Color tokens

| Token | Hex | Use |
|---|---|---|
| page | `#F9FAFD` | page background |
| surface | `#FFFFFF` | cards, inputs, tables |
| ink | `#1C1C1C` | headings, values |
| body | `#2E3133` | body text |
| muted | `#60676B` | labels, captions |
| line | `#E6EBED` | borders, dividers |
| fill | `#F1F3F5` | quiet panels, inactive chips |
| primary | `#0099E3` | large fills, bars, slider, logo tile |
| primary-strong | `#1678B5` | buttons with white text, small blue text |
| tint | `#E6F1F8` | soft blue panels |
| navy | `#0F172A` | the single dark band |
| sky | `#7DD3FC` | numerals and nodes on navy |
| lime | `#B1F349` | accents: "Best match" pill, live dot, grade A |
| gold | `#FFD166` | grade C |
| coral | `#FF8C69` | grade E, warnings |

Data marks: safety `#0099E3`, expected return `#E8960C`, neutral `#A8ADB1`.
No gradients as decoration, no purple, no glassmorphism.

### Typography

**Manrope** for everything. Headings and big numbers weight 800 with tight
tracking (about -0.02em); body 16 to 18px weight 400 to 500, line-height 1.6;
labels 13px weight 600 to 700 in sentence case. Hero headline about 60px on
desktop, 36px on phones, line-height 1.05. No uppercase labels, no eyebrow
labels above headings, no serif, no monospace except inside a formula.
A headline is one colour: do not highlight one word in a different colour.

### Shape, elevation, spacing

- Large panels and bands 28px radius; cards 20px; inner panels 16px; buttons,
  inputs and chips 12px; pills fully round.
- Cards: 1px `line` border and a soft shadow `0 4px 20px rgb(0 0 0 / 0.07)`.
  Do not put every block in a card; use plain sections with space between.
- Content column max 1200px; gutters 16px on phones, 32px on desktop.
- Section spacing 96 to 128px on desktop, 64px on phones.

### Components

- **Primary button:** `primary-strong` fill, white text weight 700, 12px
  radius, at least 48px tall. Label says what happens: "Start matching".
- **Secondary button:** white fill, 1px `line` border, ink text.
- **Step node:** 36px circle with a number; `primary-strong` with white text on
  light, `sky` with navy text on the navy band; nodes are joined by a 1px line.
- **Risk selector:** three equal buttons, Low / Medium / High, each with one
  line on its aim and the grades it sees; the active one is `primary-strong`.
- **Result card:** white card with a rank tile, the borrower's business name,
  a "Best match" lime pill on rank 1, a suitability score out of 100 with a
  two-colour bar (blue safety, amber return), and four facets: borrower
  details, estimated ROI, risk level, why this borrower matches.
- **Stat:** a big number with a short sentence under it; never a number alone.

### Motion

150 to 260ms, ease-out. One entrance moment in the hero at most. Cards slide
to their new place when a ranking changes. Reduced motion is respected.

## Responsive requirements

Works on any device from 320px. Hero stacks (text, then preview); step lists
and card rows become single columns; touch targets at least 44px; no sideways
page scroll.
