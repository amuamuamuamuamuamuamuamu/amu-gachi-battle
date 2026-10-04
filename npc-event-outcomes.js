/* NPCイベントの結果設定。エディタとゲームで同じレイアウトデータを使う。 */
(()=>{
  const layoutKey='nekosagasi-layout-v1';
  const itemFiles=['あめ.png','いぬ.png','うし.png','うま.png','えんぴつ.png','かさ.png','かに.png','かめ.png','くるま.png','さる.png','しんかんせん.png','すいか.png','すずめ.png','たまご.png','つき.png','ねこ.png','はな.png','ひこうき.png'];
  let activeNpc='';
  /* エディタ本体が古いメモリ上のレイアウトを保存しても、追加した結果設定は残す。 */
  const originalSetItem=localStorage.setItem.bind(localStorage);
  // Do not restore outcomes from the previous local snapshot here.  The current
  // event editor serializes every outcome itself, so doing so discards a newly
  // selected NPC/building visibility setting immediately before it is saved.
  localStorage.setItem=(key,value)=>originalSetItem(key,value);
  const read=()=>{try{return JSON.parse(localStorage.getItem(layoutKey)||'{}')}catch{return {}}};
  const save=data=>{
    localStorage.setItem(layoutKey,JSON.stringify(data));
    fetch('/api/layout',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(data)}).catch(()=>{});
  };
  const npcOptions=data=>Object.keys(data.npcDefinitions||{}).map(id=>'<option value="'+id+'">'+(data.npcDefinitions[id]?.name||id)+'</option>').join('');
  const buildingOptions=data=>[...(data.buildings||[]),...(data.placedObjects||[]).filter(x=>x.kind==='building')].filter((x,i,a)=>x?.id&&a.findIndex(y=>y.id===x.id)===i).map(x=>'<option value="'+x.id+'">'+(x.name||x.graphic||x.id)+'</option>').join('');
  const outcome=()=>({item:'',building:'',buildingMode:'show',npc:'',npcMode:'show'});
  const normalise=value=>Object.assign(outcome(),value||{});
  const outcomeEditor=(title,value,onchange,data)=>{
    const v=normalise(value),box=document.createElement('fieldset');
    box.className='npc-outcome-settings';
    box.innerHTML='<legend>'+title+'</legend><label>取得するアイテム <select data-k="item"><option value="">なし</option>'+itemFiles.map(n=>'<option value="'+n+'">'+n.replace('.png','')+'</option>').join('')+'</select></label><label>建築物 <select data-k="building"><option value="">変更しない</option>'+buildingOptions(data)+'</select><select data-k="buildingMode"><option value="show">表示</option><option value="hide">非表示</option></select></label><label>NPC <select data-k="npc"><option value="">変更しない</option>'+npcOptions(data)+'</select><select data-k="npcMode"><option value="show">表示</option><option value="hide">非表示</option></select></label>';
    box.querySelectorAll('select').forEach(select=>{select.value=v[select.dataset.k]||'';select.onchange=()=>{v[select.dataset.k]=select.value;onchange(v)}});
    return box;
  };
  const selectedId=()=>document.querySelector('#npcEventPicker')?.value||'';
  const editorMount=()=>{
    const workspace=document.querySelector('#npcEventWorkspace');
    const id=selectedId(); if(!workspace||!id)return;
    const data=read(),def=data.npcDefinitions?.[id]; if(!def)return;
    const update=(fn)=>{fn();save(data)};
    /* 物を渡す: 各「受け取る物」ごと */
    workspace.querySelectorAll('#npcRegistrations .npc-registration').forEach((card,i)=>{
      if(card.querySelector('.npc-outcome-settings'))return;
      const entry=def.itemRegistrations?.[i];if(!entry)return;
      card.append(outcomeEditor('受け取った後に起こす処理',entry.outcome,v=>update(()=>entry.outcome=v),data));
    });
    /* 究極の二択: A/B のどちらにも */
    workspace.querySelectorAll('.ultimate-editor-panel .npc-registration').forEach((card,i)=>{
      if(card.querySelector('.npc-outcome-pair'))return;
      const entry=def.ultimates?.[i];if(!entry)return;
      entry.outcomes??=[outcome(),outcome()];
      const pair=document.createElement('div');pair.className='npc-outcome-pair';
      pair.append(outcomeEditor('Aを選んだ後に起こす処理',entry.outcomes[0],v=>update(()=>entry.outcomes[0]=v),data));
      pair.append(outcomeEditor('Bを選んだ後に起こす処理',entry.outcomes[1],v=>update(()=>entry.outcomes[1]=v),data));
      card.append(pair);
    });
    /* 多数派: 多数派になった場合だけ */
    workspace.querySelectorAll('.npc-quiz-list:has(.survey-add) .npc-registration:not(.survey-add-form)').forEach((card,i)=>{
      if(card.querySelector('.npc-outcome-settings'))return;
      const entry=def.surveys?.[i];if(!entry)return;
      card.append(outcomeEditor('多数派だった時に起こす処理',entry.majorityOutcome,v=>update(()=>entry.majorityOutcome=v),data));
    });
    /* クイズ: 正解した場合だけ */
    workspace.querySelectorAll('.npc-quiz-card').forEach((card,i)=>{
      if(card.querySelector('.npc-outcome-settings'))return;
      const entry=def.quizzes?.[i];if(!entry)return;
      card.append(outcomeEditor('正解した時に起こす処理',entry.correctOutcome,v=>update(()=>entry.correctOutcome=v),data));
    });
  };
  new MutationObserver(editorMount).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(editorMount,700);
  document.addEventListener('click',event=>{if(!event.target.closest?.('#npcSave'))return;setTimeout(()=>{const data=read();fetch('/api/layout',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(data)}).catch(()=>{})},40)},true);

  const findDefinition=()=>read().npcDefinitions?.[activeNpc];
  const emit=value=>{
    const out=normalise(value);if(!out.item&&!out.building&&!out.npc)return;
    window.dispatchEvent(new CustomEvent('npc-configured-outcome',{detail:out}));
  };
  document.addEventListener('click',event=>{
    const image=event.target.closest?.('.character-npc');
    if(image){const byName=Object.entries(read().npcDefinitions||{}).find(([id,def])=>id.startsWith('event-')&&(def.eventNpcName||def.name)===image.alt);const hit=(image.src.match(/npc(\d+)\.png/)||[])[1];activeNpc=byName?.[0]||(hit?'npc'+hit:'');}
  },true);
  window.addEventListener('npc-ultimate-result-complete',event=>{
    const {npc,question,choice}=event.detail||{};
    const def=read().npcDefinitions?.[npc]||findDefinition();
    const entry=(def?.ultimates||[]).find(x=>(x.question||x.initialMessage||'')===question);
    if(entry)emit(entry.outcomes?.[choice]);
  });
  new MutationObserver(()=>{
    document.querySelectorAll('.npc-survey .survey-result:not([data-outcome-done])').forEach(node=>{
      node.dataset.outcomeDone='1';if(!node.textContent.includes('多数派'))return;
      const def=findDefinition(),question=node.closest('.npc-survey')?.querySelector('.npc-made-phrase')?.textContent;
      const entry=(def?.surveys||[]).find(x=>x.question===question);if(entry)emit(entry.majorityOutcome);
    });
  }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();
