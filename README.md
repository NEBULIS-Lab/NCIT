# NCIT · 网站模板选择

当前首页是**模板选择页**。先从真实模板中选定视觉与动效方向，再基于选中的模板改造 NCIT 中英文官网。

**在线选择：[nebulis-lab.com/NCIT](https://nebulis-lab.com/NCIT/)**

## 怎么选

1. 打开「看动效」观看官方演示的短录屏，或点「打开原站」完整体验。
2. 点「选这个模板」。可以随时换选。
3. 点「复制我的选择」，将文字发回聊天；也可以直接回复编号。

选择保存在当前设备的浏览器中，不会自动提交到服务器或聊天。地址中的 `?template=open` 可恢复指定选择；`?lang=en` 可切换到英文。

## 真实模板

| 编号 | 模板 | 方向 | 获取方式 | 官方演示 / 来源 |
| --- | --- | --- | --- | --- |
| 01 | Stellar · Cruip | 深色科技、粒子与光效 | 付费 US$49 | [演示](https://preview.cruip.com/stellar/) · [来源](https://cruip.com/stellar/) |
| 02 | Open · Cruip | 深色产品、视频主导 | 免费源码 | [演示](https://open.cruip.com/) · [源码](https://github.com/cruip/open-react-template) |
| 03 | Simple Light · Cruip | 浅色简洁、产品展示 | 免费源码 | [演示](https://simple.cruip.com/) · [源码](https://github.com/cruip/tailwind-landing-page-template) |
| 04 | FinTech · Cruip | 明亮企业、产品分层 | 付费 US$49 | [演示](https://preview.cruip.com/fintech/) · [来源](https://cruip.com/fintech/) |
| 05 | Forty · HTML5 UP | 大图叙事、项目矩阵 | 免费，保留署名 | [演示](https://html5up.net/uploads/demos/forty/) · [来源](https://html5up.net/forty) |
| 06 | Dimension · HTML5 UP | 沉浸首屏、栏目切换 | 免费，保留署名 | [演示](https://html5up.net/uploads/demos/dimension/) · [来源](https://html5up.net/dimension) |

价格与来源核对于 2026-10-07，以作者当前页面为准。本仓库只存放演示截图、短录屏和选择器，不分发第三方模板源码。[预览素材与授权说明](docs/template-sources.md)。

## 本地预览

无需安装应用依赖。Node.js 18+：

```bash
node scripts/serve.mjs 8080
```

打开 `http://127.0.0.1:8080/`。服务器支持视频进度拖动所需的 HTTP Range 请求。

```bash
node scripts/check.mjs
node scripts/build.mjs
```

`.site/` 为可部署的静态文件。GitHub Actions 在推送到 `main` 后自动检查并发布到已配置的 Pages。

## 文件

- `index.html`：模板选择页。
- `gallery/templates.js`：6 个模板的来源、授权、动效说明和双语文案。
- `gallery/gallery.js` / `gallery/gallery.css`：筛选、预览、选择和复制交互。
- `gallery/media/`：官方页面实拍截图与短动效录屏。
- `previous.html`：上一版网站存档，保留以便后续迁移内容。
- `assets/` / `content.js`：已核对的 PPT 素材与 NCIT 双语内容，供选定模板后复用。

上一版内容与验证记录见 `docs/asset-sources.md` 和 `docs/validation.md`，不代表本轮最终设计。
