const TEMPLATES = [
  {
    id: 'stellar', number: '01', name: 'Stellar', author: 'Cruip', cost: 'paid', theme: 'dark',
    demo: 'https://preview.cruip.com/stellar/', source: 'https://cruip.com/stellar/', license: 'https://cruip.com/terms/',
    zh: { style: '深色科技 · 粒子与光效', summary: '紫色光晕、粒子背景和分层卡片，偏前沿科技品牌。', motion: ['粒子背景', '滚动入场', '交互光效'], fit: '把发光主视觉换成多臂协作视频；沿用技术卡片、团队页和合作入口。', terms: '付费模板，官方标价 US$49（核对于 2026-10-07）。需购买授权后使用源码。', badge: '科技感强' },
    en: { style: 'Dark technology · Particles & light', summary: 'Purple light, particles and layered cards for a futuristic technology brand.', motion: ['Particles', 'Scroll reveals', 'Interactive light'], fit: 'Replace the hero with the multi-arm demo; retain technology cards, team pages and a partnership section.', terms: 'Paid template: US$49 on 7 Oct 2026. Source code requires a purchased license.', badge: 'Strong tech identity' }
  },
  {
    id: 'open', number: '02', name: 'Open', author: 'Cruip', cost: 'free', theme: 'dark',
    demo: 'https://open.cruip.com/', source: 'https://github.com/cruip/open-react-template', license: 'https://github.com/cruip/open-react-template#terms-and-license',
    zh: { style: '深色产品 · 视频主导', summary: '大标题、核心演示视频和清晰的产品分区，贴近科技创业公司。', motion: ['区块渐显', '视频弹层', '悬停反馈'], fit: '直接用 PPT 的四臂视频作为核心展示；技术、场景、团队沿用原模板的内容结构。', terms: '作者提供免费源码并允许商用；遵循仓库列出的 GPL 与作者使用条款。', badge: '免费首选' },
    en: { style: 'Dark product · Video first', summary: 'A bold headline, prominent demo and clear product sections for a technology startup.', motion: ['Section reveals', 'Video dialog', 'Hover feedback'], fit: 'Use the four-arm video as the main demonstration, with the original structure for technology, applications and team.', terms: 'Free source and commercial use from the author; follow the repository’s GPL and author terms.', badge: 'Free starting point' }
  },
  {
    id: 'simple', number: '03', name: 'Simple Light', author: 'Cruip', cost: 'free', theme: 'light',
    demo: 'https://simple.cruip.com/', source: 'https://github.com/cruip/tailwind-landing-page-template', license: 'https://github.com/cruip/tailwind-landing-page-template#terms-and-license',
    zh: { style: '浅色简洁 · 产品展示', summary: '白底、蓝色重点和大面积留白，适合清晰呈现产品与技术。', motion: ['渐显入场', '循环装饰', '区块过渡'], fit: '把软件窗口换成机器人视频与系统演示；保持明亮、轻量的公司官网风格。', terms: '作者提供免费源码并允许商用；遵循仓库列出的 GPL 与作者使用条款。', badge: '清爽明亮' },
    en: { style: 'Light and clear · Product showcase', summary: 'White surfaces, blue accents and generous space keep the product easy to understand.', motion: ['Entrance reveals', 'Looping accents', 'Section transitions'], fit: 'Replace software panels with robotics footage and system demonstrations while preserving the bright corporate presentation.', terms: 'Free source and commercial use from the author; follow the repository’s GPL and author terms.', badge: 'Bright & clear' }
  },
  {
    id: 'fintech', number: '04', name: 'FinTech', author: 'Cruip', cost: 'paid', theme: 'light',
    demo: 'https://preview.cruip.com/fintech/', source: 'https://cruip.com/fintech/', license: 'https://cruip.com/terms/',
    zh: { style: '明亮企业 · 大图分层', summary: '鲜明品牌色、左右分栏和分层产品图，偏成熟商业产品。', motion: ['分层入场', '滚动渐显', '轮播过渡'], fit: '将银行卡插画替换为机械臂与工位图片；保留产品叙事和商业合作结构。', terms: '付费模板，官方标价 US$49（核对于 2026-10-07）。需购买授权后使用源码。', badge: '商业感强' },
    en: { style: 'Bright business · Layered visuals', summary: 'A strong brand color, split layouts and layered imagery for an established product feel.', motion: ['Layered entrances', 'Scroll reveals', 'Carousel transitions'], fit: 'Replace card illustrations with robot and workcell imagery, retaining the product narrative and commercial structure.', terms: 'Paid template: US$49 on 7 Oct 2026. Source code requires a purchased license.', badge: 'Business oriented' }
  },
  {
    id: 'forty', number: '05', name: 'Forty', author: 'HTML5 UP', cost: 'free', theme: 'dark',
    demo: 'https://html5up.net/uploads/demos/forty/', source: 'https://html5up.net/forty', license: 'https://html5up.net/license',
    zh: { style: '大图叙事 · 项目矩阵', summary: '大幅图片、非对称拼接和全屏菜单，适合展示机器人项目与场景。', motion: ['全屏菜单', '图块悬停', '页面淡入'], fit: '用实验室、仿真和行业场景照片做大幅图块；点入各项技术与应用。', terms: '免费，可商用和修改。CC BY 3.0，网站需保留 HTML5 UP 设计署名。', badge: '强调实拍' },
    en: { style: 'Visual storytelling · Project grid', summary: 'Large images, asymmetric tiles and a full-screen menu put robotics and applications first.', motion: ['Full-screen menu', 'Tile hover effects', 'Page fades'], fit: 'Use large lab, simulation and application images as entry points into individual technologies and use cases.', terms: 'Free for commercial use and modification under CC BY 3.0. Retain the HTML5 UP design credit.', badge: 'Photography first' }
  },
  {
    id: 'dimension', number: '06', name: 'Dimension', author: 'HTML5 UP', cost: 'free', theme: 'dark',
    demo: 'https://html5up.net/uploads/demos/dimension/', source: 'https://html5up.net/dimension', license: 'https://html5up.net/license',
    zh: { style: '沉浸首屏 · 栏目切换', summary: '全屏背景和浮层栏目，用切换式浏览带来更强的进入感。', motion: ['背景淡入', '栏目切换', '弹层过渡'], fit: '全屏展示机器人场景，再通过浮层进入技术、演示、团队和合作；适合精炼内容。', terms: '免费，可商用和修改。CC BY 3.0，网站需保留 HTML5 UP 设计署名。', badge: '交互感强' },
    en: { style: 'Immersive hero · Modal navigation', summary: 'A full-screen backdrop and animated content panels create an immersive project introduction.', motion: ['Background fade', 'Section switching', 'Modal transitions'], fit: 'Use a robotics backdrop with focused panels for technology, demo, team and collaboration. Best for concise content.', terms: 'Free for commercial use and modification under CC BY 3.0. Retain the HTML5 UP design credit.', badge: 'Immersive interaction' }
  }
];
const GALLERY_COPY = {
  zh: {
    title: 'NCIT · 网站模板选择', brand: '网站模板选择', stage: '01 选模板', next: '02 内容与动效改造', last: '03 发布官网',
    eyebrow: 'NCIT / DESIGN SHORTLIST', heading: '先选模板，再做网站。', intro: '6 个现成模板。直接看真实页面、原生动效，再选你喜欢的方向。',
    sub: '选定后沿用模板的布局与动画，换入星云协智的中英文内容、实拍和协作视频。',
    all: '全部模板', free: '免费模板', paid: '付费模板', dark: '深色风格', light: '浅色风格', count: '个模板',
    watch: '看动效', original: '打开原站', pick: '选这个模板', picked: '已选中', freeLabel: '免费', paidLabel: '付费 · US$49',
    originalLabel: '原模板截图', recordLabel: '官方演示实录 · 含滚动与点击操作', source: '模板来源', license: '授权说明',
    sourceNote: '模板设计归原作者所有。这里展示官方演示的截图与短录屏，不包含第三方模板源码。',
    footer: '选好后，把编号或复制的选择发回聊天，我再按选定模板改造。',
    noSelection: '还没有选定模板', noSelectionHint: '先看原站与动效，再点击「选这个模板」。', selectedHint: '已保存在这台设备，复制后发回聊天即可。',
    copy: '复制我的选择', copied: '已复制，发回聊天即可', clear: '清除', close: '关闭', modalMotion: '动画实录', modalStill: '首页大图',
    adaptation: '用于 NCIT 的改造方向', nativeMotion: '模板原生效果', licenseHeading: '使用与授权', previewTitle: '模板预览',
    chooseFirst: '请先选一个模板', manualTitle: '复制下面的选择', manualHint: '自动复制不可用，请手动复制这段文字并发回聊天。',
    skip: '跳转到模板', noResults: '没有符合条件的模板', newTab: '新窗口打开原站', freeCount: '4 个免费 · 2 个付费',
    previewInstruction: '短录屏用于快速比较；打开原站可以完整体验滚动、鼠标与栏目切换。',
    selectedLabel: '你的选择', change: '换一个也可以，选择尚未发送。'
  },
  en: {
    title: 'NCIT · Choose a website template', brand: 'Template selection', stage: '01 Choose', next: '02 Content & motion', last: '03 Publish',
    eyebrow: 'NCIT / DESIGN SHORTLIST', heading: 'Choose the template. Then we build.', intro: 'Six existing templates. See the real pages and their original motion, then choose your direction.',
    sub: 'We will adapt the selected layout and animations with NCIT’s bilingual content, lab photography and collaboration video.',
    all: 'All templates', free: 'Free', paid: 'Paid', dark: 'Dark', light: 'Light', count: 'templates',
    watch: 'Watch motion', original: 'Open original', pick: 'Choose this', picked: 'Selected', freeLabel: 'Free', paidLabel: 'Paid · US$49',
    originalLabel: 'Original template screenshot', recordLabel: 'Official demo recording · Includes scrolling and clicks', source: 'Template source', license: 'License',
    sourceNote: 'Template designs belong to their authors. This gallery includes screenshots and short official-demo recordings, not third-party template source code.',
    footer: 'Send the number or copied selection back in chat. The selected template will be the basis of the redesign.',
    noSelection: 'No template selected yet', noSelectionHint: 'Explore the original and motion, then choose a template.', selectedHint: 'Saved on this device. Copy your selection and send it in chat.',
    copy: 'Copy my selection', copied: 'Copied. Send it back in chat.', clear: 'Clear', close: 'Close', modalMotion: 'Motion recording', modalStill: 'Full-size screenshot',
    adaptation: 'How we would adapt it for NCIT', nativeMotion: 'Original template effects', licenseHeading: 'Use & licensing', previewTitle: 'Template preview',
    chooseFirst: 'Choose a template first', manualTitle: 'Copy your selection', manualHint: 'Automatic copying is unavailable. Copy this text manually and send it back in chat.',
    skip: 'Skip to templates', noResults: 'No matching templates', newTab: 'Open original in a new tab', freeCount: '4 free · 2 paid',
    previewInstruction: 'The short recording is a quick comparison. Open the original to explore all scrolling, hover and navigation effects.',
    selectedLabel: 'YOUR SELECTION', change: 'You can change your mind. Nothing has been sent.'
  }
};
