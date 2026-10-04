const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');const {boot}=require('./mock.cjs');const folder=path.resolve(__dirname,'../edge-extension');
test('unwatched tabs cannot overwrite target status',async()=>{const h=await boot(folder,{preferences:{watch:true,watchTabId:1},status:'target ready'});await h.message({type:'status',message:'wrong tab'},{tab:{id:2,url:'https://sports.sjtu.edu.cn/pc/'}});assert.equal(h.db.status,'target ready');await h.message({type:'status',message:'target update'},{tab:{id:1,url:'https://sports.sjtu.edu.cn/pc/'}});assert.equal(h.db.status,'target update');});

test('target read failure removes stale availability while retaining notification baseline',async()=>{
 const preferences={watch:true,watchTabId:1,venue:'A',item:'B',date:'2026-10-12',time:'16:00',site:'',sound:false,firstAvailable:true};
 const key='A|B|2026-10-12|16:00|';
 const h=await boot(folder,{preferences,lastResult:{count:2},baselines:{[key]:2}});
 const target={tab:{id:1,url:'https://sports.sjtu.edu.cn/pc/'}};
 await h.message({type:'status',message:'请先登录并进入场馆详情页'},target);
 assert.equal(h.db.lastResult,null);
 assert.equal(h.db.status,'请先登录并进入场馆详情页');
 assert.equal(h.db.baselines[key],2);
 await h.message({type:'availability',data:{venue:'A',item:'B',date:'2026-10-12',start:'16:00',site:'',count:2}},target);
 assert.equal(h.db.lastResult.count,2);
 assert.equal(h.notes.length,0);
});

test('another tab cannot discard the target result',async()=>{
 const h=await boot(folder,{preferences:{watch:true,watchTabId:1},lastResult:{count:2}});
 await h.message({type:'status',message:'other page failed'},{tab:{id:2,url:'https://sports.sjtu.edu.cn/pc/'}});
 assert.equal(h.db.lastResult.count,2);
});
