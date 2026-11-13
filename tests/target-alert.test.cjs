const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {boot}=require('./mock.cjs');const folder=path.join(__dirname,'../edge-extension');
const preferences={venue:'体育馆',item:'羽毛球',date:'2026-11-14',time:'20:00',site:'1号场',watchTabId:7,watch:true,sound:true};
for(const field of ['venue','item','date','time','site','watchTabId'])test(`changing active target ${field} stops the old alert`,async()=>{
 const h=await boot(folder,{preferences,pending:true,lastResult:{count:1},baselines:{old:1}});
 h.run("globalThis.actions=[];chrome.offscreen.hasDocument=async()=>true;chrome.runtime.sendMessage=async m=>{actions.push(m.type);return {ok:true}};chrome.notifications.clear=async id=>actions.push(id)");
 const reply=await h.message({type:'save',preferences:{...preferences,[field]:field==='watchTabId'?8:'changed'}});
 assert.equal(reply.ok,true);assert.equal(h.db.pending,false);assert(h.run("actions.includes('silence')"));assert(h.run("actions.includes('availability')"));
 assert.equal(h.db.lastResult,null);assert.equal(h.db.preferences.watch,true);
});
test('saving the same active target preserves an unacknowledged alert',async()=>{
 const h=await boot(folder,{preferences,pending:true});const reply=await h.message({type:'save',preferences});assert.equal(reply.ok,true);assert.equal(h.db.pending,true);
});
