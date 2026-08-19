# Regenerating the social card

`app/opengraph-image.png` is a static file so GitHub Pages serves it with an
`image/png` content type — a generated `opengraph-image` route has no extension,
Pages falls back to `application/octet-stream`, and most crawlers then refuse it.

To change the card: copy `opengraph-image.source.tsx` back to
`app/opengraph-image.tsx`, run `npm run build`, copy `out/opengraph-image` over
`app/opengraph-image.png`, and move the source file back here.
