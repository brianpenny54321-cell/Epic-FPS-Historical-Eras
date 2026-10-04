import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';

test('core web project exists',()=>{assert.ok(fs.existsSync('index.html'));assert.ok(fs.existsSync('src/main.js'));assert.ok(fs.existsSync('src/style.css'));});
test('flight build exposes 6DOF physics and combat systems',()=>{const s=fs.readFileSync('src/main.js','utf8');for(const x of ['pitch','roll','yaw','basis','A-10C THUNDERBOLT II','GULF THEATER','Kharg island','missiles','boost'])assert.match(s,new RegExp(x,'i'));});
test('static hosting entry uses relative assets',()=>{const html=fs.readFileSync('index.html','utf8');assert.match(html,/<link rel="stylesheet" href="\.\/src\/style\.css[^\"]*">/);assert.match(html,/<script src="\.\/src\/main\.js/);assert.doesNotMatch(html,/(?:src|href)="\/src\//);});
test('flight launch and animation loop are wired',()=>{const js=fs.readFileSync('src/main.js','utf8');assert.match(js,/document\.querySelector\('#fly'\)\.onclick=start/);assert.match(js,/running=true/);assert.match(js,/requestAnimationFrame\(loop\)/);});
test('mobile yaw control is actually touch-interactive',()=>{const js=fs.readFileSync('src/main.js','utf8');const css=fs.readFileSync('src/style.css','utf8');assert.match(js,/look\.onpointerdown/);assert.match(js,/look\.onpointermove/);assert.match(js,/look\.onpointerup=look\.onpointercancel/);assert.match(css,/\.mobile-look[^}]*pointer-events:auto/);});
test('main game script is syntactically valid JavaScript',()=>{const js=fs.readFileSync('src/main.js','utf8');assert.doesNotThrow(()=>new Function(js));});

test('Pages build keeps JavaScript as a real external asset',()=>{const s=fs.readFileSync('scripts/build.mjs','utf8');assert.match(s,/cp\(\s*'src\/main\.js'\s*,\s*'dist\/src\/main\.js'\s*\)/);assert.doesNotMatch(s,/html\.replace\(\/\\<script/);});
