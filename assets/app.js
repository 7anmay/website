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

    // Filter controls
    const selectedSection = (queryParam('section') || 'all').toLowerCase();
    const filters = document.createElement('div');
    filters.className = 'filters';
    const sections = ['all', ...Array.from(new Set(posts.map(p => p.section.toLowerCase())))];
    sections.forEach(section => {
      const link = document.createElement('a');
      link.className = 'chip';
      link.href = section === 'all' ? 'thoughts.html' : ('thoughts.html?section=' + encodeURIComponent(section));
      link.textContent = section.charAt(0).toUpperCase() + section.slice(1);
      if (section === selectedSection) link.style.outline = '2px solid var(--accent)';
      filters.appendChild(link);
    });

    root.appendChild(filters);

    // Apply hash navigation to scroll to a post
    const hashId = decodeURIComponent((window.location.hash || '').replace('#', ''));

    // List
    const list = document.createElement('div');
    list.className = 'post-list';
    const visible = posts.filter(p => selectedSection === 'all' || p.section.toLowerCase() === selectedSection);
    visible.forEach(p => list.appendChild(renderPost(p)));
    root.appendChild(list);

    if (hashId) {
      const target = document.getElementById(hashId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderPost(post) {
    const article = document.createElement('article');
    article.className = 'post';
    article.id = post.id;

    const title = document.createElement('h3');
    title.textContent = post.title;
    article.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = formatDate(post.date) + ' · ' + post.section + ' · ' + post.type;
    article.appendChild(meta);

    const content = document.createElement('div');
    content.className = 'content';
    if (post.type === 'text') {
      if (post.markdown) {
        loadMarkdown(post.markdown).then(html => { content.innerHTML = html; });
      } else if (post.html) {
        content.innerHTML = post.html;
      } else if (post.text) {
        content.textContent = post.text;
      }
    } else if (post.type === 'video') {
      // Support YouTube or any embeddable URL
      const iframe = document.createElement('iframe');
      iframe.className = 'video';
      iframe.src = post.embedUrl;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      content.appendChild(iframe);
    } else if (post.type === 'file') {
      const link = document.createElement('a');
      link.href = post.url;
      link.textContent = 'Download ' + (post.label || 'file');
      content.appendChild(link);
    }
    article.appendChild(content);
    return article;
  }

  async function loadMarkdown(path) {
    const res = await fetch(path, { cache: 'no-store' });
    const md = await res.text();
    return simpleMarkdownToHtml(md);
  }

  // Extremely small markdown converter for headings, bold/italic, links, code blocks
  function simpleMarkdownToHtml(md) {
    const lines = md.split(/\r?\n/);
    const html = [];
    let inCode = false;
    lines.forEach(line => {
      if (line.trim().startsWith('```')) {
        inCode = !inCode;
        html.push(inCode ? '<pre><code>' : '</code></pre>');
        return;
      }
      if (inCode) {
        html.push(escapeHtml(line));
        return;
      }
      if (line.startsWith('### ')) {
        html.push('<h3>' + escapeInline(line.slice(4)) + '</h3>');
      } else if (line.startsWith('## ')) {
        html.push('<h2>' + escapeInline(line.slice(3)) + '</h2>');
      } else if (line.startsWith('# ')) {
        html.push('<h1>' + escapeInline(line.slice(2)) + '</h1>');
      } else if (line.trim() === '') {
        html.push('');
      } else {
        html.push('<p>' + escapeInline(line) + '</p>');
      }
    });
    return html.join('\n');
  }

  function escapeInline(text) {
    let s = escapeHtml(text);
    // bold **text** and italic *text*
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // links [text](url)
    s = s.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1<\/a>');
    return s;
  }

  async function init() {
    setCurrentYear();
    try {
      let posts = await loadJSON('content/posts.json');
      posts = posts.sort(byDateDesc);
      renderLatest(posts);
      applyThoughtsPage(posts);
    } catch (e) {
      // Fail silently on homepage if posts are missing during first run
      console.warn(e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


