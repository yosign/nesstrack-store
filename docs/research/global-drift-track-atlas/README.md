# Global Drift Competition Course Atlas

This atlas contains a worldwide research register plus 50 original editorial
top-view redraws of competition-specific drift-course variants. It is intended
for track discovery, cataloguing and design reference—not event operations,
safety planning, manufacturing or survey work.

## Deliverables

- `candidate-register.csv`: 81 event/year/venue candidates.
- `manifest.json` and `manifest.csv`: the untouched 50-row research selection.
- `production-manifest.json`: the 50 rendered records with normalized quotas,
  source objects, route geometry, confidence and output status.
- `source-register.csv`: 169 claim-level source records.
- `tracks/`: 65 selected and backup research notes.
- `qa/`: render hashes, technical validation and review registers.
- `public/images/global-drift-track-atlas/svg/`: exactly 50 editable 1600×1200 SVGs.
- `public/images/global-drift-track-atlas/png/`: exactly 50 transparent 1600×1200 PNGs.
- `public/images/global-drift-track-atlas/contact-sheet.{svg,png}`: 5×10 visual index.

## Evidence and confidence

All selected entries meet the desk-research route-source threshold: one S/A
course source or two independent A/B course sources, plus separate venue
context. Six 2026 Drift Masters layouts and three 2026 Formula Drift layouts
have the strongest official route-map evidence. Other records are editorial
first-pass reconstructions from cited competition footage and venue context.

`geometry_confidence` is deliberately explicit:

- `highest` (9): official event-specific course map/briefing available.
- `high` (12): strong official or repeated route evidence.
- `medium` (29): route sequence is suitable for an editorial overview, but
  exact coordinates, radii, widths and clip-zone placement require primary-source
  revalidation before precision use.

No official artwork, logos, screenshots or source frames are redistributed.
The diagrams encode an original normalized centerline and annotations.

## Rebuild and verify

```bash
npm run drift-atlas:build
npm run drift-atlas:render
npm run drift-atlas:contact-sheet
npm run drift-atlas:validate
```

The validator checks exact file counts, 1600×1200 dimensions, required SVG
groups, embedded-content restrictions, SHA-256 hashes, route-source fields,
regional/tier quotas and diversity caps.

## Research caveats

The research manifest intentionally remains `source-threshold-met` rather than
claiming independent survey-grade geometry approval. Bangkok 2012's precise
temporary parcel, stable OSM object IDs, and representative timecodes for some
older video sources remain useful follow-up work. These limitations do not
affect the technical completeness of the 50-file editorial atlas, but they do
limit precision use.
