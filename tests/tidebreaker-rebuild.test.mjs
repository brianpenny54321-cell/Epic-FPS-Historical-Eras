import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const h=await readFile('index.html','utf8'),j=await readFile('src/main.js','utf8');
test('Tidebreaker rebuild is wired',()=>{assert.ok(h.includes('src/main.js?v=rebuild5'));assert.ok(h.includes('id="start"'));assert.ok(j.includes("getContext('webgl'"));assert.ok(j.includes('requestAnimationFrame'));assert.ok(j.includes('uniformMatrix4fv'));});
test('flight combat loop exists',()=>{for(const x of ['function fire','function missile','const E=','function update','function render'])assert.ok(j.includes(x),x);});
test('mobile input exists',()=>{assert.ok(h.includes('id="stick"'));assert.ok(j.includes('pointerdown'));});
