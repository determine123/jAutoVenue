let busy=false,lastSignature='',debounce;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=12000){const end=Date.now()+timeout;while(Date.now()<end){const result=fn();if(result)return result;await wait(200);}throw Error('页面加载超时，请检查登录或手动切换页面');}
const visible=VenueCore.visible;
function exact(selector,text){const all=[...document.querySelectorAll(selector)].filter(e=>visible(e)&&VenueCore.text(e)===text);if(all.length>1)throw Error('发现重名控件，请手动选择');return all[0];}
function modal(){return [...document.querySelectorAll('[role=dialog],.el-drawer,.el-dialog')].some(visible);}
async function prepare(p){
 p=VenueCore.validate(p);if(modal())throw Error('请先手动处理当前弹窗，再定位场次');
 const heading=document.querySelector('#apointmentDetails h3');
 if(!heading||VenueCore.text(heading)!==p.venue){const card=exact('h3',p.venue);if(!card)throw Error('当前页面没有该场馆，请在首页搜索或手动打开场馆');card.click();await until(()=>VenueCore.text(document.querySelector('#apointmentDetails h3'))===p.venue);}
 const project=await until(()=>exact('[role=tab]',p.item));
 if(project.getAttribute('aria-selected')!=='true'){project.click();await wait(800);}
 const date=await until(()=>{const e=document.getElementById('tab-'+p.date);return visible(e)?e:null});
 if(date.getAttribute('aria-selected')!=='true'){date.click();await wait(800);}
 await until(()=>!document.querySelector('.chart .el-loading-mask')||![...document.querySelectorAll('.chart .el-loading-mask')].some(visible));
 return snapshot(p,true);
}
function snapshot(p,highlight=false){const data=VenueCore.read(document,p);if(highlight){document.querySelectorAll('[data-sjtu-helper-highlight]').forEach(e=>{e.style.outline='';e.removeAttribute('data-sjtu-helper-highlight')});data.targets.forEach(e=>{e.setAttribute('data-sjtu-helper-highlight','true');e.style.outline='3px solid #ec9600';});if(data.targets[0])data.targets[0].scrollIntoView({block:'center'});}delete data.targets;return data;}
async function watch(){
 if(busy)return;
 const {preferences}=await chrome.storage.local.get('preferences');if(!preferences?.watch)return;
 try{const data=snapshot(preferences);const signature=JSON.stringify([data.venue,data.item,data.date,data.start,data.slots]);if(signature!==lastSignature){lastSignature=signature;await chrome.runtime.sendMessage({type:'availability',data});}}
 catch(e){const signature='error:'+e.message;if(signature!==lastSignature){lastSignature=signature;await chrome.runtime.sendMessage({type:'status',message:e.message});}}
}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(!['prepare','read','catalog','watchNow'].includes(m.type))return;
 (async()=>{if(busy)throw Error('已有操作进行中，请稍候');busy=true;try{
  if(m.type==='catalog')return {venues:[...document.querySelectorAll('h3')].filter(visible).map(VenueCore.text),items:[...document.querySelectorAll('[role=tab]')].filter(e=>visible(e)&&!/^tab-\d{4}/.test(e.id)).map(VenueCore.text),dates:[...document.querySelectorAll('[role=tab]')].filter(e=>visible(e)&&/^tab-\d{4}/.test(e.id)).map(e=>e.id.slice(4))};
  if(m.type==='watchNow'){lastSignature='';setTimeout(()=>watch().catch(()=>{}),0);return {};}
  return m.type==='prepare'?await prepare(m.preferences):snapshot(m.preferences,true);
 }finally{busy=false;}})().then(data=>reply({ok:true,data})).catch(e=>reply({ok:false,error:e.message}));return true;
});
new MutationObserver(()=>{clearTimeout(debounce);debounce=setTimeout(()=>watch().catch(()=>{}),1200)}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
setInterval(()=>watch().catch(()=>{}),30000);watch().catch(()=>{});
