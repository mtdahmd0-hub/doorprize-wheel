# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Audience (wheel page):** guests at formal/gala events (gala dinner, seminar, product launch, awards night) watching a projected screen, often from far away in a dim ballroom. Indonesian-speaking.
- **Operator (admin page):** event committee (panitia) on a laptop next to the projector, setting participants and the winner queue between rounds, under time pressure.

## Product Purpose
A doorprize spin wheel: the committee loads names, presses spin, the room watches the wheel land on a winner. Success = a dramatic, legible reveal the whole room can read, and an admin the committee can operate without mistakes mid-event.

## Capabilities and Constraints
- Static site on GitHub Pages (mtdahmd0-hub/doorprize-wheel, folder `docs/`), vanilla HTML/CSS/JS, canvas wheel, no build step, no backend.
- State lives in the browser's localStorage; wheel and admin must be open in the same browser (live sync via `storage` event).
- Two modes: pure random, or committee-preset winner queue. When preset is active the wheel page always shows a disclosure banner (deliberate; do not remove).
- Optional removal of winners from the wheel after each win; winner history.
- Space bar spins.

## Brand Commitments
None. No logo, event name, or brand colors are required (user: "bebas").

## Evidence on Hand
No real participant names, logos or photos. Demo names are synthetic.

## Product Principles
1. The reveal is the product: the winning name must be readable from the back of the room.
2. Honest by construction: preset mode is always disclosed on screen.
3. The committee must never be confused mid-event: state visible, actions reversible, nothing destructive without confirm.

## Accessibility & Inclusion
Projected in dim rooms: high contrast, large type, respect prefers-reduced-motion.
