const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function boot(failMode){
 let calls=0;
 const data={venue:'A',item:'B',date:'2026-10-12',start:'16:00',slots:[],targets:[],count:1};
 const context=vm.createContext({
  chrome:{storage:{local:{get:async()=>({preferences:{watch:true}})}},runtime:{onMessage:{addListener:()=>{}},sendMessage:async()=>{
   calls++;
   if(calls===1){if(failMode==='reject')throw Error('Worker temporarily unavailable');return {ok:false,error:'Temporary error'};}
   return {ok:true};
  }}},
  VenueCore:{read:()=>structuredClone(data),visible:()=>true},
  document:{documentElement:{}},MutationObserver:class{observe(){}},
  setInterval:()=>{},setTimeout:()=>{},clearTimeout:()=>{},Date,
 });
 const source=fs.readFileSync(path.join(__dirname,'../edge-extension/content.js'),'utf8');
 vm.runInContext(source.replace(/watch\(\)\.catch\(\(\)=>\{\}\);\s*$/,''),context);
 return {calls:()=>calls,watch:()=>vm.runInContext('watch()',context)};
}
for(const mode of ['reject','response'])test(`unchanged availability retries after ${mode} failure`,async()=>{
 const h=boot(mode);
 await h.watch().catch(()=>{});
 await h.watch();
 assert.equal(h.calls(),2);
 await h.watch();
 assert.equal(h.calls(),2,'successful delivery should remain deduplicated');
});
