# DoggyDad 关键词与内容集群

更新时间：2026-09-19

这份表把现有文章组织成可持续扩展的主题集群。关键词用于确定文章的搜索意图和内部链接方向，不用于在正文中重复堆砌。

## 内容集群

| 集群 | 入口页 | 主要搜索意图 | 现有支持文章 | 下一步选题 |
| --- | --- | --- | --- | --- |
| AI 工程与协议 | `/category/tech-learning/` | 了解 MCP、Agent、Claude Skills 和 AI 工程实践 | MCP 规范、Anthropic MCP、Claude Skills、Agent Engineering、Strands Agents | MCP 实战、Agent 评估、AI Agent 可观测性 |
| 开发者工具与工作流 | `/category/tech-learning/` | 解决命令行、Git、调试工具的具体问题 | Shell 入门、Git 工作流、Chrome DevTools MCP | macOS 开发环境、调试自动化、Git 分支协作 |
| Physical AI 与机器人 | `/category/tech-learning/` | 了解机器人购买、仿真、强化学习和 Sim2Real | Microduck 购买指南 | Microduck policy 部署、MuJoCo 入门、机器人域随机化 |
| 计算机科学人物 | `/category/turing-award/` | 查询人物经历、获奖工作和技术影响 | 现有图灵奖人物系列 | 按主题整理人物：系统、网络、数据库、AI |
| 读书与工程判断 | `/category/reading-notes/` | 寻找读书摘要、工程方法和决策观点 | The Effective Engineer、反脆弱、随机性陷阱 | 工程师读书路线、技术决策案例、书籍比较 |

## 文章级关键词映射

| 文章 | 主关键词 | 搜索意图 | 应链接到 |
| --- | --- | --- | --- |
| `/posts/tech-learning/microduck-china-buying-usage-guide/` | Microduck 中国购买、Physical AI、Sim2Real | 购买和开发准备 | Physical AI 集群入口、MuJoCo、PPO 相关文章 |
| `/posts/tech-learning/mcp-2026-07-28-minus-revolution/` | MCP 2026、MCP 规范变化 | 了解协议更新 | MCP 实战、Agent Engineering |
| `/posts/tech-learning/claude-skills-guide/` | Claude Skills、MCP 对比 | 选择 AI 扩展机制 | MCP、Agent Engineering、工具工作流 |
| `/posts/tech-learning/agent-engineering-new-discipline/` | Agent Engineering、AI Agent 工程 | 建立方法框架 | Claude Skills、Strands Agents、评估与可观测性 |
| `/posts/tech-learning/chrome-devtools-mcp-guide/` | Chrome DevTools MCP | 工具使用教程 | MCP 集群、开发者工具集群 |
| `/posts/reading-notes/effective-engineer/` | The Effective Engineer、工程师效率 | 书籍摘要和行动建议 | 读书入口、Git 工作流、技术学习入口 |

## 发布规则

每篇新文章发布前确认：

1. 有一个明确的主关键词和搜索意图。
2. 标题、描述、首段直接回答读者问题。
3. 至少链接到所属分类、两篇相关文章和作者页。
4. 至少有一个可独立引用的结论、定义、步骤或比较表。
5. 发布后确认已进入 Sitemap、RSS 和 `llms.txt`。

## 每周复盘

从 Search Console 导出有曝光但排名靠后的查询词，优先用于补充标题、首段、FAQ 和内部链接。排名已有点击的文章只做小幅更新，并保留原有 Canonical URL。
