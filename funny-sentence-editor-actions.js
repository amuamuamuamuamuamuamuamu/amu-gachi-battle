(() => {
  const storageKey = 'nekosagasi-funny-sentences-v1';
  const readData = () => { try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; } };
  const writeData = data => localStorage.setItem(storageKey, JSON.stringify(data));
  const sentenceKey = words => words.join('|');
  const manualImages = {
  '不死身の|ビーバーが|ほどく': '/イベント画像/不死身のビーバーがほどく.webp?rev=20261027-global-v1',
  '不死身の|ビーバーが|約束する': '/イベント画像/不死身のビーバーが約束する.webp?rev=20261027-restored-v1',
  '不死身の|ビーバーが|負ける': '/イベント画像/不死身のビーバーが負ける.webp?rev=20261026-lite',
  '高性能の|ビーバーが|ほどく': '/イベント画像/高性能のビーバーがほどく.webp?rev=20261026-lite',
  '高性能の|ビーバーが|負ける': '/イベント画像/高性能のビーバーが負ける.webp?rev=20261027-restored-v1',
  '高性能の|ビーバーが|約束する': '/イベント画像/高性能のビーバーが約束する.webp?rev=20261027-restored-v1',
  '冷凍庫の|ナマケモノが|増える': '/イベント画像/冷凍庫のナマケモノが増える.webp?rev=20261026-sloth',
  '冷凍庫の|ナマケモノが|勝つ': '/イベント画像/冷凍庫のナマケモノが勝つ.webp?rev=20261026-sloth',
  '冷凍庫の|ナマケモノが|浮遊する': '/イベント画像/冷凍庫のナマケモノが浮遊する.webp?rev=20261026-sloth',
  '天才の|ナマケモノが|増える': '/イベント画像/天才のナマケモノが増える.webp?rev=20261027-global-v1',
  '天才の|ナマケモノが|勝つ': '/イベント画像/天才のナマケモノが勝つ.webp?rev=20261027-global-v1',
  '天才の|ナマケモノが|浮遊する': '/イベント画像/天才のナマケモノが浮遊する.webp?rev=20261027-global-v1',
  '空っぽの|ナマケモノが|増える': '/イベント画像/空っぽのナマケモノが増える.webp?rev=20261027-global-v1',
  '空っぽの|ナマケモノが|勝つ': '/イベント画像/空っぽのナマケモノが勝つ.webp?rev=20261027-global-v1',
  '空っぽの|ナマケモノが|浮遊する': '/イベント画像/空っぽのナマケモノが浮遊する.webp?rev=20261027-global-v1'
  };

  function showGeneratedImages() {
    const data = readData(), images = data.generatedImages || {};
    document.querySelectorAll('.variation-card[data-axis][data-child]').forEach(card => {
      const words = data.axes?.[Number(card.dataset.axis)]?.children?.[Number(card.dataset.child)];
      const manualSrc = words && manualImages[sentenceKey(words)];
      // A regenerated image must win over an older hand-picked fallback.
      // Otherwise the editor keeps showing the old illustration even though
      // the revised image has already been saved to the shared store.
      const src = words && (images[sentenceKey(words)] || manualSrc);
      const existingImage = card.querySelector('img');
      if (!src) return;
      if (existingImage) {
        existingImage.src = src;
        return;
      }
      const image = document.createElement('img');
      image.src = src; image.alt = `${words.join(' ')} のイベント画像`; image.loading = 'lazy';
      card.append(image);
    });
  }

  showGeneratedImages();
  new MutationObserver(showGeneratedImages).observe(document.querySelector('#app'), { childList: true, subtree: true });
})();
