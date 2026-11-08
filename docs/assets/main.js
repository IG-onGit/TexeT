(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
  function esc(s) { return s.replace(/[&<>]/g, function (c) { return ESC[c]; }); }

  var STR = '"(?:\\\\.|[^"\\\\\\n])*"|\'[^\'\\n]*\'';
  var KW_JS = '\\b(?:const|let|var|function|return|if|else|for|while|new|await|async|import|from|export|class|true|false|null)\\b';
  var KW_PY = '\\b(?:def|class|return|if|elif|else|for|while|import|from|as|in|not|and|or|try|except|with|None|True|False|self)\\b';
  var LANGS = {
    bash: [['c', '#.*'], ['s', STR], ['o', '(?:^|\\s)--?[A-Za-z][\\w-]*'], ['k', '\\b(?:if|then|fi|for|do|done|export|sudo)\\b'], ['f', '\\b(?:pip|texet|git|python3?|cd|echo|npm|node)\\b'], ['n', '\\b\\d+(?:\\.\\d+)*\\b'], ['x', '[|&;<>(){}\\[\\]=]']],
    json: [['p', '"(?:\\\\.|[^"\\\\])*"(?=\\s*:)'], ['s', '"(?:\\\\.|[^"\\\\])*"'], ['n', '-?\\b\\d+(?:\\.\\d+)?\\b'], ['k', '\\b(?:true|false|null)\\b'], ['x', '[{}\\[\\],:]']],
    js: [['c', '//.*|/\\*[\\s\\S]*?\\*/'], ['s', STR + '|`[^`]*`'], ['k', KW_JS], ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['f', '\\b[A-Za-z_$][\\w$]*(?=\\()'], ['x', '[{}()\\[\\];,.:=<>!+\\-*/]+']],
    py: [['c', '#.*'], ['s', '"""[\\s\\S]*?"""|' + STR], ['t', '@\\w+'], ['k', KW_PY], ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['f', '\\b[A-Za-z_]\\w*(?=\\()'], ['x', '[{}()\\[\\],.:=<>!+\\-*/]+']],
    yaml: [['c', '#.*'], ['p', '^[ \\t-]*[\\w.-]+(?=:)'], ['s', STR], ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['k', '\\b(?:true|false|null)\\b'], ['x', '[:\\-\\[\\]{},]']],
    kotlin: [['c', '//.*|/\\*[\\s\\S]*?\\*/'], ['s', '"(?:\\\\.|[^"\\\\\\n])*"'], ['k', '\\b(?:fun|val|var|class|object|if|else|when|for|while|return|import|package|true|false|null)\\b'], ['n', '\\b\\d+(?:\\.\\d+)?\\b'], ['t', '\\b[A-Z]\\w*\\b'], ['f', '\\b[a-z_]\\w*(?=\\()'], ['x', '[{}()\\[\\],.:=<>!+\\-*/]+']],
    http: [['k', '\\b(?:GET|POST|PUT|PATCH|DELETE)\\b'], ['p', '^[\\w-]+(?=:)'], ['s', STR], ['n', '\\b\\d+\\b'], ['f', '/[\\w./-]*']]
  };
  var ALIAS = { sh: 'bash', shell: 'bash', javascript: 'js', python: 'py', kt: 'kotlin', yml: 'yaml' };

  function highlight(code, lang) {
    var rules = LANGS[ALIAS[lang] || lang];
    if (!rules) return esc(code);
    var re = new RegExp(rules.map(function (r) { return '(' + r[1] + ')'; }).join('|'), 'gm');
    var out = '', last = 0, m, i;
    while ((m = re.exec(code))) {
      if (m[0] === '') { re.lastIndex++; continue; }
      out += esc(code.slice(last, m.index));
      i = 1; while (m[i] === undefined) i++;
      out += '<span class="tok-' + rules[i - 1][0] + '">' + esc(m[0]) + '</span>';
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, fail) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? ok() : fail(); } catch (e) { fail(e); } finally { document.body.removeChild(ta); }
    });
  }

  function enhanceCode() {
    document.querySelectorAll('pre > code[data-lang]').forEach(function (code) {
      var pre = code.parentNode, lang = code.getAttribute('data-lang');
      var raw = code.textContent.replace(/^\n/, '').replace(/\s+$/, '');
      var wrap = document.createElement('div'); wrap.className = 'codeblock';
      var bar = document.createElement('div'); bar.className = 'cb-bar';
      bar.innerHTML = '<i></i><i></i><i></i><span></span><button type="button" class="copy"><svg class="icon" aria-hidden="true"><use href="#i-copy"/></svg><b>Copy</b></button>';
      bar.querySelector('span').textContent = code.getAttribute('data-title') || lang;
      try { code.innerHTML = highlight(raw, lang); } catch (e) { code.textContent = raw; }
      pre.tabIndex = 0;
      pre.parentNode.insertBefore(wrap, pre); wrap.appendChild(bar); wrap.appendChild(pre);
      var btn = bar.querySelector('button'), label = btn.querySelector('b'), use = btn.querySelector('use'), t;
      btn.addEventListener('click', function () {
        copyText(raw).then(function () {
          label.textContent = 'Copied'; use.setAttribute('href', '#i-check');
          clearTimeout(t);
          t = setTimeout(function () { label.textContent = 'Copy'; use.setAttribute('href', '#i-copy'); }, 1800);
        }, function () { label.textContent = 'Press Ctrl+C'; });
      });
    });
  }

  function initMenu() {
    var burger = document.querySelector('.burger');
    if (!burger) return;
    var target = document.getElementById(burger.getAttribute('aria-controls'));
    var use = burger.querySelector('use'), mq = window.matchMedia('(min-width: 821px)');
    function set(open) {
      document.documentElement.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      use.setAttribute('href', open ? '#i-x' : '#i-menu');
    }
    window.TX_closeMenu = function () { set(false); };
    burger.addEventListener('click', function () { set(!document.documentElement.classList.contains('menu-open')); });
    if (target) target.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function (e) { if (e.matches) set(false); });
  }

  function initDocs() {
    var secs = Array.prototype.slice.call(document.querySelectorAll('.doc-section'));
    if (!secs.length) return;
    var links = document.querySelectorAll('[data-section]');
    var site = document.title.split(' | ').pop();
    function show(id, push) {
      var s = secs.filter(function (x) { return x.id === id; })[0] || secs[0];
      secs.forEach(function (x) { x.classList.toggle('active', x === s); });
      links.forEach(function (a) {
        if (a.getAttribute('data-section') === s.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      document.title = s.querySelector('h1').textContent + ' | ' + site;
      if (push) history.pushState(null, '', '#' + s.id);
      window.scrollTo(0, 0);
      if (window.TX_closeMenu) window.TX_closeMenu();
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-section],[data-goto]');
      if (!a) return;
      e.preventDefault();
      show(a.getAttribute('data-section') || a.getAttribute('data-goto'), true);
    });
    window.addEventListener('popstate', function () { show(location.hash.slice(1), false); });
    show(location.hash.slice(1), false);
    setTimeout(function () { window.scrollTo(0, 0); }, 0);
  }

  document.addEventListener('DOMContentLoaded', function () { enhanceCode(); initMenu(); initDocs(); });
})();
