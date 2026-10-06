export const policySources = {
  guangdong: {
    url: 'https://www.gd.gov.cn/cms-bulletin/public/4678950/1741916395/fa958b59fbcbd4e11c44c15478e58b6d.pdf',
    title: '广东省推动人工智能与机器人产业创新发展若干政策措施 · 粤府办〔2025〕6号',
  },
  guangzhou: {
    url: 'https://gxj.gz.gov.cn/gkmlpt/content/10/10886/post_10886098.html',
    title: '广州市推动具身智能机器人产业高质量发展若干措施 · 穗工信函〔2026〕196号',
  },
  scenarios: {
    url: 'https://gxj.gz.gov.cn/yw/tzgg/content/post_10839723.html',
    title: '广州市具身智能机器人应用场景机会清单、能力清单（第一批）· 2026年6月3日',
  },
  fieldTraining: {
    url: 'https://www.miit.gov.cn/zwgk/zcwj/wjfb/tz/art/2026/art_f291ccd3da4c47ce95741de63cc088e6.html',
    title: '2026年度人形机器人与具身智能实景实训专项行动 · 工信厅联科函〔2026〕256号',
  },
};

type Passage = 'workIntro' | 'challengeIntro' | 'partnershipIntro';
type Segment = string | {text:string;source:keyof typeof policySources};
export const policyCopy: Record<'zh'|'en',Record<Passage,Segment[]>> = {
  zh: {
    workIntro: [
      {text:'广东省人工智能与机器人产业政策',source:'guangdong'},'与',
      {text:'广州具身智能产业措施',source:'guangzhou'},
      '推动联合研发、训练测试和应用场景开放。立足大湾区制造需求，我们以四臂装配为起点，连接模型、数据与真实工位。',
    ],
    challengeIntro: [
      '广州2026年首批', {text:'具身智能应用场景清单',source:'scenarios'},
      '发布了142项场景机会。我们聚焦多品种、小批量工位中的共同搬运、支撑对齐与紧固，让多臂协作回应具体的生产需求。',
    ],
    partnershipIntro: [
      '借鉴', {text:'2026年度具身智能实景实训行动',source:'fieldTraining'},
      '强调的真实场景验证思路，我们与制造企业、机械臂厂商和系统集成商，从明确任务与可量化验收出发，推进工位部署与能力复用。',
    ],
  },
  en: {
    workIntro: [
      {text:'Guangdong’s AI and robotics policy',source:'guangdong'},' and ',
      {text:'Guangzhou’s embodied robotics measures',source:'guangzhou'},
      ' support joint R&D, testing and access to application settings. Starting with four-arm assembly, we connect models, data and workcells around the Greater Bay Area’s manufacturing needs.',
    ],
    challengeIntro: [
      'Guangzhou’s first ',{text:'embodied robotics scenario catalog of 2026',source:'scenarios'},
      ' identifies 142 application opportunities. We focus on shared handling, alignment and fastening in high-mix, low-volume workcells, bringing collaboration to concrete production tasks.',
    ],
    partnershipIntro: [
      'Drawing on the real-world validation approach in the ',
      {text:'2026 national embodied robotics field-training initiative',source:'fieldTraining'},
      ', we work with manufacturers, robot makers and integrators to define tasks and measurable acceptance criteria, then advance toward deployment and reuse.',
    ],
  },
};
export type {Passage};
