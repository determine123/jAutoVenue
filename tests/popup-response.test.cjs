const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
async function fixture(failType,response){
 const elements={};const el=id=>elements[id] ||= {value:'value',checked:false,type:'text',textContent:'',disabled:false,replaceChildren(){},append(){}};
 const buttons=['save','apply','open','catalog','prepare','read','test','ack','export'].map(el);
 el('date').value='2026-10-12';const calls=[];
 const context=vm.createContext({Date,Intl,Set,URL,setTimeout,VenueCore:{validate:p=>p},
  document:{getElementById:el,querySelectorAll:()=>buttons,createElement:()=>({})},
  chrome:{storage:{local:{get:async()=>({})}},runtime:{sendMessage:async m=>{calls.push(m.type);return m.type===failType?response:{ok:true};}},
  tabs:{query:async()=>[{id:1,url:'https://sports.sjtu.edu.cn/pc/#/'}],sendMessage:async(id,m)=>{calls.push('page:'+m.type);return {ok:true,data:{}};}}}});
 vm.runInContext(fs.readFileSync(require.resolve('../edge-extension/popup.js'),'utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 return {elements,calls,buttons};
}
for(const type of ['prepare','read'])test(`${type} stops before touching the page when preferences cannot be saved`,async()=>{
 const h=await fixture('save',{ok:false,error:'保存失败'});await h.elements[type].onclick();
 assert.deepEqual(h.calls,['save']);assert.equal(h.elements.message.textContent,'保存失败');
 assert(h.buttons.every(b=>!b.disabled));
});
test('result persistence failure is shown instead of a successful read message',async()=>{
 const h=await fixture('result',{ok:false,error:'结果写入失败'});await h.elements.read.onclick();
 assert.deepEqual(h.calls,['save','page:read','result']);assert.equal(h.elements.message.textContent,'结果写入失败');
});
test('missing open acknowledgement does not claim the platform was opened',async()=>{
 const h=await fixture('open',undefined);await h.elements.open.onclick();
 assert.match(h.elements.message.textContent,/后台未确认/);assert(h.buttons.every(b=>!b.disabled));
});
