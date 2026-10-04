const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({Date,Intl,getComputedStyle:()=>({visibility:'visible'})});
vm.runInContext(fs.readFileSync(require.resolve('../edge-extension/core.js'),'utf8'),context);
const core=context.VenueCore;
const preferences={venue:'体育馆',item:'羽毛球',date:'2026-10-12',time:'20:00',site:''};
const element=(textContent='',classes=[])=>({textContent,getClientRects:()=>[{}],classList:{contains:c=>classes.includes(c)}});
function fixture({loading=false,columns=3}={}){
 const cells=[element('', ['inner-seat','unselected-seat']),element('', ['inner-seat','selected-seat']),element('', ['inner-seat','disabled-seat'])];
 const row={...element('', ['clearfix']),tagName:'DIV',querySelectorAll:()=>cells};
 const wrapper={...element(),children:[row],querySelectorAll:()=>Array.from({length:columns},(_,i)=>element(`${i+1}号场地`))};
 const chart={querySelectorAll:selector=>selector==='.el-loading-mask'?(loading?[element()]:[]):selector==='.leftUl li'?[element('20:00'),element('21:00')]:[wrapper]};
 const date={...element(),id:'tab-2026-10-12'};
 return {cells,doc:{querySelector:selector=>selector==='#apointmentDetails h3'?element('体育馆'):chart,querySelectorAll:()=>[element('羽毛球'),date]}};
}
test('reading distinguishes available, user-selected and unavailable sites without clicking',()=>{
 const f=fixture();for(const cell of f.cells)cell.click=()=>assert.fail('reading must not select a site');
 const result=core.read(f.doc,preferences);
 assert.equal(result.count,1);assert.equal(result.targets.length,1);assert.equal(result.targets[0],f.cells[0]);
 assert.equal(result.slots[1].selected,true);assert.equal(result.slots[1].available,false);
 assert.equal(result.slots[2].available,false);assert.equal(result.end,'21:00');
});
test('a specific selected site reports zero available sites',()=>{
 const f=fixture(),result=core.read(f.doc,{...preferences,site:'2号场地'});
 assert.equal(result.count,0);assert.equal(result.slots.length,1);assert.equal(result.targets.length,0);
 assert.equal(result.slots[0].selected,true);
});
test('loading or mismatched columns prevent an availability report',()=>{
 assert.throws(()=>core.read(fixture({loading:true}).doc,preferences),/正在加载/);
 assert.throws(()=>core.read(fixture({columns:2}).doc,preferences),/列数不匹配/);
});
test('invalid dates and missing sites fail instead of returning an empty availability result',()=>{
 assert.throws(()=>core.validate({...preferences,date:'2026-02-30'}),/日期无效/);
 assert.throws(()=>core.read(fixture().doc,{...preferences,site:'不存在的场地'}),/未找到指定场地/);
});
