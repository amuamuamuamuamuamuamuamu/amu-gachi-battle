/* イベントを親にしたNPCカタログ。イベントごとに何人でも登録できる。 */
(()=>{
 const key='nekosagasi-layout-v1',types=[['words','言葉を作る','言葉おじさん'],['item','物を渡す','渡すおじさん'],['ultimate','究極の2択','究極おじさん'],['survey','多数派','多数派おじさん'],['quiz','クイズ','クイズおじさん']],assets=typeof GAME_DATA!=='undefined'?(GAME_DATA.assets||{}):{};
 const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
 const put=data=>{localStorage.setItem(key,JSON.stringify(data));fetch('/api/layout',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(data)}).catch(()=>{})};
 const label=type=>types.find(x=>x[0]===type)?.[1]||'言葉を作る';
 const migrate=data=>{data.eventNpcCatalogVersion=1;return false};
 let active='words';
 const catalog=()=>{
  const editor=document.querySelector('.npc-editor'),picker=document.querySelector('#npcEventPicker');if(!editor||!picker||editor.dataset.eventCatalog)return;
  const data=read();if(migrate(data))put(data);editor.dataset.eventCatalog='1';
  const bar=document.createElement('section');bar.className='event-npc-catalog';bar.innerHTML='<h2>イベントNPCを作る</h2><div class="event-npc-types"></div><label>登録済みNPC <select class="event-npc-picker"></select></label><button type="button" class="event-npc-add">このイベントのNPCを追加</button>';
  editor.querySelector('.layout-tools').after(bar);const tabs=bar.querySelector('.event-npc-types'),select=bar.querySelector('.event-npc-picker');
  const refresh=()=>{const fresh=read();migrate(fresh);const entries=Object.entries(fresh.npcDefinitions||{}).filter(([id,x])=>id.startsWith('event-')&&(x.eventType||'words')===active);tabs.replaceChildren(...types.map(([type,title])=>{const b=document.createElement('button');b.type='button';b.textContent=title;b.classList.toggle('active',type===active);b.onclick=()=>{active=type;refresh()};return b}));select.innerHTML='<option value="">'+label(active)+'を選ぶ</option>'+entries.map(([id,x])=>'<option value="'+id+'">'+(x.eventNpcName||label(active)+'おじさん')+'</option>').join('');picker.innerHTML=select.innerHTML;picker.value='';};
  const showItemFields=()=>{const chosen=picker.value,def=read().npcDefinitions?.[chosen];if(def?.eventType!=='item')return;const gift=document.querySelector('#npcEventWorkspace .npc-gift-setting');if(!gift)return;gift.hidden=false;gift.style.display='block';gift.querySelector('#npcRegistrations')?.removeAttribute('hidden')};
  select.onchange=()=>{if(!select.value)return;picker.value=select.value;picker.dispatchEvent(new Event('change'));setTimeout(showItemFields,80)};
  bar.querySelector('.event-npc-add').onclick=()=>{const fresh=read(),id='event-'+crypto.randomUUID(),profileCount=assets.npcs?.length||1,number=String((fresh.npcDefinitions&&Object.keys(fresh.npcDefinitions).length%profileCount)+1).padStart(2,'0');fresh.npcDefinitions??={};fresh.npcDefinitions[id]={profileId:'npc'+number,eventType:active,eventNpcName:types.find(x=>x[0]===active)[2],word1:[''],word2:[''],events:{},itemRegistrations:[{requiredItem:'',itemArt:'',receiveMessage:'受け取ったよ'}],ultimates:[],surveys:[],quizzes:[]};put(fresh);refresh();select.value=id;select.dispatchEvent(new Event('change'))};
  refresh();setInterval(showItemFields,300);
 };
 const mapPicker=()=>{
  const picker=document.querySelector('#npcPicker');if(!picker||picker.dataset.eventCatalog)return;picker.dataset.eventCatalog='1';const data=read();if(migrate(data))put(data);const entries=Object.entries(data.npcDefinitions||{}).filter(([id,x])=>id.startsWith('event-')&&types.some(([type])=>type===(x.eventType||'words')));picker.innerHTML=entries.map(([id,x])=>'<option value="'+id+'">'+label(x.eventType)+'：'+(x.eventNpcName||'NPC')+'</option>').join('');
  const place=document.querySelector('[data-kind="npc"]');place?.addEventListener('click',event=>{if(!picker.value)return;event.preventDefault();event.stopImmediatePropagation();const fresh=read();fresh.objects??=[];fresh.objects.push({id:crypto.randomUUID(),kind:'npc',npc:picker.value,map:Number(document.querySelector('#layoutMap')?.value||0),x:50,y:50});put(fresh);location.reload()},{capture:true});
  document.querySelectorAll('.layout-object.npc').forEach(marker=>{const placed=(read().objects||[]).find(x=>x.id===marker.dataset.id),def=placed&&read().npcDefinitions?.[placed.npc],img=marker.querySelector('img');if(def?.profileId&&img)img.src='npc-light/'+def.profileId+'.png'});
 };
 new MutationObserver(()=>{catalog();mapPicker()}).observe(document.documentElement,{childList:true,subtree:true});setInterval(()=>{catalog();mapPicker()},600);
})();
