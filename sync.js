(()=>{
 if(!window.__surveyFlowInstalled){
  window.__surveyFlowInstalled=true;
  const dispatch=window.dispatchEvent.bind(window);
  window.dispatchEvent=event=>{
   if(event?.type!=='npc-configured-outcome'||!document.querySelector('.npc-survey .survey-result'))return dispatch(event);
   const unlockAt=Date.now()+2000;
   const lock=pointer=>{
    if(Date.now()>=unlockAt){document.removeEventListener('pointerdown',lock,true);return}
    pointer.preventDefault();
    pointer.stopImmediatePropagation();
   };
   const release=pointer=>{
    if(Date.now()<unlockAt||pointer.target.closest('.npc-survey'))return;
    document.removeEventListener('pointerdown',release,true);
    dispatch(event);
   };
   document.addEventListener('pointerdown',lock,true);
   document.addEventListener('pointerdown',release,true);
   return true;
  };
  document.addEventListener('pointerdown',event=>{
   const box=document.querySelector('.npc-survey');
   if(!box||box.dataset.answered==='1'||box.contains(event.target))return;
   box.remove();
  },true);
 }
  localStorage.setItem('amu-runner-talk-orbs-v1','9007199254740991');
  const raw=localStorage.setItem.bind(localStorage);
  localStorage.setItem=(key,value)=>{raw(key,value);if(!key.startsWith('amu-gachi-clean-'))return;try{const state=JSON.parse(value),room=key.split('-').pop();for(const monster of state.monsters||[])fetch('/api/monsters',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:`${room}-${monster.id}`,room,trainer:state.user,name:monster.name,imageData:monster.core||'',stats:monster.st,history:state.hist||[]})}).catch(()=>{})}catch{}};
  const script=document.createElement('script');script.src='/npc-event-outcomes.js?v=20260928-ultimate-result-1';document.head.append(script);const normalize=document.createElement('script');normalize.src='/event-npc-legacy-normalize.js?v=20260927-normalize-3';normalize.onload=()=>{const editor=document.createElement('script');editor.src='/event-npc-editor.js?v=20261003-warashibe-2';document.head.append(editor);const actions=document.createElement('script');actions.src='/npc-edit-actions.js?v=20260927-actions-3';document.head.append(actions);const editLink=document.createElement('script');editLink.src='/npc-edit-link.js?v=20260927-link-1';document.head.append(editLink);const pickers=document.createElement('script');pickers.src='/event-npc-image-pickers.js?v=20260930-card-picker-1';document.head.append(pickers);const outcomes=document.createElement('script');outcomes.src='/event-outcome-layout.js?v=20260930-card-picker-1';document.head.append(outcomes);const mapNpcs=document.createElement('script');mapNpcs.src='/map-event-npc-picker.js?v=20261002-scenario-normal-npcs-1';document.head.append(mapNpcs)};document.head.append(normalize);
  // NPCイベントは見た目を選ばないまま保存すると、種類名だけの空NPCになってしまう。
  // 保存前に止め、既存の登録内容は触らない。
  document.addEventListener('click',event=>{
    const save=event.target.closest?.('.event-npc-editor-v2 .event-save');
    if(!save)return;
    const form=save.closest('.event-npc-form'),profile=form?.querySelector('select[name="profileId"]');
    if(profile?.value)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    alert('NPCを選択してください');
  },true);
  // 大量のクイズを編集する場合は、表示中の12問だけを更新して残りを保持する。
  document.addEventListener('click',async event=>{
    const save=event.target.closest?.('.event-npc-editor-v2 .event-save');
    if(!save)return;
    const root=save.closest('.event-npc-editor-v2');
    if(root?.querySelector('.event-type-tabs .active')?.dataset.type!=='quiz')return;
    const id=new URLSearchParams(location.search).get('eventEdit');
    const form=save.closest('.event-npc-form');
    let data;try{data=JSON.parse(localStorage.getItem('nekosagasi-layout-v1')||'{}')}catch{return}
    const definition=data.npcDefinitions?.[id];
    if(!definition)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    definition.profileId=form.querySelector('[name="profileId"]')?.value||definition.profileId;
    definition.eventNpcName=(form.querySelector('[name="eventNpcName"]')?.value||definition.eventNpcName);
    definition.firstMessage=form.querySelector('[name="firstMessage"]')?.value||'';
    definition.quizzes??=[];
    form.querySelectorAll('[data-quiz]').forEach(card=>{
      const index=Number(card.dataset.quiz),choices=[...card.querySelectorAll('[data-a]')].map(input=>input.value);
      definition.quizzes[index]={...definition.quizzes[index],question:card.querySelector('[data-f="question"]')?.value||'',choices,answer:Number(card.querySelector('[data-f="answer"]')?.value||0),correctOutcome:Object.fromEntries([...card.querySelectorAll('.event-outcome [data-o]')].map(input=>[input.dataset.o,input.value]))};
    });
    localStorage.setItem('nekosagasi-layout-v1',JSON.stringify(data));
    const response=await fetch('/api/layout',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
    if(!response.ok){alert('保存できませんでした');return}
    window.showSaveSuccess?.();
  },true);
})();
