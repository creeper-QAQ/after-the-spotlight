(() => {
  const script = document.currentScript;
  const root = new URL('.', script.src);
  const edition = script.dataset.version || 'current';
  const versions = [
    { label: '最新版', number: 'V1.4.1', path: './', id: 'current' },
    { label: '上一版', number: 'V1.4', path: 'v1.4/', id: 'v14' },
    { label: '旧版', number: 'V1.3', path: 'legacy/', id: 'legacy' },
  ];
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
    const active = versions.find((version) => version.id === edition) || versions[0];
    summary.setAttribute('aria-label', `切换网站版本，当前${active.label} ${active.number}`);
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', '网站版本');
    for (const version of versions) {
      const link = document.createElement('a');
      link.href = new URL(version.path, root).href;
      link.textContent = `${version.label} · ${version.number}`;
      if (version.id === edition) {
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
