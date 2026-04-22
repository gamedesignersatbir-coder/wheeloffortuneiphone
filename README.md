# Wheel of Fortune

A casino-style single-file Wheel of Fortune web app deployed on Netlify: https://wheeloffortuneiphone.netlify.app/

## Files

- `Wheel of Fortune - standalone (3).html` — original backup (iPhone-chassis mockup). **Do not edit** — rollback copy.
- `Wheel of Fortune - web.html` — the Netlify deployable. This is what gets modified.
- `_extracted/` — decompressed WheelApp source + scripts for round-tripping edits back into the HTML bundle.

## How the bundle works

The HTML file is an "AI bundler" shell: React, ReactDOM, Babel standalone, the app source, and Playfair Display fonts are all base64+gzip-packed into a JSON manifest in a single `<script type="__bundler/manifest">` tag. A bootstrap loader decodes them to Blob URLs and swaps the document.

The only file we ever need to edit is the WheelApp source, extracted at:
`_extracted/b4a94c77-b8f0-410d-9d7a-e6c904c389cd.js`

## Editing workflow

```bash
# 1. Edit _extracted/b4a94c77-b8f0-410d-9d7a-e6c904c389cd.js in your editor.

# 2. Rebundle — this recompresses the edited source back into a fresh copy
#    of web.html, and re-injects the template (removes the IOSDevice wrapper,
#    applies #root sizing CSS).
cp "Wheel of Fortune - standalone (3).html" "Wheel of Fortune - web.html"
node _extracted/_rebundle.js

# 3. Open web.html locally to sanity-check, then deploy to Netlify.
```

## Gotchas

- **`</script>` inside the template JSON must be escaped as `<\/script>`** before splicing into the HTML, otherwise the parser closes the bundler tag prematurely. The rebundle script handles this.
- Integrity hashes on inner script tags are stripped at unpack time, so re-gzipping doesn't need SHA-384 recomputation.
- `DecompressionStream` (used in the unpacker) requires iOS 16.4+. Older iPhones will fail to load; the outer shell shows a clear "update iOS" banner in that case.
- The sun-glow drop-shadow lives on a static "ghost layer" image inside `SunLogo`, not on the button — this is deliberate, to prevent the drop-shadow re-computing on every wink opacity tick (iPhone-visible strobe).
