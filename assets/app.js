/* Minimal shared JS for homepage and thoughts page */
(function () {
  function formatDate(iso) {
    try {
      const date = new Date(iso);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  function byDateDesc(a, b) {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }

  async function loadJSON(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to load ' + url);
    return await response.json();
  }

  function queryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function setCurrentYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function renderLatest(posts) {
    const mount = document.getElementById('latest-posts');
    if (!mount) return;
    const latest = posts.slice(0, 3);
    mount.innerHTML = latest.map(p => {
      const icon = p.type === 'video' ? '📺' : (p.type === 'file' ? '📎' : '📝');
      return (
        '<article class="card">' +
          '<h3>' + icon + ' ' + escapeHtml(p.title) + '</h3>' +
          '<div class="meta">' + formatDate(p.date) + ' · ' + p.section + '</div>' +
          '<a href="thoughts.html#' + encodeURIComponent(p.id) + '">Open</a>' +
        '</article>'
      );
    }).join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function applyThoughtsPage(posts) {
    const root = document.getElementById('thoughts-root');
    if (!root) return;
    // Simple title list
    const list = document.createElement('ul');
    list.className = 'post-list';
    posts.forEach(p => {
      const li = document.createElement('li');
      li.className = 'post-item';
      li.id = p.id;
      const link = document.createElement('a');
      link.className = 'post-link';
      link.href = p.url || p.markdown || '#';
      if (p.type === 'video') link.href = p.embedUrl.replace('/embed/', '/watch?v=');
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = p.title;
      li.appendChild(link);
      const date = document.createElement('span');
      date.className = 'post-date';
      date.textContent = formatDate(p.date);
      li.appendChild(date);
      list.appendChild(li);
    });
    root.appendChild(list);

    // Medium link
    const medium = document.createElement('p');
    medium.className = 'medium-link';
    medium.innerHTML = 'Couple of old posts on <a href="https://medium.com/@tanmayagarwal_55603" target="_blank" rel="noopener">Medium</a>.';
    root.appendChild(medium);
    
  }

  async function loadMarkdown(path) {
    const res = await fetch(path, { cache: 'no-store' });
    const md = await res.text();
    return marked.parse(md);
  }

  /* Tab switching */
  function initTabs() {
    const links = document.querySelectorAll('.nav-link[data-tab]');
    if (!links.length) return;

    links.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const tab = this.getAttribute('data-tab');
        switchTab(tab);
        history.replaceState(null, '', '#' + tab);
      });
    });

    // Activate tab from URL hash on load
    const hash = (window.location.hash || '').replace('#', '');
    if (hash && document.getElementById(hash)) {
      switchTab(hash);
    }
  }

  function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-link[data-tab]').forEach(el => el.classList.remove('active'));
    const section = document.getElementById(tab);
    const link = document.querySelector('.nav-link[data-tab="' + tab + '"]');
    if (section) section.classList.add('active');
    if (link) link.classList.add('active');
  }

  let postsLoaded = false;

  async function init() {
    setCurrentYear();
    initTabs();
    try {
      let posts = await loadJSON('content/posts.json');
      posts = posts.sort(byDateDesc);
      renderLatest(posts);
      applyThoughtsPage(posts);
      postsLoaded = true;
    } catch (e) {
      console.warn(e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


