# SEO / GEO 待办事项

更新时间：2026-08-10

下面这些事项需要外部账号权限、Cloudflare 后台权限，或需要站长本人做策略取舍；因此没有在代码里直接完成。

## 1. Google Search Console

- 添加站点资源：`https://doggydad.pages.dev/`
- 提交 sitemap：`https://doggydad.pages.dev/sitemap-index.xml`
- 检查「网页索引」中的未收录原因。
- 检查「抓取统计信息」里是否存在 4xx、5xx、重定向异常或 robots 拦截。
- 用「网址检查」测试以下关键 URL：
  - `https://doggydad.pages.dev/`
  - `https://doggydad.pages.dev/category/reading-notes/`
  - `https://doggydad.pages.dev/posts/reading-notes/effective-engineer/`
  - `https://doggydad.pages.dev/llms.txt`

## 2. Bing Webmaster Tools

- 添加站点资源：`https://doggydad.pages.dev/`
- 提交 sitemap：`https://doggydad.pages.dev/sitemap-index.xml`
- 检查 Bingbot 抓取错误、索引覆盖、重复标题/描述等提示。

## 3. Cloudflare crawler / bot 访问检查

需要进入 Cloudflare 后台检查最近 7 天和 30 天：

- Security Events
- WAF 规则命中
- Bot / Super Bot Fight Mode
- Rate Limiting
- AI Crawl Control / AI Monitoring（如果当前账号/套餐可用）
- Pages / Workers / Rules / Transform Rules 是否改写 crawler 响应

重点确认这些 crawler 没有被 block、challenge 或 rate-limit：

- Googlebot
- Bingbot
- Applebot
- OAI-SearchBot
- ChatGPT-User
- GPTBot
- ClaudeBot
- PerplexityBot

## 4. AI crawler 策略决策

当前代码层面已明确允许搜索和问答检索型 crawler 抓取公开内容，但训练型 crawler 是否允许，需要站长决定。

建议按用途分层：

| 用途 | 代表 crawler | 建议 |
| --- | --- | --- |
| 搜索索引 | Googlebot, Bingbot, Applebot | 允许 |
| AI 问答检索 / 用户触发访问 | OAI-SearchBot, ChatGPT-User, PerplexityBot | 如果目标是 GEO 曝光，建议允许 |
| 模型训练 / 大规模数据采集 | GPTBot, Google-Extended, CCBot, Bytespider 等 | 需要站长确认是否允许 |
| 异常高频或不守规则 crawler | 不固定 | Cloudflare 里限速或阻断 |

如果决定阻止训练型 crawler，可以在 `src/pages/robots.txt.ts` 中加入对应 `Disallow: /` 规则，并在 Cloudflare AI Crawl Control / WAF 中同步执行。

## 5. GA4 与搜索工具联动

- 确认 GA4 媒体资源 `G-MH2WPDF6VY` 已能收到实时访问。
- 将 Google Search Console 与 GA4 关联。
- 建立基础看板：
  - 自然搜索访问
  - 文章页访问
  - 入口页
  - 平均互动时长
  - 搜索引擎来源

## 6. 自定义域名

当前站点使用 `doggydad.pages.dev`。如果后续有独立域名，建议：

- 将 Astro `SITE_URL` 和 Cloudflare Pages 生产域名切到正式域名。
- 301 从旧域名跳到正式域名。
- 在 GSC / Bing 里重新提交正式域名。
- 检查 canonical、sitemap、RSS、OG URL 是否全部变成正式域名。

## 7. 定期复查

建议每月做一次轻量 SEO/GEO 复查：

- sitemap 是否正常。
- robots.txt 是否被 Cloudflare 托管规则覆盖。
- 关键 crawler 是否出现 403 / 429 / challenge。
- 新文章是否出现在 `/llms.txt`、RSS、sitemap。
- 文章页结构化数据是否没有报错。
