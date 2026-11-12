# Design

World: **banknote security print** (seed 5aceaf5b). The doorprize is issued like a numbered bill.

## Tokens (both pages, `:root`)
- Ground: `--ink-0 #070b13`, raised `--ink-1 #0e1522`, `--ink-2 #172033`. Dark always: the use scene is a dim ballroom with a projector.
- Linework/accent: champagne `--gold #e8d6aa`, `--gold-2 #c9b27a`, `--gold-3 #8f7c4f`; hairline `--rule rgba(232,214,170,.18–.22)`.
- Text: `--paper #f6efdd`, secondary `--muted #b3a684` (tinted from gold, never grey).
- Seal red `--seal #d23a3f` / `--seal-ink #a3202a`: reserved for preset-mode disclosure, the winner seal and destructive actions.
- Wheel inks (Rupiah denominations): `#b3172f #1f4fa8 #21704b #6a3a9e #8b5426 #0f6e73 #4a5d68`, full strength, with white guilloche overlay.

## Type
- Display / names: Bodoni Moda (opsz 96, 600–900). Italic for the secondary line.
- UI / microtext: Archivo; labels in caps, tracking .14–.34em, `wdth` 80 for labels, 112 for the spin plate.
- Numerals: tabular; serials always `No. 001`.

## Components
- Wheel: canvas, pre-rendered once per name change; microprinted rim, gold pegs at boundaries, cream guilloche hub showing the next draw number. Pointer flicks on every peg.
- Spin plate: champagne fill, inset ink rule (`outline-offset:-7px`).
- Ledger: `No. 001 ····· Name` with dotted leader.
- Winner certificate: double-rule frame, drawn guilloche rosette, stamped name, red seal. Overshoot easing is deliberate here and on the pointer (snap-and-settle), nowhere else.
- Admin: same tokens, Operate mode: boxes 14px radius, radio cards, toggle, numbered queue validation with drawn SVG icons, lock screen.

## Motion
Wind-up then ease-out-quart spin (6.2s); reveal fade + blur, name stamp, seal stamp, rosette draw. `prefers-reduced-motion`: 1.4s spin, no flick, no stamp.
