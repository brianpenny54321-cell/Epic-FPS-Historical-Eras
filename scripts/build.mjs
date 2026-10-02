import {cp, mkdir, rm, readFile, writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
let html=await readFile('index.html','utf8');
const js=await readFile('src/main.js','utf8');
html=html.replace(/<script[^>]+src="\.\/src\/main\.js[^>]*><\/script>/, '<script>\n'+js+'\n<\/script>');
await writeFile('dist/index.html',html);
await cp('src/style.css','dist/src/style.css');
console.log('Static build complete: dist/index.html with inline game engine');
