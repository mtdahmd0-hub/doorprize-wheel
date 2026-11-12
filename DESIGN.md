# Design

World: **Customer Gathering stage**, pinned by the event backdrop (PLN UIK Tanjung Jati B, "Beyond Energy Beyond Collaboration"). Earlier banknote and gong directions were replaced by this brief.

## Tokens
- Wheel page (`docs/index.html`): sky gradient `#1a63c7 → #3d95e6 → #8fd0f5` with soft white cloud light; panel `rgba(7,38,96,.84)`; navy `#08245a`; volt yellow `#ffc928` / `#f5a623`; orange `#f28c28`; cyan `#7fdcff`; alert red `#c62828` (preset disclosure only).
- Wheel segment palette: `#0d47a1` `#ffc928` `#1e88e5` `#f28c28` `#00838f` `#6cc8f2`; navy text on the light tones, white on the dark.
- Admin (`docs/admin.html`): deep event blue `#061d47 / #0a2a62 / #10387d`, volt-yellow accents, white text, muted `#a9c8ef`.

## Type
- Anton (uppercase) for headlines, the draw number and the winner name.
- Montserrat 500–800 for text, labels (caps, tracked) and names on the wheel; italic 700 for the tagline (blue word / yellow word).

## Signature elements
- Horizon strip: flat skyline silhouettes (plant, turbines, city, transmission towers) over the blue-to-gold sweep with a white highlight line.
- Wheel: stage ring rim with 28 chasing bulbs (idle slow chase, faster while spinning), flowing white energy lines across segments, white separators, navy hub with yellow ring carrying the next draw number, yellow pin that flicks on every segment.
- Winner reveal: deep-blue radial field, four pulse rings (yellow, cyan, orange, white), yellow number badge, Anton name, tagline, sweep at the bottom; the stage gives a short surge shake.

## Motion
Wind-up then ease-out-quart spin (6.2s). Overshoot easing only on the pin flick and the reveal pop. `prefers-reduced-motion`: 1.4s spin, no flick, no chase, no pulse.
