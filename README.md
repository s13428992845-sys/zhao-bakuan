# 找爆款 · Web 应用

面向内容创作者的「低粉爆款追踪」Web 应用：输入赛道，生成近期热门选题方向、近一周新增爆款、1000粉以下低粉爆款，点开任意一条可看**案例拆解 / 评论区热议 / 选题推荐**，并可直接跳转原帖（Web 端无小程序外链限制）。

**默认使用内置示例数据，打开网页即可用，无需任何后端、无需配置。** 想要真实数据，可按 `COZE_WORKFLOW.md` 搭建 Coze 工作流，再填一个 `config.js` 即可切换（可选）。

## 目录结构
```
web/
├── index.html        前端页面
├── styles.css        样式
├── app.js            前端逻辑（默认示例数据，可选直连 Coze）
├── mock.js           内置示例数据（打开即用）
├── config.js.example 可选 Coze 配置模板（复制为 config.js 后填凭证）
├── api/coze.js       （可选）Vercel 服务端代理版本，见下方说明
├── vercel.json       （可选）Vercel 配置
├── package.json
├── COZE_WORKFLOW.md  Coze 工作流节点设计与提示词（可选）
└── README.md
```

## 一、本地预览（零配置）
直接用浏览器打开 `index.html` 即可，已自带示例数据，完整界面立即可看。
也可加 `?mock=1` 强制使用示例数据。

## 二、部署到 GitHub Pages（推荐，朋友打开链接即用）
1. 在 GitHub 新建一个仓库（如 `find-viral`）。
2. 把本 `web/` 目录下的所有文件推到该仓库（建议以 `web/` 作为仓库根，即仓库根目录直接是 `index.html`）。
   ```bash
   cd web
   git init
   git add .
   git commit -m "init 找爆款"
   git remote add origin <你的仓库地址>
   git branch -M main
   git push -u origin main
   ```
3. 仓库 → **Settings → Pages** → Source 选 `Deploy from a branch` → Branch 选 `main`、文件夹选 `/ (root)` → Save。
4. 等待约 1 分钟，访问 `https://<你的用户名>.github.io/<仓库名>/` 即可。
5. 把该链接发给朋友，她浏览器一点就能用，无需安装、无需账号。

> 已在仓库根放了 `.nojekyll`，确保 GitHub Pages 原样托管所有文件。
> 国内访问 GitHub Pages 可能偏慢，自己用完全够；若要更快可后续迁移到 Vercel/Gitee Pages。

## 三、切换为真实数据（可选 · Coze）
如果你后续想用真实生成的爆款数据（而非示例）：
1. 按 `COZE_WORKFLOW.md` 在 Coze 搭建并发布工作流，拿到 **PAT** 和 **workflow_id**。
2. 复制 `config.js.example` 为 `config.js`，填入凭证。
3. 重新部署（或本地打开）。网页会优先调用 Coze，失败自动回退示例数据。

⚠️ 前端直连 Coze 会把 PAT 暴露在浏览器，**仅限你信任的人使用、不要公开分发**。若要安全公开，请改用 `api/coze.js` + Vercel（PAT 留在服务端），见下方。

## 四、改用 Vercel + 服务端代理（可选 · 安全公开）
若日后要公开发布且不想暴露 PAT：
1. 用 `api/coze.js`（Vercel 函数，已封装好调用与解析）。
2. 部署到 Vercel，Root Directory 设为 `web`，配置环境变量 `COZE_PAT` / `COZE_WORKFLOW_ID`（及可选 `COZE_API_BASE`）。
3. 前端会把请求发到同源 `/api/coze`，PAT 始终留在服务器。

## 已知限制
- 默认示例数据为演示用途，非真实爆款；填好 Coze 后才是真实生成内容。
- 示例中的 `sourceUrl` 为占位链接；接 Coze 时若开启联网搜索，可让模型从真实检索结果提取链接。
- 对外公开分发时仍需注意内容合规与数据来源授权。
