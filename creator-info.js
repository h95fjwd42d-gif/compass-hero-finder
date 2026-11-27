(() => {
  const status = document.getElementById('creator-copy-status');
  document.querySelectorAll('[data-creator-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.dataset.creatorCopy;
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(value);
        status.textContent = 'コピーしました：' + value;
      } catch (_) {
        status.textContent = 'コピーできませんでした。コードを長押し、または選択してコピーしてください。';
      }
    });
  });
})();
