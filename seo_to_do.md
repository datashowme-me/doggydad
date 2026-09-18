# DoggyDad SEO / GEO 实施计划

更新时间：2026-09-18

目标：让 `https://wordsmaster.app/` 能被搜索引擎稳定抓取、理解和收录，同时为 AI 搜索提供清晰、可引用的页面内容。

## 已完成（代码与部署）

- 正式站点统一使用 `wordsmaster.app` 作为 `SITE_URL`、canonical、RSS、sitemap、robots.txt 和 `llms.txt` 的来源。
- Cloudflare Pages 项目 `doggydad` 已绑定 `wordsmaster.app` 与 `www.wordsmaster.app`。
- `robots.txt`、`sitemap-index.xml`、RSS 和 `llms.txt` 已上线。
- 文章页包含 WebPage、BlogPosting、BreadcrumbList，以及书评、人物 ProfilePage 等扩展结构化数据。
- 首页和分类页补充 CollectionPage + ItemList，帮助搜索引擎理解内容集合和文章层级。
- 文章页补充 `rel="prev"` / `rel="next"`、作者和更新时间元数据。
- 文章页具备面包屑、目录、相关文章、相邻文章和作者介绍等内部链接入口。

## 阶段一：索引基础（上线后立即执行）

### Google Search Console

1. 添加网址资源：`https://wordsmaster.app/`
2. 提交：`https://wordsmaster.app/sitemap-index.xml`
3. 用网址检查测试首页、四个分类页、至少三篇文章和 `/llms.txt`。
4. 记录未收录原因、抓取错误和重复 canonical 页面。

### Bing Webmaster Tools

1. 添加 `https://wordsmaster.app/`。
2. 提交同一个 sitemap。
3. 检查 Bingbot 的抓取错误和索引覆盖。

### 验证地址

```text
https://wordsmaster.app/robots.txt
https://wordsmaster.app/sitemap-index.xml
https://wordsmaster.app/rss.xml
https://wordsmaster.app/llms.txt
```

## 阶段二：内容和网站结构（第一周）

- 建立关键词表：关键词、搜索意图、目标 URL、文章状态、内部链接目标。
- 优先覆盖低竞争、明确意图的长尾词，不为追求搜索量堆砌标题。
- 每个主题建立内容集群：一个主题入口页 + 3 至 8 篇支持文章。
- 新文章必须填写标题、描述、日期、分类、标签和作者。
- 每篇文章至少链接到一个分类页、两篇相关文章和作者页。
- 每篇新文章发布后确认已进入 RSS、sitemap 和 `llms.txt`。

## 阶段三：Cloudflare 与 AI 可见性（第一周）

在 Cloudflare 后台检查最近 7 天和 30 天：

- Security Events、WAF、Bot 管理、Rate Limiting。
- AI Crawl Control / AI Monitoring（若账号提供）。
- Workers、Redirect Rules、Transform Rules 和缓存规则。

确认 Googlebot、Bingbot、Applebot、OAI-SearchBot、ChatGPT-User、ClaudeBot、PerplexityBot 没有被 block、challenge 或 rate-limit。

当前 robots 策略允许搜索和 AI 问答检索型 crawler。`GPTBot`、`Google-Extended`、`CCBot`、`Bytespider` 等训练型 crawler 是否允许，保留为站长决策，不在没有明确授权的情况下自动放开。

## 阶段四：权威与分发（第 2 至 4 周）

- 统一 GitHub、X、LinkedIn 的作者名称、简介和 DoggyDad 链接。
- 在 GitHub README、项目页和个人主页之间建立互链。
- 将原创文章分发到技术社区时使用正式 canonical URL。
- 优先争取能带来真实读者的引用和链接，不购买批量低质量外链。

## 阶段五：数据复盘（每周 / 每月）

每周检查：

- GSC 点击、曝光、平均排名和新增收录页面。
- GA4 自然搜索访问、入口页、互动时长和文章阅读路径。
- Cloudflare 边缘返回的 crawler 状态码、挑战和缓存命中。

每月复查：

- sitemap、robots、RSS、llms.txt 是否正常。
- canonical、结构化数据和内部链接是否出现回归。
- 新文章是否进入目标主题集群。
- AI 搜索是否开始引用 DoggyDad 的文章。

## 需要外部账号操作的项目

- Google Search Console 验证和 sitemap 提交。
- Bing Webmaster Tools 验证和 sitemap 提交。
- GA4 与 Search Console 关联。
- Cloudflare crawler / WAF / AI Crawl Control 检查。
- 训练型 AI crawler 的允许或阻止策略决策。

这些项目不能通过仓库代码安全代替，需要在对应账号中完成并记录结果。
