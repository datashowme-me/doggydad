# DoggyDad Blog

一个使用 Astro 构建、发布到 Cloudflare Pages 的中文个人博客，内容包括读书笔记、技术学习和图灵奖人物系列。

## 已有能力

- Astro Content Collections 管理 Markdown 内容
- 响应式首页、分类页和文章页
- 读书笔记元数据与一分钟速览
- 自动阅读时间、文章目录和目录滚动高亮
- 相关文章、上一篇与下一篇
- 客户端静态搜索
- RSS、Sitemap、结构化数据与社交分享元数据
- 跟随系统的浅色／深色主题
- Giscus 评论
- 键盘焦点、跳到正文和响应式导航

## 本地运行

需要 Node.js 20.19 或更高版本。

```bash
npm install
npm run dev
```

开发地址：`http://localhost:4321/`

## 构建与预览

```bash
npm run build
npm run preview
```

构建产物位于 `dist/`。

## WordKey 英语练习模块

源码位于 `apps/wordkey/`，以普通目录纳入当前仓库管理，不包含独立 `.git`、原仓库提交历史或 Git 子模块。模块保留自己的依赖和构建产物，不改变主站的 Astro 构建及部署。

```bash
npm --prefix apps/wordkey install
npm run dev:wordkey
npm run check:wordkey
npm run build:wordkey
```

WordKey 构建产物位于 `apps/wordkey/dist/`，独立发布到 `learn.wordsmaster.app`，不会随主站构建发布。会员、兑换码和付费次数限制已移除。AI 接口使用限流和 D1 原子预算预留保护，每月全站预算按 ¥30 保守控制；详见 `apps/wordkey/README.md`。实际部署状态以 Cloudflare 和线上验证为准。

执行 `npm --prefix apps/wordkey run test:free-access` 可检查源码未重新引入付费限制（不替代浏览器交互测试）。

不要提交真实环境变量；模块的 `.env.example` 仅作为配置模板。

## ArtCatcher 3D 游戏模块

源码位于 `apps/artcatcher/`，以普通目录纳入当前仓库管理，不包含独立 `.git` 或 Git 子模块。主站构建时会先构建游戏，再将产物发布到 `/games/artcatcher/`。

```bash
npm run dev:artcatcher
npm run check:artcatcher
npm run build:artcatcher
```

上游仓库、固定提交号及导入说明记录在 `apps/artcatcher/README.md`。

## 添加文章

在 `src/content/posts/<category>/` 下创建 Markdown 文件。基础字段：

```yaml
---
title: 文章标题
date: 2026-08-07
description: 用一两句话说明文章价值。
tags: [标签一, 标签二]
author: DoggyDad
category: reading-notes
---
```

读书笔记还可以使用：

```yaml
bookTitle: The Effective Engineer
bookAuthor: Edmond Lau
recommendedFor: 软件工程师、技术负责人
rating: 5
takeaways:
  - 第一条核心结论
  - 第二条核心结论
  - 第三条核心结论
```

Markdown 正文可以从 `#` 开始；构建时会自动将正文中的第一个一级标题降为二级标题，保证页面只有一个主标题。

## 内容分类

- `reading-notes`：读书笔记
- `turing-award`：图灵奖系列
- `tech-learning`：技术学习
- `general`：随笔

## 代码托管与部署

项目代码继续托管在 GitHub，线上部署交给 Cloudflare Pages：

- 代码仓库：GitHub
- 部署平台：Cloudflare Pages
- 正式站点：`https://wordsmaster.app`
- Pages 默认地址：`https://doggydad.pages.dev`
- 基础路径：`/`
- 输出模式：静态页面
- 构建产物：`dist/`

推荐在 Cloudflare Dashboard 中连接 GitHub 仓库，由 Cloudflare Pages 监听 `main` 分支并自动构建：

- Production branch：`main`
- Build command：`npm run build`
- Build output directory：`dist`
- Root directory：留空

项目不需要 GitHub Pages，也不需要 GitHub Actions 部署 workflow。

需要手动发布时，也可以使用 Wrangler 直接上传当前构建产物：

```bash
npm run deploy
```

默认 `SITE_URL` 为 `https://wordsmaster.app`，以便 Canonical URL、Sitemap、RSS 和分享信息指向正式域名；需要预览其他域名时可通过 `SITE_URL` 覆盖。

`wrangler.jsonc` 和 `public/_headers` 分别保存 Pages 输出目录与基础安全／缓存响应头。
