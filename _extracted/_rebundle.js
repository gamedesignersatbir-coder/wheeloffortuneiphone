// Rebundle: take edited WheelApp source, gzip+base64, swap into the manifest
// of the new HTML file. Also edit the template (remove IOSDevice wrapper,
// add #root CSS + haloPulse keyframe).
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const HTML_PATH = path.resolve(__dirname, '..', 'Wheel of Fortune - web (1-12).html');
const WHEEL_UUID = 'b4a94c77-b8f0-410d-9d7a-e6c904c389cd';
const WHEEL_SRC_PATH = path.resolve(__dirname, `${WHEEL_UUID}.js`);

const html = fs.readFileSync(HTML_PATH, 'utf8');

// ── 1. Update manifest entry for WheelApp ──────────────────────────────────
const mfMatch = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (!mfMatch) throw new Error('manifest script not found');
const manifest = JSON.parse(mfMatch[1]);
if (!manifest[WHEEL_UUID]) throw new Error(`UUID ${WHEEL_UUID} not in manifest`);

const srcText = fs.readFileSync(WHEEL_SRC_PATH);
const gz = zlib.gzipSync(srcText, { level: 9 });
const b64 = gz.toString('base64');

const entry = manifest[WHEEL_UUID];
entry.data = b64;
entry.compressed = true;
// mime stays application/javascript

const newManifestJson = JSON.stringify(manifest);

// ── 2. Update template JSON — remove IOSDevice wrapper, add CSS ────────────
const tplMatch = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
if (!tplMatch) throw new Error('template script not found');
let tpl = JSON.parse(tplMatch[1]); // template is a JSON-encoded HTML string

// a) Replace mount call: <IOSDevice dark={true}><WheelApp/></IOSDevice> → <WheelApp/>
const before = tpl.length;
tpl = tpl.replace(
  /<IOSDevice dark=\{true\}>\s*<WheelApp\/>\s*<\/IOSDevice>/,
  '<WheelApp/>'
);
if (tpl.length === before) throw new Error('mount call not found/replaced');

// b) Add #root sizing + haloPulse keyframe into the inline <style> block.
//    Insert right before the existing `.stage` rule.
const cssInjection = `
    /* --- web-mode additions --- */
    html, body { padding: 0 !important; }
    body { padding: 20px !important; }
    #root {
      width: min(420px, 100vw);
      height: min(900px, calc(100vh - 40px));
      max-height: 100vh;
      position: relative;
      overflow: hidden;
      border-radius: 20px;
      box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,212,71,0.08);
    }
    @media (max-width: 440px) {
      body { padding: 0 !important; }
      #root { width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; box-shadow: none; }
    }
    /* --- end web-mode additions --- */

    .stage`;

const before2 = tpl.length;
tpl = tpl.replace('\n    .stage', cssInjection);
if (tpl.length === before2) throw new Error('CSS insertion point (.stage rule) not found');

// Escape </script> as <\/script> so the HTML parser doesn't see a closing tag
// inside our bundler/template script. The original file does the same thing.
const escapeScriptClose = (s) => s.split('</script>').join('<\\/script>');
const newTemplateJson = escapeScriptClose(JSON.stringify(tpl));
const newManifestJsonEsc = escapeScriptClose(newManifestJson); // safe no-op usually

// ── 3. Splice updated manifest + template back into the HTML ───────────────
let out = html;
out = out.replace(mfMatch[0], `<script type="__bundler/manifest">${newManifestJsonEsc}</script>`);
out = out.replace(tplMatch[0], `<script type="__bundler/template">${newTemplateJson}</script>`);

fs.writeFileSync(HTML_PATH, out);

console.log(`OK. Wrote ${out.length.toLocaleString()} bytes to ${HTML_PATH}`);
console.log(`  WheelApp src: ${srcText.length.toLocaleString()} bytes raw → ${gz.length.toLocaleString()} bytes gzip → ${b64.length.toLocaleString()} chars base64`);
