/* 編集ボタンは端末差のないURL遷移でも開けるようにする。 */
(()=>{
  document.addEventListener('click',event=>{
  const button=event.target.closest?.('.event-npc-editor-v2 [data-edit]');
  if(!button)return;
  // 言葉NPCは画面内で編集を開く。URL遷移すると新規登録画面の初期化と競合して内容が消える。
  if(button.closest('.event-npc-editor-v2')?.querySelector('.event-type-tabs .active')?.dataset.type==='words')return;
  event.preventDefault();
    event.stopImmediatePropagation();
    const url=new URL(location.href);
    url.searchParams.set('eventEdit',button.dataset.edit);
    location.assign(url.href);
  },true);
})();
