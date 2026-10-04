const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const folder=path.resolve(__dirname,'../edge-extension');

test('manifest and popup reference assets included in the extension package',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
 const files=new Set([
  ...Object.values(manifest.icons||{}),
  manifest.background.service_worker,
  manifest.action.default_popup,
  ...(typeof manifest.action.default_icon==='string'?[manifest.action.default_icon]:Object.values(manifest.action.default_icon||{})),
  ...manifest.content_scripts.flatMap(script=>[...(script.js||[]),...(script.css||[])]),
  'offscreen.html','alert.wav',
 ]);
 for(const file of files){
  assert(fs.statSync(path.join(folder,file)).isFile(),`Missing extension asset: ${file}`);
  if(file.endsWith('.html')){
   const html=fs.readFileSync(path.join(folder,file),'utf8');
   for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    if(!/^(?:[a-z]+:|#|\/\/)/i.test(match[1]))assert(fs.statSync(path.resolve(folder,path.dirname(file),match[1])).isFile(),`Missing HTML asset: ${match[1]}`);
   }
  }
 }
 const icon=fs.readFileSync(path.join(folder,manifest.icons['128']));
 assert.equal(icon.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(icon.readUInt32BE(16),128);
 assert.equal(icon.readUInt32BE(20),128);
});
