# WordKey 英语练习

发布域名：`https://learn.wordsmaster.app`。Worker：`wordkey-learn`。
独立目录纳入 DoggyDad 仓库，没有嵌套 Git 或子模块；不覆盖原有 `wordkey` Worker。

## 开发、验证、发布

使用 Node.js 22.22 或更高版本，在本目录运行：

```sh
npm ci
npm run build
npx wrangler d1 migrations apply wordkey-learn-budget --local
npx wrangler dev
npm run lint
npm run test:free-access
npm run test:safety
npx wrangler deploy --dry-run
```

生产发布先执行 `wrangler d1 migrations apply wordkey-learn-budget --remote`，再执行
`npm run deploy`。首次配置密钥通过 `wrangler secret put DEEPSEEK_API_KEY` 的隐藏输入；
不要把密钥放进命令参数、代码、Git 或截图。`.dev.vars` 仅用于本地且已被忽略。
`server.ts` 为保留的旧 Express 实现，不用于生产，也不具备此 Worker 的预算保护。

## AI 费用与服务边界

- 所有功能免费，无会员、兑换码或付费解锁。
- DeepSeek 使用 `deepseek-flash`，禁用思考模式，每次输入最多 12 KB、输出最多 8192 tokens，不自动重试。
- D1 原子预留每次 20 分，月上限 3000 分，即全站每月最多 150 次实际 AI 请求。
  失败或超时也保留预留额，因为上游可能已经计费；不以部署或刷新清零。
- 月份按北京时间计算。达到上限仅暂停 AI，预置词库与基础练习不受影响。
- 这是**保守预算预留，不是实际账单**。2026-10-12 官方 Flash 高峰价：输入 2 元/百万 tokens，
  输出 8 元/百万 tokens；在上述输入输出限制下，单次预留高于估计最大费用。
  价格或模型变化必须重新核对；此保护不覆盖同一密钥在其他应用的消费，也不包含 Cloudflare 费用。
  官方定价：https://api-docs.deepseek.com/zh-cn/quick_start/pricing/
- 紧急停用：将 `AI_ENABLED` 设置为 `false` 并部署。D1 不可用时拒绝 AI，不能绕过预算。
- 匿名 API 每个 IP 每个边缘位置每分钟 6 次；共享网络可能共同受限。
  这不是身份认证或全局精确限速，全站成本由 D1 原子预留兜底。
- 文章正文最多 20,000 字符，每次最多 200 词；在线查词最多 20 个缺失词，AI 最多补全 30 个缺失词。
- URL 抓取只允许 `httpSafety.ts` 列出的 HTTPS 公共站点，逐次校验重定向，最多 1 MB、12 秒。
  其他站点请粘贴正文；这是安全限制，不是付费限制。
- 未查到的音标留空、释义显示“暂无释义”；AI 补全明确标注。通用词典释义不保证是语境中的含义。

预算查询（不包含文章正文或密钥）：

```sh
npx wrangler d1 execute wordkey-learn-budget --remote --command 'SELECT * FROM ai_budget ORDER BY month DESC'
```

## 数据与许可

生词本仍存储在当前浏览器，不提供跨设备同步。正文发送到后端解析，缺失单词及其部分原句
可能发送至 DeepSeek，单词还可能发送至有道查询。不要上传敏感资料。

七份词库与 Qwerty Learner 对应文件比对一致；来源、文件映射、GPL-3.0 许可见
`public/dicts/NOTICE.md` 与 `COPYING.txt`，页面提供访问链接。不宣称是考试机构或 Oxford 官方产品。

## 回滚

主站和学习应用分开发布。使用 `wrangler deployments list` 确定本应用已验证版本，
再用 `wrangler rollback <version-id>` 回滚；不要删除或重置预算数据库。
