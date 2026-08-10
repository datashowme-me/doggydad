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

需要 Node.js 18.17 或更高版本。

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
- 站点：`https://doggydad.pages.dev`
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

如果绑定自定义域名，设置 `SITE_URL=https://你的域名` 后重新构建并部署，以便 Canonical URL、Sitemap、RSS 和分享信息指向正式域名。

`wrangler.jsonc` 和 `public/_headers` 分别保存 Pages 输出目录与基础安全／缓存响应头。
