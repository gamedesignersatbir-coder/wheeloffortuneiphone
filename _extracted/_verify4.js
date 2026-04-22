const fs = require('fs');
const zlib = require('zlib');
const html = fs.readFileSync('D:/Work/ClaudeCode/wheeloffortune/Wheel of Fortune - web.html', 'utf8');
const m = JSON.parse(html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/)[1]);
const src = zlib.gunzipSync(Buffer.from(m['b4a94c77-b8f0-410d-9d7a-e6c904c389cd'].data, 'base64')).toString('utf8');
const tpl = JSON.parse(html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1]);

console.log('--- WheelApp JSX ---');
console.log('Uses overlay shine wrapper:', src.includes("position: 'relative', display: 'inline-block', padding: '2px 6px'"));
console.log('Shine div with plus-lighter:', src.includes("mixBlendMode: 'plus-lighter'"));
console.log('Solid-color title text restored:', src.includes("color: '#FFF3C4'") && src.includes("color: '#FFD447', fontStyle: 'italic'"));
console.log('No stale title-word className in JSX:', !src.includes('className="title-word"'));
console.log('No stale title-of className in JSX:', !src.includes('className="title-of"'));

console.log('\n--- Template CSS ---');
console.log('titleShine keyframe present:', tpl.includes('@keyframes titleShine'));
console.log('New transform-based keyframe:', tpl.includes('translateX(-120%)') && tpl.includes('translateX(120%)'));
console.log('Old .title-word rule removed:', !tpl.includes('.title-word'));
console.log('Old .title-of rule removed:', !tpl.includes('.title-of'));
console.log('No background-clip: text in template:', !tpl.includes('background-clip: text'));

console.log('\nfile size:', html.length);
