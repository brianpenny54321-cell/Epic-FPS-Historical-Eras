import http from 'node:http';import {readFile} from 'node:fs/promises';import {extname,join,normalize} from 'node:path';
const root=process.cwd();const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{let p=decodeURIComponent((req.url||'/').split('?')[0]);if(p==='/')p='/index.html';const file=normalize(join(root,p));if(!file.startsWith(root)){res.writeHead(403);return res.end()}try{const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}});
function up(){console.log('Dev server on http://127.0.0.1:8080')}
server.on('error',(err)=>{
  if(err && err.code==='EAFNOSUPPORT'){server.listen(8080,'0.0.0.0',up);return}
  console.error(err);process.exit(1);
});
server.listen({port:8080,host:'::',ipv6Only:false},up);
