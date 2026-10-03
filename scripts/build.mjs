import {cp, mkdir, rm, readFile, writeFile} from 'node:fs/promises';

await rm('dist', {recursive:true, force:true});
await mkdir('dist/src', {recursive:true});

// Keep the deployed app as ordinary relative static files.
// Do NOT inline main.js: an escaped </script> inside a JavaScript raw-text
// element can prevent the browser from parsing/executing the page at all.
await cp('index.html', 'dist/index.html');
await cp('src/main.js', 'dist/src/main.js');
await cp('src/style.css', 'dist/src/style.css');

const html = await readFile('dist/index.html', 'utf8');
if (!html.includes('./src/main.js') || !html.includes('./src/style.css')) {
  throw new Error('Deployable index.html is missing relative game assets');
}
await writeFile('dist/index.html', html);
console.log('Static build complete: dist/index.html + dist/src/main.js + dist/src/style.css');
