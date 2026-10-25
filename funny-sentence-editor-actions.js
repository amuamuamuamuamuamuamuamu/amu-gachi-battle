(() => {
  const storageKey = 'nekosagasi-funny-sentences-v1';
  const app = document.querySelector('#app');
  if (!app) return;
  document.querySelector('#funny-sentence-tools')?.remove();
  let data;
  try { data = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { data = {}; }
  data.axes = Array.isArray(data.axes) ? data.axes : [];
  data.queue = Array.isArray(data.queue) ? data.queue : [];
  data.wordLibrary = Array.isArray(data.wordLibrary) ? data.wordLibrary : [[], [], []];
  data.generatedImages = data.generatedImages || {};
  let edit = null, selectedSlot = null, notice = '';
  const key = words => words.join('|');
  const save = () => localStorage.setItem(storageKey, JSON.stringify(data));
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  function variationKeys() { return new Set(data.axes.flatMap(axis => axis.children || []).map(key)); }
  function selectVariation(axisIndex, childIndex) {
    const child = data.axes[axisIndex]?.children?.[childIndex];
    if (!child) return;
    edit = { axisIndex, childIndex, original: child.slice(), words: child.slice() };
    selectedSlot = null; notice = '変更したい言葉を選んでから、下の言葉パーツをタップしてください。'; render();
  }
  function chooseSlot(slot) { selectedSlot = slot; notice = `言葉${slot + 1}を選択中です。`; render(); }
  function choosePart(slot, value) {
    if (!edit || selectedSlot !== slot) { notice = `先に言葉${slot + 1}を選択してください。`; render(); return; }
    edit.words[slot] = value; notice = '差し替えました。変更を保存すると主軸セット全体に反映されます。'; render();
  }
  function saveEdit() {
    if (!edit) { notice = '主軸バリエーションを選んでください。'; render(); return; }
    const axis = data.axes[edit.axisIndex];
    edit.original.forEach((from, slot) => {
      const to = edit.words[slot];
      if (from === to) return;
      (axis.children || []).forEach(words => { if (words[slot] === from) words[slot] = to; });
      if (axis.words?.[slot] === from) axis.words[slot] = to;
    });
    const child = axis.children?.find(words => key(words) === key(edit.words));
    edit = child ? { axisIndex: edit.axisIndex, childIndex: axis.children.indexOf(child), original: child.slice(), words: child.slice() } : null;
    data.queue = data.queue.filter(words => !variationKeys().has(key(words)));
    selectedSlot = null; save(); notice = '保存しました。主軸セット全体に反映されています。'; render();
  }
  function deleteEdit() {
    if (!edit || !confirm('この文を本当に削除しますか？')) return;
    const axis = data.axes[edit.axisIndex];
    axis.children.splice(edit.childIndex, 1);
    edit = null; selectedSlot = null; save(); notice = 'バリエーション文を削除しました。'; render();
  }
  async function generate(button) {
    const missing = data.axes.flatMap(axis => axis.children || []).filter(words => !data.generatedImages[key(words)]);
    if (!missing.length) { notice = '画像はすべてあります。'; render(); return; }
    button.disabled = true;
    for (let i = 0; i < missing.length; i += 1) {
      button.textContent = `イラストを生成中… ${i + 1}/${missing.length}`;
      const words = missing[i];
      try {
        const response = await fetch('/api/funny-image', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({sentence:words.join(' ')}) });
        const result = await response.json();
        if (!response.ok || !result.url) throw new Error(result.error || '生成できませんでした');
        data.generatedImages[key(words)] = result.url; save();
      } catch (error) { notice = `生成を止めました: ${error.message}`; button.disabled = false; render(); return; }
    }
    notice = '画像を生成しました。'; render();
  }
  function render() {
    const words = edit?.words || [];
    const editor = edit ? `<section class="card"><h2>文編集</h2><div class="words">${words.map((word, slot) => `<div class="word-control"><button class="${selectedSlot === slot ? 'choosing' : ''}" data-slot="${slot}">${esc(word)}</button></div>`).join('')}</div><button class="save" id="save-changes">変更を保存</button><button class="delete-axis" id="delete-sentence">選択中の文を削除</button><p class="saved">${esc(notice)}</p></section>` : `<section class="card"><h2>文編集</h2><p>主軸で登録済みの文から、編集したいバリエーションを選んでください。</p><p class="saved">${esc(notice)}</p></section>`;
    const axes = data.axes.map((axis, ai) => `<section class="card list"><h2>主軸：${esc((axis.words || []).join(' '))}</h2>${(axis.children || []).map((child, ci) => `<button class="variation-card" data-axis="${ai}" data-child="${ci}"><span>└ ${esc(child.join(' '))}</span>${data.generatedImages[key(child)] ? `<img src="${esc(data.generatedImages[key(child)])}" alt="${esc(child.join(' '))} のイベント画像">` : ''}</button>`).join('')}</section>`).join('') || '<section class="card"><p>主軸で登録済みの文はありません。</p></section>';
    const parts = edit ? `<section class="card parts"><h2>言葉のパーツ</h2>${data.wordLibrary.map((list, slot) => `<h3>言葉${slot + 1}</h3><div>${list.map(value => `<button class="part" data-part-slot="${slot}" data-part="${esc(value)}">${esc(value)}</button>`).join('')}</div>`).join('')}</section>` : '';
    app.innerHTML = `${editor}<section class="card"><button class="save" id="generate-missing-images">ない画像のイラストを生成</button></section>${axes}${parts}`;
    app.querySelectorAll('[data-axis]').forEach(button => button.onclick = () => selectVariation(Number(button.dataset.axis), Number(button.dataset.child)));
    app.querySelectorAll('[data-slot]').forEach(button => button.onclick = () => chooseSlot(Number(button.dataset.slot)));
    app.querySelectorAll('[data-part-slot]').forEach(button => button.onclick = () => choosePart(Number(button.dataset.partSlot), button.dataset.part));
    app.querySelector('#save-changes')?.addEventListener('click', saveEdit);
    app.querySelector('#delete-sentence')?.addEventListener('click', deleteEdit);
    const generateButton = app.querySelector('#generate-missing-images');
    if (generateButton) generateButton.onclick = () => generate(generateButton);
  }
  render();
})();
