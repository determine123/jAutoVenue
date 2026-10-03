(function(root){
 const text=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
 const visible=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
 function validate(p){if(!p.venue?.trim()||!p.item?.trim())throw Error('请填写场馆和项目名称');if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date||''))throw Error('请填写预约日期');const date=new Date(p.date+'T00:00:00+08:00');if(!Number.isFinite(date.getTime())||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)!==p.date)throw Error('日期无效');if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time||''))throw Error('请选择有效时间，格式 HH:MM');return {...p,venue:p.venue.trim(),item:p.item.trim(),site:(p.site||'').trim()};}
 function read(doc,p){
  p=validate(p);const heading=doc.querySelector('#apointmentDetails h3');
  if(!heading)throw Error('请先登录并进入场馆详情页');if(text(heading)!==p.venue)throw Error('当前场馆与偏好不一致：'+text(heading));
  const tabs=[...doc.querySelectorAll('[role=tab][aria-selected=true]')].filter(visible);
  const project=tabs.find(e=>!/^tab-\d{4}-\d{2}-\d{2}$/.test(e.id));const date=tabs.find(e=>/^tab-\d{4}-\d{2}-\d{2}$/.test(e.id));
  if(text(project)!==p.item)throw Error('请先切换到项目：'+p.item);if(date?.id!=='tab-'+p.date)throw Error('请先切换到日期：'+p.date);
  const chart=doc.querySelector('.chart');if(!chart)throw Error('未识别到场次表');
  if([...chart.querySelectorAll('.el-loading-mask')].some(visible))throw Error('场次正在加载，请稍后读取');
  const times=[...chart.querySelectorAll('.leftUl li')].map(text);const index=times.indexOf(p.time);if(index<0||index===times.length-1)throw Error('当前页面没有该开始时段');
  const slots=[];const targets=[];
  for(const wrapper of [...chart.querySelectorAll('.inner-seat-wrapper')].filter(visible)){
   const rows=[...wrapper.children].filter(e=>e.tagName==='DIV'&&e.classList.contains('clearfix'));
   const sites=[...wrapper.querySelectorAll('.topsiteStyle')].map(e=>e.title||text(e));
   if(rows.length!==times.length-1)throw Error('时间标签与场次行数不匹配，已停止识别');
   const cells=[...rows[index].querySelectorAll('.inner-seat')];if(cells.length!==sites.length)throw Error('场地列数不匹配，已停止识别');
   cells.forEach((cell,col)=>{if(p.site&&sites[col]!==p.site)return;const available=cell.classList.contains('unselected-seat');const selected=cell.classList.contains('selected-seat');slots.push({site:sites[col],available,selected});if(available)targets.push(cell);});
  }
  if(!slots.length)throw Error(p.site?'该页面未找到指定场地':'未识别场地列');
  return {venue:p.venue,item:p.item,date:p.date,start:p.time,site:p.site,end:times[index+1],slots,count:slots.filter(x=>x.available).length,targets,readAt:Date.now()};
 }
 root.VenueCore={read,validate,text,visible};
})(globalThis);
