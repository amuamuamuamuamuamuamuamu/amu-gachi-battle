(()=>{
  const load=()=>{try{return JSON.parse(localStorage.getItem('nekosagasi-layout-v1')||'{}')}catch{return{}}};
  const persist=layout=>localStorage.setItem('nekosagasi-layout-v1',JSON.stringify(layout));
  const save=async layout=>{persist(layout);return fetch('/api/layout',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)})};
  const mount=()=>document.querySelectorAll('.npc-editor').forEach(editor=>{
    const workspace=editor.querySelector('#npcEventWorkspace'),tabs=workspace?.querySelector('.npc-event-tabs'),picker=editor.querySelector('#npcEventPicker');
    if(!workspace||!tabs||!picker||tabs.querySelector('[data-mode="wordmaker"]'))return;
    const specialId='event-wordmaker-npc',ensureSpecial=()=>{if(!picker.querySelector('option[value="'+specialId+'"]'))picker.add(new Option('なんでも言葉を作るNPC',specialId));const layout=load();layout.npcDefinitions??={};layout.npcDefinitions[specialId]={...layout.npcDefinitions[specialId],eventType:'words',wordMaker:true,eventNpcName:'なんでも言葉を作るNPC',profileId:'npc24',firstMessage:''};persist(layout)};ensureSpecial();
    const tab=document.createElement('button'),panel=document.createElement('section');
    tab.type='button';tab.dataset.mode='wordmaker';tab.textContent='なんでも言葉を作る';panel.className='npc-wordmaker-panel';panel.hidden=true;tabs.append(tab);tabs.after(panel);
    const show=()=>{
      const id=picker.value;if(!id)return;
      const layout=load();layout.npcDefinitions??={};const data=layout.npcDefinitions[id]??={};
      data.eventType='words';data.wordMaker=true;data.eventNpcName||='なんでも言葉を作るNPC';data.profileId||=id;
      panel.innerHTML='<article class="npc-registration"><h3>なんでも言葉を作るNPC</h3><p>ゲームでは、プレイヤーが持っている言葉を左右のプルダウンから自由に組み合わせられます。作成時には組み合わせに応じた一枚絵が表示されます。</p><label>NPCの名前<input data-field="eventNpcName"></label><label>説明文<textarea data-field="wordMakerDescription" rows="2"></textarea></label><button type="button">この設定を保存</button></article>';
      panel.querySelector('[data-field="eventNpcName"]').value=data.eventNpcName;
      panel.querySelector('[data-field="wordMakerDescription"]').value=data.wordMakerDescription||'持っている言葉を2つ選んで、新しい言葉を作ろう。';
      panel.querySelectorAll('[data-field]').forEach(input=>input.oninput=()=>{data[input.dataset.field]=input.value;persist(layout)});
      panel.querySelector('button').onclick=async()=>{data.wordMaker=true;data.eventType='words';await save(layout);const button=panel.querySelector('button');button.textContent='保存しました';setTimeout(()=>button.textContent='この設定を保存',1200)};
      workspace.querySelectorAll('.npc-word-fields,.npc-event-list,.npc-gift-setting,.ultimate-editor-panel,.npc-quiz-panel,.npc-survey-panel,.npc-normal-talk-panel,.npc-card-battle-panel,.npc-warashibe-panel').forEach(node=>{node.hidden=true;node.style.display='none'});
      tabs.querySelectorAll('button').forEach(button=>button.classList.toggle('active',button===tab));panel.hidden=false;panel.style.display='block';persist(layout);
    };
    tab.onclick=show;
    tabs.addEventListener('click',event=>{if(event.target!==tab){panel.hidden=true;panel.style.display='none'}});
    picker.addEventListener('change',()=>{if(picker.value===specialId){ensureSpecial();setTimeout(show,0)}});
    const current=load().npcDefinitions?.[picker.value];if(current?.wordMaker)show();
  });
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});
  mount();
})();
