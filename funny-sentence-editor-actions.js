(() => {
  const storageKey = 'nekosagasi-funny-sentences-v1';
  const readData = () => { try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; } };
  const writeData = data => localStorage.setItem(storageKey, JSON.stringify(data));
  const sentenceKey = words => words.join('|');

  function showGeneratedImages() {
    const data = readData(), images = data.generatedImages || {};
    document.querySelectorAll('.variation-card[data-axis][data-child]').forEach(card => {
      const words = data.axes?.[Number(card.dataset.axis)]?.children?.[Number(card.dataset.child)];
      const src = words && images[sentenceKey(words)];
      if (!src || card.querySelector('img')) return;
      const image = document.createElement('img');
      image.src = src; image.alt = `${words.join(' ')} のイベント画像`; image.loading = 'lazy';
      card.append(image);
    });
  }

  async function generateMissingImages(button) {
    const data = readData(); data.generatedImages = data.generatedImages || {};
    const sentences = (data.axes || []).flatMap(axis => axis.children || []).filter(words => !data.generatedImages[sentenceKey(words)]);
    if (!sentences.length) { button.textContent = '画像はすべてあります'; return; }
    button.disabled = true;
    for (let index = 0; index < sentences.length; index += 1) {
      const words = sentences[index]; button.textContent = `イラストを生成中… ${index + 1}/${sentences.length}`;
      try {
        const response = await fetch('/api/funny-image', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sentence: words.join(' ') }) });
        const result = await response.json();
        if (!response.ok || !result.url) throw new Error(result.error || '生成できませんでした');
        data.generatedImages[sentenceKey(words)] = result.url; writeData(data); showGeneratedImages();
      } catch (error) { button.textContent = `生成を止めました: ${error.message}`; button.disabled = false; return; }
    }
    button.textContent = 'ない画像のイラストを生成'; button.disabled = false;
  }

  function addPersistentTools() {
    const main = document.querySelector('main.wrap');
    if (!main || document.querySelector('#funny-sentence-tools')) return;
    const card = document.createElement('section');
    card.className = 'card'; card.id = 'funny-sentence-tools';
    const generate = document.createElement('button');
    generate.id = 'generate-missing-images'; generate.className = 'save'; generate.textContent = 'ない画像のイラストを生成';
    generate.onclick = () => generateMissingImages(generate);
    const remove = document.createElement('button');
    remove.id = 'delete-sentence'; remove.className = 'delete-axis'; remove.textContent = '選択中の文を削除';
    remove.onclick = () => window.deleteFunnySentence?.();
    card.append(generate, remove);
    main.append(card);
  }

  addPersistentTools();
  showGeneratedImages();
})();
