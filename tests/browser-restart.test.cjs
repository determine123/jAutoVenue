const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {boot}=require('./mock.cjs');const folder=path.resolve(__dirname,'../edge-extension');
for(const watch of [true,false])test(`restart invalidates old availability and alerts (watch=${watch})`,async()=>{
 const preferences={venue:'A',item:'羽毛球',date:'2026-11-20',time:'16:00',site:'1',watch,sound:false,watchTabId:3};
 const h=await boot(folder,{preferences,lastResult:{count:2},baselines:{old:2},pending:true,status:'页面显示有空位'});
 h.events.startup();await h.drain();
 assert.equal(h.db.lastResult,null);
 assert.equal(Object.keys(h.db.baselines).length,0);
 assert.equal(h.db.pending,false);
 assert.equal(h.db.preferences.watch,false);
 assert.equal(h.db.preferences.venue,preferences.venue);
 assert.equal(h.db.preferences.date,preferences.date);
 assert.match(h.db.status,/浏览器重启/);
 assert.equal(h.notes.length,0);
});
