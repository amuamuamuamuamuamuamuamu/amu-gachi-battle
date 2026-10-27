(() => {
  const storageKey = 'nekosagasi-funny-sentences-v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; } };
  const write = data => localStorage.setItem(storageKey, JSON.stringify(data));
  const key = words => (words || []).join('|');
  // Keep the typed value as soon as it is entered.  The main editor redraws
  // the whole list when another variation is selected, so a delayed-only
  // save could otherwise be discarded before its timer ran.
  function saveNote(panel, textarea) {
    const current = read();
    current.variationNotes = current.variationNotes && typeof current.variationNotes === 'object' ? current.variationNotes : {};
    const currentKey = panel.dataset.noteKey;
    if (textarea.value.trim()) current.variationNotes[currentKey] = textarea.value;
    else delete current.variationNotes[currentKey];

    // Retain a small local recovery trail.  It is deliberately stored with
    // the shared document so changing phones/browsers does not lose it.
    const history = Array.isArray(current.variationNotesHistory) ? current.variationNotesHistory : [];
    history.push({ at: Date.now(), notes: { ...current.variationNotes } });
    current.variationNotesHistory = history.slice(-12);
    write(current);

    const hasNote = Boolean(textarea.value.trim());
    panel.classList.toggle('has-note', hasNote);
    panel.querySelector('summary').textContent = hasNote ? '備考あり' : '備考';
  }

  const style = document.createElement('style');
  style.textContent = '.variation-note-panel{margin:0 4px 8px;padding:0 8px 8px;border:1px solid #b9dfeb;border-radius:12px;background:#fff}.variation-note-panel summary{cursor:pointer;padding:9px 2px;font-weight:800;color:#126b8b}.variation-note-panel.has-note summary{color:#d52d3b}.variation-note-panel textarea{box-sizing:border-box;width:100%;min-height:88px;resize:vertical;margin:0;background:#effbff;font:500 16px -apple-system,BlinkMacSystemFont,"Hiragino Sans",sans-serif}';
  document.head.append(style);

  function renderNotes() {
    const data = read();
    data.variationNotes = data.variationNotes && typeof data.variationNotes === 'object' ? data.variationNotes : {};
    document.querySelectorAll('.variation-card[data-axis][data-child]').forEach(card => {
      const words = data.axes?.[Number(card.dataset.axis)]?.children?.[Number(card.dataset.child)];
      if (!words) return;
      const noteKey = key(words);
      const note = data.variationNotes[noteKey] || '';
      card.querySelector('.variation-note-badge')?.remove();

      let panel = card.nextElementSibling;
      if (!panel || !panel.matches('.variation-note-panel')) {
        panel = document.createElement('details');
        panel.className = 'variation-note-panel';
        panel.dataset.noteKey = noteKey;
        panel.innerHTML = '<summary>備考</summary><textarea placeholder="画像に入れたい場面・服・表情などを書けます"></textarea>';
        card.insertAdjacentElement('afterend', panel);
        const textarea = panel.querySelector('textarea');
        textarea.value = note;
        textarea.addEventListener('input', () => saveNote(panel, textarea));
      } else if (panel.dataset.noteKey === noteKey && document.activeElement !== panel.querySelector('textarea')) {
        panel.querySelector('textarea').value = note;
      }
      panel.classList.toggle('has-note', Boolean(note));
      const label = note ? '備考あり' : '備考';
      const summary = panel.querySelector('summary');
      if (summary.textContent !== label) summary.textContent = label;
    });
  }

  document.addEventListener('click', event => {
    const saveButton = event.target.closest('#save-changes');
    if (!saveButton) return;
    const before = read();
    const axisIndex = Number(before.activeAxis);
    const oldChildren = Number.isInteger(axisIndex) ? (before.axes?.[axisIndex]?.children || []).map(words => words.slice()) : [];
    setTimeout(() => {
      const after = read();
      const changedAxis = Number(after.activeAxis);
      const newChildren = Number.isInteger(changedAxis) ? (after.axes?.[changedAxis]?.children || []) : [];
      if (!oldChildren.length || oldChildren.length !== newChildren.length) return;
      after.variationNotes = after.variationNotes && typeof after.variationNotes === 'object' ? after.variationNotes : {};
      let changed = false;
      newChildren.forEach((words, index) => {
        const oldKey = key(oldChildren[index]);
        const newKey = key(words);
        if (oldKey !== newKey && Object.prototype.hasOwnProperty.call(after.variationNotes, oldKey)) {
          after.variationNotes[newKey] = after.variationNotes[oldKey];
          delete after.variationNotes[oldKey];
          changed = true;
        }
      });
      if (changed) write(after);
      renderNotes();
    }, 0);
  }, true);

  new MutationObserver(renderNotes).observe(document.querySelector('#app'), { childList: true, subtree: true });
  renderNotes();
})();
