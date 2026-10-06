(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const valid = id => TEMPLATES.find(item => item.id === id);
  const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { value ? localStorage.setItem(key,value) : localStorage.removeItem(key); } catch {} };
  const query = new URLSearchParams(location.search);
  let language = (query.get('lang') || read('ncit-gallery-language')) === 'en' ? 'en' : 'zh';
  let selected = valid(query.get('template'))?.id || valid(read('ncit-template-choice'))?.id || null;
  let filter = 'all';
  let preview = null;
  let mode = 'motion';
  let toastTimer;
  const t = key => GALLERY_COPY[language][key];

  function renderCards() {
    const visible = TEMPLATES.filter(item => filter === 'all' || item.cost === filter || item.theme === filter);
    $('#result-count').textContent = `${visible.length} ${t('count')}`;
    $('#cards').innerHTML = visible.map((item,index) => {
      const copy = item[language], active = item.id === selected;
      return `<article class="template-card${active ? ' selected' : ''}" style="--i:${index}" id="template-${item.id}">
        <button class="screenshot-button" type="button" data-preview="${item.id}" aria-label="${escape(t('watch')+' '+item.name)}">
          <img src="gallery/media/${item.id}.webp" width="1440" height="960" alt="${escape(item.name+' · '+t('originalLabel'))}" ${index>1?'loading="lazy"':''}>
          <span class="image-label"><b>${item.number}</b> ${escape(copy.badge)}</span>
          ${active ? `<span class="selected-stamp">✓ ${t('picked')}</span>` : ''}
          <span class="image-play"><span class="play-symbol" aria-hidden="true">▶</span>${t('watch')}</span>
        </button>
        <div class="card-body"><div class="card-title-row"><div><h2>${escape(item.name)}</h2><span class="author">${escape(item.author)}</span></div><span class="cost ${item.cost}">${t(item.cost==='free'?'freeLabel':'paidLabel')}</span></div>
          <p class="card-style">${escape(copy.style)}</p><p class="card-description">${escape(copy.summary)}</p>
          <div class="effects">${copy.motion.map(effect=>`<span>${escape(effect)}</span>`).join('')}</div>
          <div class="card-actions"><button class="button" type="button" data-preview="${item.id}">${t('watch')}</button><a class="button" href="${item.demo}" target="_blank" rel="noopener noreferrer" aria-label="${escape(item.name+' · '+t('newTab'))}">${t('original')}</a><button class="button choose ${active?'selected-button':'primary'}" type="button" data-choose="${item.id}" aria-pressed="${active}">${active?'✓ '+t('picked'):t('pick')}</button></div>
          <div class="card-links"><a href="${item.source}" target="_blank" rel="noopener noreferrer">${t('source')}</a><a href="${item.license}" target="_blank" rel="noopener noreferrer">${t('license')}</a></div>
        </div></article>`;
    }).join('');
  }

  function updateSelection() {
    const item = valid(selected);
    document.body.classList.toggle('has-selection', Boolean(item));
    $('#selection-name').textContent = item ? `${item.number} · ${item.name} / ${item.author}` : t('noSelection');
    $('#selection-hint').textContent = item ? t('selectedHint') : t('noSelectionHint');
    $('.selection-icon').textContent = item ? '✓' : '◇';
    $('#copy').disabled = !item;
    $('#clear').hidden = !item;
  }
  function updateUrl() {
    try {
      const url = new URL(location.href);
      url.searchParams.set('lang',language);
      selected ? url.searchParams.set('template',selected) : url.searchParams.delete('template');
      history.replaceState(null,'',url);
    } catch {}
  }
  function choose(id) {
    if (!valid(id)) return;
    selected = id;
    save('ncit-template-choice',selected);
    updateUrl();renderCards();updateSelection();
  }
  function setLanguage(next) {
    language = next === 'en' ? 'en' : 'zh';
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = t('title');
    $('meta[name="description"]').content = t('intro');
    $$('[data-t]').forEach(element => {element.textContent=t(element.dataset.t)});
    $('#language').textContent = language === 'zh' ? 'EN' : '中文';
    $('#language').setAttribute('aria-label',language==='zh'?'Switch to English':'切换到中文');
    $('#language').lang = language==='zh'?'en':'zh-CN';
    $('#close-preview').setAttribute('aria-label',t('close'));
    $('#close-copy').setAttribute('aria-label',t('close'));
    $('#templates').setAttribute('aria-label',language==='zh'?'候选模板':'Template shortlist');
    $('.filters').setAttribute('aria-label',language==='zh'?'筛选模板':'Filter templates');
    $('.stages').setAttribute('aria-label',language==='zh'?'项目阶段':'Project stages');
    $('.selection-bar').setAttribute('aria-label',language==='zh'?'当前选择':'Current selection');
    $('.preview-tab-list').setAttribute('aria-label',language==='zh'?'预览类型':'Preview type');
    $('#copy-text').setAttribute('aria-label',language==='zh'?'模板选择文字':'Template selection text');
    renderCards();updateSelection();
  }
  function setMode(next) {
    mode = next;
    $('#motion-panel').hidden = mode !== 'motion';
    $('#still-panel').hidden = mode !== 'still';
    $$('[data-mode]').forEach(button => {
      const active = button.dataset.mode === mode;
      button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
    });
    if(mode!=='motion') $('#preview-video').pause();
  }
  function openPreview(id) {
    const item = valid(id); if(!item)return;
    preview=id;const copy=item[language];
    $('#preview-index').textContent=item.number;
    $('#preview-title').textContent=item.name;
    $('#preview-author').textContent=item.author;
    $('#preview-original').href=item.demo;
    $('#preview-source').href=item.source;
    $('#preview-license').href=item.license;
    $('#preview-image').src=`gallery/media/${item.id}.webp`;
    $('#preview-image').alt=`${item.name} · ${t('originalLabel')}`;
    $('#preview-video').poster=`gallery/media/${item.id}.webp`;
    $('#preview-video').src=`gallery/media/${item.id}.mp4`;
    $('#preview-video').setAttribute('aria-label',`${item.name} · ${t('modalMotion')}`);
    $('#preview-style').textContent=copy.style;
    $('#preview-effects').innerHTML=copy.motion.map(effect=>`<span>${escape(effect)}</span>`).join('');
    $('#preview-fit').textContent=copy.fit;
    $('#preview-terms').textContent=copy.terms;
    $('#preview-pick').textContent = selected===item.id ? '✓ '+t('picked') : t('pick');
    setMode('motion');
    $('#preview-dialog').showModal();document.body.classList.add('dialog-open');
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches) $('#preview-video').play().catch(()=>{});
  }
  function stopPreview() {
    const video=$('#preview-video');video.pause();video.removeAttribute('src');video.load();
    document.body.classList.remove('dialog-open');
  }
  $('#cards').addEventListener('click',event=>{
    const watch=event.target.closest('[data-preview]');
    const pick=event.target.closest('[data-choose]');
    if(watch)openPreview(watch.dataset.preview);
    if(pick){choose(pick.dataset.choose);$(`[data-choose="${pick.dataset.choose}"]`)?.focus({preventScroll:true})}
  });
  $('.filters').addEventListener('click',event=>{
    const button=event.target.closest('[data-filter]');if(!button)return;
    filter=button.dataset.filter;
    $$('[data-filter]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});
    renderCards();
  });
  $('#language').addEventListener('click',()=>{setLanguage(language==='zh'?'en':'zh');save('ncit-gallery-language',language);updateUrl()});
  $('#clear').addEventListener('click',()=>{selected=null;save('ncit-template-choice',null);updateUrl();renderCards();updateSelection()});
  $('#close-preview').addEventListener('click',()=>$('#preview-dialog').close());
  $('#preview-dialog').addEventListener('close',stopPreview);
  $('#preview-dialog').addEventListener('click',event=>{if(event.target===$('#preview-dialog')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close()}});
  $('#preview-pick').addEventListener('click',()=>{choose(preview);$('#preview-dialog').close();$(`[data-choose="${preview}"]`)?.focus({preventScroll:true})});
  $$('[data-mode]').forEach(button=>{
    button.addEventListener('click',()=>setMode(button.dataset.mode));
    button.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();setMode(event.key==='Home'?'motion':event.key==='End'?'still':mode==='motion'?'still':'motion');$(`[data-mode="${mode}"]`).focus()}});
  });
  function selectionText() {
    const item=valid(selected);if(!item)return '';
    if(language==='zh') return `我选择 ${item.number} · ${item.name}（${item.author}）。\n原模板：${item.demo}\n请基于这个现成模板重新制作 NCIT 网站，保留并完善动画效果，加入中英文切换，以及商业计划书中的产品、技术、团队、实拍与演示视频。\n授权：${item.zh.terms}`;
    return `I choose ${item.number} · ${item.name} (${item.author}).\nOriginal: ${item.demo}\nPlease rebuild NCIT using this existing template. Retain and refine its motion, add Chinese/English switching, and use the product, technology, team, photography and demo from the business deck.\nLicense: ${item.en.terms}`;
  }
  $('#copy').addEventListener('click',async()=>{
    if(!selected)return;
    const text=selectionText();
    try {
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      clearTimeout(toastTimer);$('#toast').textContent=t('copied');$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true},3500);
    } catch {
      $('#copy-text').value=text;$('#copy-dialog').showModal();$('#copy-text').focus();$('#copy-text').select();
    }
  });
  $('#close-copy').addEventListener('click',()=>$('#copy-dialog').close());
  setLanguage(language);
})();
