/* マップで見えるNPCサムネイルメニューをイベント別NPCへ置き換える。 */
(()=>{
 const key='nekosagasi-layout-v1';
 let sharedNpcDataLoaded=false;
 const mount=()=>{
  const select=document.querySelector('#npcPicker'),visual=document.querySelector('.npc-picker-visual');
  if(!select||!visual||select.dataset.eventNpcPicker)return;
  let data;try{data=JSON.parse(localStorage.getItem(key)||'{}')}catch{return}
  const allowedTypes=new Set(['words','item','ultimate','survey','quiz']);
  const entries=Object.entries(data.npcDefinitions||{}).filter(([id,n])=>id.startsWith('event-')&&allowedTypes.has(n?.eventType||'words')&&n?.eventNpcName&&n?.profileId);
  if(!entries.length)return;
  window.__eventNpcProfiles=Object.fromEntries(entries.map(([id,n])=>[id,{profileId:n.profileId,name:n.eventNpcName}]));
  const menu=visual.querySelector('.npc-picker-menu'),toggle=visual.querySelector('.npc-picker-toggle');
  if(!menu||!toggle)return;
  select.replaceChildren(...entries.map(([id,n])=>new Option(n.eventNpcName,id)));
  const refresh=()=>{const entry=entries.find(([id])=>id===select.value)||entries[0],npc=entry[1];toggle.querySelector('img').src='npc-light/'+npc.profileId+'.png';toggle.querySelector('img').alt=npc.eventNpcName;toggle.querySelector('span').textContent=npc.eventNpcName};
  menu.replaceChildren(...entries.map(([id,n])=>{const button=document.createElement('button'),image=document.createElement('img'),name=document.createElement('span');button.type='button';button.className='npc-picker-option';image.src='npc-light/'+n.profileId+'.png';image.alt='';name.textContent=n.eventNpcName;button.append(image,name);button.onclick=()=>{select.value=id;select.dispatchEvent(new Event('change'));refresh();menu.hidden=true;toggle.setAttribute('aria-expanded','false')};return button}));
  toggle.onclick=()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden))};
  select.dataset.eventNpcPicker='1';select.addEventListener('change',()=>setTimeout(refresh,0));select.value=entries[0][0];select.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(refresh,0);
 };
 const repairMarkers=()=>{
  const profiles=window.__eventNpcProfiles||{};
  document.querySelectorAll('.layout-object.npc img').forEach(image=>{const marker=image.closest('.layout-object'),id=marker.dataset.eventNpc||(image.getAttribute('src')||'').match(/npc-light\/(event-[^.]+)\.png/)?.[1],definition=profiles[id];if(!definition)return;marker.dataset.eventNpc=id;image.src='npc-light/'+definition.profileId+'.png';image.alt=definition.name||'NPC';marker.title=definition.name||'NPC';let label=marker.querySelector('.layout-event-npc-name');if(!label){label=document.createElement('span');label.className='layout-event-npc-name';marker.append(label)}label.textContent=definition.name||'NPC'})
 };
 const loadSharedNpcData=async()=>{
  if(sharedNpcDataLoaded)return;
  sharedNpcDataLoaded=true;
  try{
   const response=await fetch('/api/layout',{cache:'no-store'});
   const payload=await response.json();
   if(!payload?.layout?.npcDefinitions)return;
   let local={};try{local=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
   local.npcDefinitions=payload.layout.npcDefinitions;
   localStorage.setItem(key,JSON.stringify(local));
   document.querySelector('#npcPicker')?.removeAttribute('data-event-npc-picker');
   mount();repairMarkers();
  }catch{}
 };
 setInterval(()=>{mount();repairMarkers()},300);document.addEventListener('DOMContentLoaded',()=>{mount();repairMarkers()});
 setTimeout(loadSharedNpcData,0);
})();

/* 現在のマップ素材一覧を、ゲームと配置ツールで同じ順番に表示する。 */
(()=>{
 const maps=['メインマップ1-1','メインマップ1-2','メインマップ1-3','メインマップ1-4','メインマップ1-5','メインマップ1-6','メインマップ1-7','メインマップ1-8','メインマップ1-9','おしゃれカフェ','ゲームセンター','コンビニ','スーパー','やくざの事務所','ラボ','温泉_男女4区画','家族の家','会社','学校','現代美術館','公衆トイレ','室内動物園','図書館','水耕栽培工場','駄菓子屋','和室のボロアパート'];
 const asset=index=>'/game-assets/maps/'+(index===0?'m1-game.webp':'map'+(index+1)+'-game.webp')+'?v=20260929-map-npc-refresh-1';
 const mount=()=>{
  const select=document.querySelector('#layoutMap'),visual=document.querySelector('.map-picker-visual');
  if(!select||!visual||select.dataset.currentMapCatalog)return;
  const menu=visual.querySelector('.map-picker-menu'),toggle=visual.querySelector('.map-picker-toggle');
  if(!menu||!toggle)return;
  const current=Math.max(0,Math.min(maps.length-1,Number(select.value)||0));
  select.replaceChildren(...maps.map((name,index)=>new Option(name,String(index))));
  const refresh=()=>{const index=Math.max(0,Math.min(maps.length-1,Number(select.value)||0));toggle.querySelector('img').src=asset(index);toggle.querySelector('img').alt=maps[index];toggle.querySelector('span').textContent=maps[index]};
  menu.replaceChildren(...maps.map((name,index)=>{const button=document.createElement('button'),image=document.createElement('img'),label=document.createElement('span');button.type='button';button.className='map-picker-option';button.dataset.value=String(index);image.src=asset(index);image.alt=name;label.textContent=name;button.append(image,label);button.onclick=()=>{select.value=String(index);select.dispatchEvent(new Event('change'));menu.hidden=true;toggle.setAttribute('aria-expanded','false')};return button}));
  select.value=String(current);select.dataset.currentMapCatalog='1';select.addEventListener('change',()=>setTimeout(refresh,0));refresh();
 };
 setInterval(mount,300);document.addEventListener('DOMContentLoaded',mount);
})();

/* 出入口の番号は背景色に負けないよう、配置マーカーへ直接描画する。 */
(()=>{
 const key='nekosagasi-layout-v1';
 const showGatewayNumbers=()=>{
  let layout;try{layout=JSON.parse(localStorage.getItem(key)||'{}')}catch{return}
  document.querySelectorAll('.layout-object.gateway').forEach(marker=>{
   const gateway=(layout.objects||[]).find(item=>item.id===marker.dataset.id&&item.kind==='gateway');
   if(gateway)marker.textContent=String(gateway.link||'');
   marker.style.setProperty('color','#000','important');
   marker.style.setProperty('font-size','22px','important');
   marker.style.setProperty('font-weight','1000','important');
   marker.style.setProperty('line-height','1','important');
   marker.style.setProperty('text-shadow','0 1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff','important');
   marker.style.setProperty('z-index','20','important');
  });
 };
 setInterval(showGatewayNumbers,200);document.addEventListener('DOMContentLoaded',showGatewayNumbers);
})();
