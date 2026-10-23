import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const allowed={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css','/questions.json':'questions.json'};
const mime={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json; charset=utf-8'};
const server=http.createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;const file=allowed[path];if(!['GET','HEAD'].includes(req.method)||!file){res.writeHead(404);res.end();return}try{const body=await readFile(root+file);res.writeHead(200,{'Content-Type':mime[file.split('.').pop()],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; img-src 'self' blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"});res.end(req.method==='HEAD'?undefined:body)}catch{res.writeHead(500);res.end('Tidak dapat memuat halaman.')}});
server.listen(4173,'0.0.0.0',()=>{console.log('Local: http://localhost:4173');for(const entries of Object.values(os.networkInterfaces()))for(const item of entries||[])if(item.family==='IPv4'&&!item.internal)console.log('Same Wi-Fi: http://'+item.address+':4173')});
