(() => {
  const script = document.currentScript;
  const root = new URL('.', script.src);
  const legacy = script.dataset.version === 'legacy';
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('version-switch.css', root).href;
  document.head.append(style);

  function mount() {
    const actions = document.querySelector('.site-header .header-actions');
    if (!actions || document.getElementById('website-versions')) return false;
    const selector = document.createElement('details');
    selector.id = 'website-versions';
    selector.className = 'website-versions';
    const summary = document.createElement('summary');
    summary.textContent = '版本';
    summary.setAttribute('aria-label', `切换网站版本，当前${legacy ? '旧版 V1.3' : '新版 V1.4'}`);
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', '网站版本');
    for (const version of [
      { label: '新版', number: 'V1.4', path: './', current: !legacy },
      { label: '旧版', number: 'V1.3', path: 'legacy/', current: legacy },
    ]) {
      const link = document.createElement('a');
      link.href = new URL(version.path, root).href;
      link.textContent = `${version.label} · ${version.number}`;
      if (version.current) {
        link.setAttribute('aria-current', 'page');
        const badge = document.createElement('span');
        badge.textContent = '当前';
        link.append(badge);
      }
      nav.append(link);
    }
    selector.append(summary, nav);
    actions.prepend(selector);
    document.addEventListener('click', (event) => {
      if (!selector.contains(event.target)) selector.open = false;
    });
    selector.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        selector.open = false;
        summary.focus();
      }
    });
    return true;
  }
  if (!mount()) {
    const observer = new MutationObserver(() => {
      if (mount()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
