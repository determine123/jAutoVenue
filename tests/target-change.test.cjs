const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {boot}=require('./mock.cjs');
const folder=path.join(__dirname,'../edge-extension');
const preferences={venue:'体育馆',item:'羽毛球',date:'2026-10-12',time:'20:00',site:'1号场地',watch:false,sound:false};
const result={venue:preferences.venue,count:1};

for(const field of ['venue','item','date','time','site'])test(`changing ${field} clears a manual result without enabling watching`,async()=>{
 const b=await boot(folder,{preferences,lastResult:result,baselines:{old:1}});
 const reply=await b.message({type:'save',preferences:{...preferences,[field]:field==='date'?'2026-10-13':field==='time'?'19:00':'其他'}});
 assert.equal(reply.ok,true);assert.equal(b.db.lastResult,null);
 assert.equal(Object.keys(b.db.baselines).length,0);assert.equal(b.db.preferences.watch,false);
 assert.match(b.db.status,/重新读取/);
});

test('changing only sound preserves the current target result and baseline',async()=>{
 const b=await boot(folder,{preferences,lastResult:result,baselines:{old:1}});
 await b.message({type:'save',preferences:{...preferences,sound:true}});
 assert.deepEqual(b.db.lastResult,result);assert.deepEqual(b.db.baselines,{old:1});
});
