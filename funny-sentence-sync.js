(() => {
  const key = 'nekosagasi-funny-sentences-v1';
  const endpoint = '/api/funny-sentences';
  const localEditKey = `${key}-last-edit`;
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

  let lastObservedContent = contentFingerprint(localStorage.getItem(key));
  const looksCorrupted = data => /\?{2,}/.test(JSON.stringify(data || {}));
  const appliedCloudKey = `${key}-applied-cloud-content`;

  function upload(value, immediately = false) {
    if (!value || syncing) return;
    // The editor writes its initial local state while it boots. Never let
    // that stale startup copy overwrite the shared data before it is read.
    if (!initialLoadFinished) return;
    clearTimeout(timer);
    const send = () => {
      fetch(endpoint, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: JSON.parse(value), updatedAt: Date.now() })
      }).catch(() => {});
    };
    if (immediately) send(); else timer = setTimeout(send, 300);
  }

  Storage.prototype.setItem = function (name, value) {
    originalSetItem.call(this, name, value);
    if (this === localStorage && name === key) {
      const nextContent = contentFingerprint(value);
      if (!syncing && nextContent !== lastObservedContent) {
        lastObservedContent = nextContent;
        originalSetItem.call(localStorage, localEditKey, String(Date.now()));
        upload(value);
      }
    }
  };

  fetch(endpoint)
    .then(response => response.ok ? response.json() : null)
    .then(saved => {
      const local = localStorage.getItem(key);
      const localEditedAt = Number(localStorage.getItem(localEditKey) || 0);
      const cloudEditedAt = Number(saved?.updatedAt || 0);
      initialLoadFinished = true;
      // Do not replace a device's valid local data with a broken shared copy.
      if (saved?.data && looksCorrupted(saved.data)) return;
      if (saved?.data && local && localEditedAt > cloudEditedAt) {
        // This device contains a newer explicit edit. Publish it instead of
        // replacing it with the older shared snapshot.
        upload(local, true);
      } else if (saved?.data) {
        const cloud = JSON.stringify(saved.data);
        if (contentFingerprint(local) !== contentFingerprint(cloud)) {
          syncing = true;
          originalSetItem.call(localStorage, key, cloud);
          syncing = false;
          lastObservedContent = contentFingerprint(cloud);
          // Refresh only once while the page is still at its initial top
          // position. This applies a newly shared list immediately without
          // jumping a person who is already scrolling this long editor.
          const cloudContent = contentFingerprint(cloud);
          if (window.scrollY < 8 && sessionStorage.getItem(appliedCloudKey) !== cloudContent) {
            sessionStorage.setItem(appliedCloudKey, cloudContent);
            location.reload();
          }
        }
      } else if (local) {
        upload(local);
      }
    })
    .catch(() => {
      // Stay usable offline; the next successful save will upload the data.
      initialLoadFinished = true;
    });
})();
