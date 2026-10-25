(() => {
  const key = 'nekosagasi-funny-sentences-v1';
  const endpoint = '/api/funny-sentences';
  const originalSetItem = Storage.prototype.setItem;
  let syncing = false;
  let initialLoadFinished = false;
  let changedWhileLoading = false;
  let timer = 0;

  // Navigation and expanded-panel state are local UI details.  They should
  // not make a stale local copy win over the shared sentence data.
  function contentFingerprint(value) {
    try {
      const data = JSON.parse(value || '{}');
      ['activeAxis', 'axisExpanded', 'cursor', 'funnyDraft'].forEach(name => delete data[name]);
      const variationKeys = new Set((data.axes || []).flatMap(axis => axis.children || []).map(words => words.join('|')));
      if (Array.isArray(data.queue)) data.queue = data.queue.filter(words => !variationKeys.has(words.join('|')));
      return JSON.stringify(data);
    } catch {
      return value || '';
    }
  }

  const initialContent = contentFingerprint(localStorage.getItem(key));

  function upload(value) {
    if (!value || syncing) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fetch(endpoint, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: JSON.parse(value), updatedAt: Date.now() })
      }).catch(() => {});
    }, 300);
  }

  Storage.prototype.setItem = function (name, value) {
    originalSetItem.call(this, name, value);
    if (this === localStorage && name === key) {
      // A save can happen while the first cloud read is still in flight.
      // Remember it so an older response cannot replace the user's change.
      if (!initialLoadFinished && contentFingerprint(value) !== initialContent) changedWhileLoading = true;
      upload(value);
    }
  };

  fetch(endpoint)
    .then(response => response.ok ? response.json() : null)
    .then(saved => {
      const local = localStorage.getItem(key);
      initialLoadFinished = true;
      if (saved?.data && !changedWhileLoading) {
        const cloud = JSON.stringify(saved.data);
        if (contentFingerprint(local) !== contentFingerprint(cloud)) {
          syncing = true;
          originalSetItem.call(localStorage, key, cloud);
          syncing = false;
          location.reload();
        }
      } else if (local) {
        // Prefer an edit made on this screen over a stale initial response.
        upload(local);
      }
    })
    .catch(() => {
      // Stay usable offline; the next successful save will upload the data.
      initialLoadFinished = true;
    });
})();
