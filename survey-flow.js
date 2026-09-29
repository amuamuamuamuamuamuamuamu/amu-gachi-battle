/* 多数派クイズ: 回答後は次のタップで結果処理、回答前は外側タップで閉じる。 */
(()=>{
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
})();
