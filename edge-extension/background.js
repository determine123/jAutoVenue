const url='https://sports.sjtu.edu.cn/pc/#/';let queue=Promise.resolve();let making;
const defaults={venue:'',item:'',date:'',time:'20:00',site:'',watch:false,sound:true,firstAvailable:true};
async function log(message){const {logs=[]}=await chrome.storage.local.get('logs');logs.unshift({time:Date.now(),message});await chrome.storage.local.set({logs:logs.slice(0,200)});}
async function audio(on){if(on&&!await chrome.offscreen.hasDocument()){making ||= chrome.offscreen.createDocument({url:'offscreen.html',reasons:['AUDIO_PLAYBACK'],justification:'Play availability alert until acknowledged'}).finally(()=>making=null);await making;}if(await chrome.offscreen.hasDocument())await chrome.runtime.sendMessage({type:on?'sound':'silence'});}
async function alert(data,test=false){const {preferences=defaults}=await chrome.storage.local.get('preferences');await chrome.storage.local.set({pending:true});try{await chrome.notifications.create('availability',{type:'basic',iconUrl:'icon.png',title:test?'体育场馆助手测试':`${data.venue} · ${data.item} 有空位`,message:test?'请确认通知与声音，点击已收到停止。':`${data.date} ${data.start}–${data.end}\n可选 ${data.count} 个场地，请在平台自行选择并下单。`,requireInteraction:true,buttons:[{title:'已收到'},{title:'打开平台'}]});}catch{await log('桌面通知发送失败');}if(preferences.sound)try{await audio(true);}catch{await log('声音播放失败');}}
async function ack(){await audio(false);await chrome.notifications.clear('availability');await chrome.storage.local.set({pending:false});}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(['sound','silence'].includes(m.type))return;
 queue=queue.then(async()=>{
  if(m.type==='save'){const {preferences:old=defaults}=await chrome.storage.local.get('preferences');const next={...defaults,...m.preferences};const context=p=>[p.venue,p.item,p.date,p.time,p.site||'',p.watchTabId].join('|');if(next.watch&&(!old.watch||context(old)!==context(next)))await chrome.storage.local.set({baselines:{},lastResult:null,status:'等待目标页面重新读取'});await chrome.storage.local.set({preferences:next});if(!m.preferences.watch||!m.preferences.sound)await ack();await log(m.preferences.watch?'页面空位提醒已启用':'页面空位提醒已关闭');}
  if(m.type==='availability'){
   if(!sender.tab?.url?.startsWith('https://sports.sjtu.edu.cn/pc/'))throw Error('来源错误');
   const {preferences=defaults,baselines={}}=await chrome.storage.local.get(['preferences','baselines']);if(!preferences.watch||sender.tab.id!==preferences.watchTabId)return {ok:true};
   const d=m.data;const key=[d.venue,d.item,d.date,d.start,d.site||''].join('|');if([preferences.venue,preferences.item,preferences.date,preferences.time,preferences.site||''].join('|')!==key)return {ok:true};
   const old=baselines[key];baselines[key]=d.count;await chrome.storage.local.set({baselines,lastResult:d,status:d.count?'页面显示有空位':'页面显示无空位'});
   if((old===undefined&&preferences.firstAvailable&&d.count>0)||(old===0&&d.count>0)){await log(`${key}：页面显示 ${d.count} 个可选场地`);await alert(d);}
  }
  if(m.type==='status'){if(!sender.tab?.url?.startsWith('https://sports.sjtu.edu.cn/pc/'))throw Error('来源错误');const {preferences=defaults}=await chrome.storage.local.get('preferences');if(preferences.watch&&sender.tab.id===preferences.watchTabId)await chrome.storage.local.set({status:m.message});}
  if(m.type==='result'){await chrome.storage.local.set({lastResult:m.data,status:'读取成功'});await log(`${m.data.venue} ${m.data.item} ${m.data.date} ${m.data.start}：${m.data.count} 个可选场地`);}
  if(m.type==='test')await alert(null,true);
  if(m.type==='ack')await ack();
  if(m.type==='open')await chrome.tabs.create({url});
  return {ok:true};
 }).then(reply).catch(async e=>{await log('操作失败：'+e.message);reply({ok:false,error:e.message});});return true;
});
chrome.notifications.onButtonClicked.addListener((id,i)=>{if(id!=='availability')return;queue=queue.then(async()=>{if(i===1)await chrome.tabs.create({url});await ack()}).catch(()=>{})});
chrome.notifications.onClosed.addListener((id,byUser)=>{if(id==='availability'&&byUser)queue=queue.then(ack).catch(()=>{})});

chrome.runtime.onStartup.addListener(async()=>{const {preferences}=await chrome.storage.local.get('preferences');if(preferences?.watch)await chrome.storage.local.set({preferences:{...preferences,watch:false},status:'浏览器重启，请在目标标签重新启用空位提醒'});});
