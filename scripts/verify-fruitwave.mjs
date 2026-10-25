import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [headers, game, page] = await Promise.all([
  read('public/_headers'),
  read('public/games/fruitwave/game.js'),
  read('src/pages/games/fruitwave.astro'),
]);

assert.match(headers, /Permissions-Policy: camera=\(self\), microphone=\(\), geolocation=\(\)/);
assert.doesNotMatch(headers, /Permissions-Policy: camera=\(\)/);

assert.doesNotMatch(game, /cdn\.jsdelivr\.net|unpkg\.com|storage\.googleapis\.com/);
assert.match(game, /vendor\/vision_bundle\.mjs/);
assert.match(game, /vendor\/wasm/);
assert.match(game, /vendor\/models\/hand_landmarker\.task/);
assert.match(game, /if \(abandoned \|\| requestId !== cameraRequestSeq \|\| epoch !== camEpoch\) stopStream\(stream\)/);
assert.match(game, /candidateStreams\.clear\(\)/);
assert.match(game, /side,\n\s*}\);/);
assert.match(game, /combo !== lastHudCombo/);
assert.match(game, /octx\.moveTo\(A\.x \* vw/);

assert.match(page, /id="camera-stack" hidden/);
assert.match(page, /\.camera-stack/);

const assets = [
  ['public/games/fruitwave/vendor/vision_bundle.mjs', 100_000],
  ['public/games/fruitwave/vendor/wasm/vision_wasm_internal.wasm', 8_000_000],
  ['public/games/fruitwave/vendor/wasm/vision_wasm_nosimd_internal.wasm', 8_000_000],
  ['public/games/fruitwave/vendor/models/hand_landmarker.task', 7_000_000],
];

for (const [path, minimumBytes] of assets) {
  const info = await stat(new URL(path, root));
  assert.ok(info.size >= minimumBytes, `${path} is unexpectedly small (${info.size} bytes)`);
}

const model = await readFile(new URL('public/games/fruitwave/vendor/models/hand_landmarker.task', root));
const modelSha256 = createHash('sha256').update(model).digest('hex');
assert.equal(modelSha256, 'fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1');

console.log('FruitWave verification passed.');
