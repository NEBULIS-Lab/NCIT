(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  let language = 'zh';
  let featureIndex = 0;
  let scene = 'lab';
  const storageKey = 'ncit-language';
  const descriptions = {
    zh: '星云协智 NCIT：以共享世界模型连接多机械臂，让非标制造拥有可扩展、可重配置的协同智能。香港科技大学（广州）科技初创项目。',
    en: 'NCIT develops shared-world-model intelligence for scalable multi-arm collaboration in high-mix, low-volume manufacturing. A technology startup project from HKUST(GZ).'
  };
  const titles = {
    zh: '星云协智 NCIT — 让多臂协作，拥有共同的智能',
    en: 'NCIT — Many arms. One shared intelligence.'
  };

  function updateFeature(index) {
    featureIndex = index;
    const item = NCIT_FEATURES[language][index];
    $('#tech-kicker').textContent = item.kicker;
    $('#tech-panel-title').textContent = item.title;
    $('#tech-panel-desc').textContent = item.description;
    $('#tech-panel').setAttribute('aria-labelledby', `tech-tab-${index}`);
    $$('[data-tech]').forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
  }

  function updateScene(next) {
    scene = next;
    const item = NCIT_SCENES[scene];
    $('#scene-image').src = item.image;
    $('#scene-image').alt = item[language].alt;
    $('#scene-caption').textContent = item[language].caption;
    $('#scene-index').textContent = scene === 'lab' ? 'FIELD NOTES / 01' : 'SIMULATION / 02';
    $('#scene-panel').setAttribute('aria-labelledby', `scene-tab-${scene}`);
    $$('[data-scene]').forEach((tab) => {
      const active = tab.dataset.scene === scene;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  }

  function setLanguage(next, persist = false) {
    language = next === 'en' ? 'en' : 'zh';
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    $$('[data-i18n]').forEach((element) => { element.textContent = NCIT_COPY[language][element.dataset.i18n]; });
    $$('[data-i18n-alt]').forEach((element) => { element.alt = NCIT_COPY[language][element.dataset.i18nAlt]; });
    $$('[data-i18n-aria]').forEach((element) => { element.setAttribute('aria-label', NCIT_COPY[language][element.dataset.i18nAria]); });
    $('#language-label').textContent = language === 'zh' ? 'EN' : '中文';
    $('#language-switch').setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换到中文');
    $('#language-switch').lang = language === 'zh' ? 'en' : 'zh-CN';
    document.title = titles[language];
    $('meta[name="description"]').content = descriptions[language];
    $('meta[property="og:title"]').content = titles[language];
    $('meta[property="og:description"]').content = descriptions[language];
    updateFeature(featureIndex);
    updateScene(scene);
    updateMenuLabel();
    if (persist) {
      try { localStorage.setItem(storageKey, language); } catch { /* Device storage may be unavailable. */ }
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', language);
        window.history.replaceState({}, '', url);
      } catch { /* Local file previews can disallow history changes. */ }
    }
  }

  function updateMenuLabel() {
    const open = $('#menu-toggle').getAttribute('aria-expanded') === 'true';
    $('#menu-toggle').setAttribute('aria-label', language === 'zh' ? (open ? '关闭导航' : '打开导航') : (open ? 'Close navigation' : 'Open navigation'));
  }
  function setMenu(open, focusToggle = false) {
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
    $('#mobile-nav').hidden = !open;
    document.body.classList.toggle('menu-open', open);
    updateMenuLabel();
    if (focusToggle) $('#menu-toggle').focus();
  }
  $('#menu-toggle').addEventListener('click', () => setMenu($('#mobile-nav').hidden));
  $$('#mobile-nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('#mobile-nav').hidden) setMenu(false, true);
  });
  document.addEventListener('click', (event) => {
    if (!$('#mobile-nav').hidden && !event.target.closest('.site-header')) setMenu(false);
  });
  const desktopQuery = window.matchMedia('(min-width: 961px)');
  desktopQuery.addEventListener('change', ({ matches }) => { if (matches) setMenu(false); });

  function wireTabs(selector, activate) {
    const tabs = $$(selector);
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (event) => {
        let next = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        activate(tabs[next]);
        tabs[next].focus();
      });
    });
  }
  wireTabs('[data-tech]', (tab) => updateFeature(Number(tab.dataset.tech)));
  wireTabs('[data-scene]', (tab) => updateScene(tab.dataset.scene));
  $('#language-switch').addEventListener('click', () => setLanguage(language === 'zh' ? 'en' : 'zh', true));
  $('#year').textContent = String(new Date().getFullYear());

  const queryLanguage = new URLSearchParams(window.location.search).get('lang');
  let savedLanguage;
  try { savedLanguage = localStorage.getItem(storageKey); } catch { /* Chinese remains the default. */ }
  setLanguage(['zh', 'en'].includes(queryLanguage) ? queryLanguage : savedLanguage);
})();
