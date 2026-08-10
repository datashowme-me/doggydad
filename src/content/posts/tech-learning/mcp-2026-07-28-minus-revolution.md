---
title: MCP 2026-07-28：一场精心策划的“减法”革命
date: 2026-08-10
description: 解读 MCP 2026-07-28 规范的核心变化：无状态化、移除协议级 session、server/discover、MRTR、resultType、订阅重做，以及 Roots、Sampling、Logging 等 deprecated 功能的迁移方向。
keywords: [MCP, Model Context Protocol, AI 工程, JSON-RPC, MRTR, server/discover, Streamable HTTP]
tags: [MCP, AI 工程, 协议设计, JSON-RPC]
author: DoggyDad
category: tech-learning
sourceUrl: https://modelcontextprotocol.io/specification/2026-07-28/changelog
takeaways:
  - MCP 2026-07-28 的主线不是“加功能”，而是把核心协议收窄成更清晰的无状态 JSON-RPC。
  - initialize、协议级 session、服务器反向请求等复杂机制被移出核心路径，服务器扩展和调试会更接近普通 HTTP API。
  - 维护 MCP 客户端或服务器时，优先处理 _meta、server/discover、resultType 和 MRTR，再逐步迁移 deprecated 功能。
---

> MCP 协议最新版不只是改了 API——它重新回答了一个根本问题：一个 AI 上下文协议到底应该做多少事？

Model Context Protocol（MCP）在 2026 年 7 月 28 日发布了新版规范。如果你只看 changelog 的长度，会觉得这是一次翻天覆地的更新：9 个 major changes，多项功能进入 deprecated registry，握手没了，协议级 session 没了，ping 没了，旧式 server push 也被 MRTR 改写了。

但这恰恰是一次“做减法”的更新。它没有引入新的复杂性，而是把上一年度积累的过度设计一刀刀削掉。结果是一个更小、更干净、更接近“普通 RPC 协议”的 MCP。

这篇文章不止告诉你**变了什么**，更重要的是解释**为什么变**——以及如果你在维护 MCP 客户端或服务器，**现在该怎么做**。

官方资料可以从这几个入口核对：

- [2026-07-28 Key Changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [2026-07-28 Specification](https://modelcontextprotocol.io/specification/2026-07-28)
- [Deprecated Features Registry](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)

## 1. 旧协议的三个“反模式”

要理解这次改动的动机，我们需要从一个具体场景出发：假设你有一个天气 MCP 服务器，客户端连上去、查天气、偶尔服务器还需要从客户端那里要点额外信息。用 2025-11-25 版协议，这个看似简单的流程会经历这些步骤：

```text
Client                                    Server
  │                                          │
  │──── POST /mcp (initialize) ─────────────→│  ① 握手
  │←─── session_id: "abc123" ────────────── │
  │                                          │
  │──── POST /mcp (notifications/initialized)│  ② 确认握手完成
  │     Mcp-Session-Id: abc123               │
  │                                          │
  │──── POST /mcp (tools/list) ─────────────→│  ③ 发现工具
  │     Mcp-Session-Id: abc123               │
  │←─── [get_weather] ─────────────────────  │
  │                                          │
  │──── POST /mcp (tools/call) ─────────────→│  ④ 调用工具
  │     Mcp-Session-Id: abc123               │
  │     params: {city: "Tokyo"}              │
  │                    ┌─────────────────────│
  │←─── sampling/createMessage ──────────────│  ⑤ 服务器反向问客户端：
  │     "要用哪个温度单位？"                  │     “用摄氏度还是华氏度？”
  │──── 客户端回答“摄氏度” ─────────────────→│
  │                    └─────────────────────│
  │←─── result: "东京 25°C" ───────────────  │
  │                                          │
```

这个流程有三个深层次的设计问题。

### 1.1 有状态的幻觉

注意每次请求都要带 `Mcp-Session-Id: abc123`。这个 session 意味着：

- **服务器必须记住每个连接的上下文**。天气服务器需要维护一个 session 表：`abc123` → 已初始化、已发现工具。
- **列表端点可以 per-session 返回不同结果**。理论上，同一个 `tools/list` 对 session `abc123` 和 `xyz789` 可以返回不同工具列表——这对调试和缓存都是灾难。
- **水平扩展变复杂**。负载均衡器必须做 sticky routing，把同一个 session 的请求路由到同一台服务器。服务器重启后，所有 session 都可能丢失，客户端也要重新握手。

这对于一个“简简单单的天气查询”来说，太过了。

### 1.2 颠倒的调用方向

第⑤步是 2025-11-25 协议里最奇特的设计：**服务器主动向客户端发请求**。

`sampling/createMessage` 允许服务器说：“我需要你（客户端/LLM）帮我做这件事。”这在产品逻辑上能解释——天气服务器确实需要知道温度单位——但**在协议层是个反模式**：

- HTTP 天然是 request-response 的。服务器 push 需要 SSE 长连接或 WebSocket，增加传输层复杂度。
- 服务器和客户端的角色在单次调用中反复翻转，增加实现的心智负担。
- 请求关联复杂：服务器发的 sampling 请求和客户端回的结果之间，并没有一个像普通 RPC 那样干净的一一对应关系。

### 1.3 做太多事的协议

MCP 不只管“怎么调工具”。它还定义过：

- **Roots**：客户端告诉服务器自己的文件系统根目录在哪
- **Sampling**：服务器可以反向调用客户端的 LLM
- **Logging**：服务器如何向客户端发日志
- **Ping**：心跳保活
- **Elicitation**：服务器向用户索要输入

这些功能单独看各有道理，但合在一起让 MCP 越来越像一个“agent 运行时”，而不是“上下文协议”。每个客户端-服务器组合对这些功能的需求完全不同，协议硬性规定反而增加了所有人的兼容性负担。

## 2. 设计哲学：从“AI Runtime”到“纯 RPC”

2026-07-28 版的核心决定可以用一句话概括：

> MCP 就是一个 JSON-RPC 协议。仅此而已。

它不再假装自己是“AI agent 的运行时环境”。它不管你的 agent 怎么调用 LLM、怎么管文件系统、怎么记日志。它只管一件事：**客户端发 JSON-RPC 请求，服务器返回 JSON-RPC 结果**。

这带来了三个根本性变化：

**无状态（Stateless）**。每个请求自包含，不需要前置握手，不需要协议级 session ID。协议版本、客户端能力、客户端身份信息全部在请求的 `_meta` 字段里自报家门。

**单一调用方向**。客户端请求 → 服务器响应。没有反向的 push。需要变化通知时，统一走 optional 的订阅 stream。

**需要更多信息？用 MRTR。** 如果服务器处理请求时需要客户端提供额外信息，不主动往回问，而是返回一个 `resultType: "input_required"` 的中间结果。客户端填好缺失信息后**重试原请求**。控制权始终在客户端手里。

新旧协议的时序对比：

```text
2025-11-25                              2026-07-28

Client          Server                   Client          Server
  │                │                       │                │
  │── init ───────→│                       │── discover ───→│  (optional)
  │←── session ─── │                       │←── versions ── │
  │── initialized─→│                       │                │
  │── tools/list ─→│                       │── tools/call ─→│
  │── tools/call ─→│                       │   _meta: {     │
  │     session ──→│                       │     proto: X,  │
  │                │                       │     caps: {...}│
  │←── sampling ── │  ← 方向反转！          │   }            │
  │── answer ─────→│                       │                │
  │←── result ──── │                       │←── input_req ──│  ← MRTR
                                           │── retry+input─→│
                                           │←── complete ── │
  3 次往返 + 1 次反向调用                   2 次往返，且方向统一
```

## 3. 五大 Breaking Change 详解

### 3.1 无状态化：Initialize 握手消失，`_meta` 登场

**旧方式**：客户端在发任何实际请求之前，必须先走一轮 `initialize` → `notifications/initialized` 握手。握手失败则连接不可用。

**新方式**：握手没了。每个请求在 `_meta` 字段里带上自己的协议版本和能力声明：

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": { "city": "Tokyo" }
  },
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": { "tools": {} },
    "io.modelcontextprotocol/clientInfo": {
      "name": "my-app",
      "version": "1.0"
    }
  }
}
```

如果服务器不支持这个协议版本，直接返回 `UnsupportedProtocolVersionError`（错误码 `-32022`）。不需要等握手超时才发现不兼容。

**收益**：

- 减少一次往返延迟
- 客户端启动即用，不需要等握手完成
- 同一个连接可以发不同协议版本的请求，对升级过渡期有用

### 3.2 Session 消亡：每个请求都是独立的

**旧方式**：服务器维护 session 表，每个 session 有独立上下文。List 端点可以 per-session 返回结果。客户端每次请求必须带 `Mcp-Session-Id` header。

**新方式**：协议级 session 概念被移除。

- `tools/list`、`resources/list`、`prompts/list` 对所有调用者返回相同结果。
- 不再有 session ID 需要跟踪。
- 需要跨调用状态？服务器自己生成 handle，作为普通 tool 参数返回给客户端，客户端下次调用时传回来：

```json
{
  "resultType": "complete",
  "result": {
    "job_id": "xyz-789",
    "status": "processing"
  }
}
```

下一次调用时，客户端把 handle 当参数传回：

```json
{
  "method": "tools/call",
  "params": {
    "name": "check_status",
    "arguments": { "job_id": "xyz-789" }
  }
}
```

**收益**：

- 服务器可以水平扩展，任意实例处理任意请求，不需要 sticky session。
- 服务器重启不影响客户端，无需重新握手。
- 调试更简单：同一次 `tools/list` 对所有请求返回一样的结果。

### 3.3 MRTR：用“我需要更多信息”替代“我主动问你”

这是 2026-07-28 版最重要的架构创新。**Multi Round-Trip Requests（MRTR）** 用一个很巧妙的模式替代了服务器端 push 的场景。

**旧方式**：服务器需要客户端提供信息时，主动发一个反向请求，比如 `roots/list`、`sampling/createMessage`、`elicitation/create`。

**新方式**：服务器返回一个“未完成”的结果，列出自己需要什么。客户端补全信息后**重试原始请求**。

```json
{
  "resultType": "input_required",
  "inputRequests": [
    {
      "id": "unit_preference",
      "description": "请选择温度单位",
      "schema": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"]
      }
    }
  ],
  "requestState": "eyJjaXR5IjoiVG9reW8ifQ=="
}
```

客户端重试原请求，带上答案：

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": { "city": "Tokyo" }
  },
  "inputResponses": {
    "unit_preference": "celsius"
  },
  "requestState": "eyJjaXR5IjoiVG9reW8ifQ=="
}
```

服务器最终返回：

```json
{
  "resultType": "complete",
  "result": {
    "temperature": 25,
    "unit": "celsius"
  }
}
```

**关键设计点**：

- 控制权始终在客户端。客户端决定何时重试、是否重试。
- `requestState` 是一个不透明 token，服务器用它在多次往返之间恢复处理状态。客户端不需要理解它。
- 与 HTTP 的 request-response 模型天然契合，不需要 SSE 长连接。

### 3.4 订阅重做：`subscriptions/listen` 一个流管全部

**旧方式**：多个机制并存：

- HTTP GET 长轮询：获取服务器推送消息
- `resources/subscribe` / `resources/unsubscribe`：订阅特定资源变化
- 请求级别的 `notifications/progress`：同一个 SSE 流上混传进度通知和订阅通知

**新方式**：一个统一的 `subscriptions/listen` 端点。

客户端发一个 POST，在请求 body 里声明自己 opt-in 哪些通知类型：

```json
{
  "method": "subscriptions/listen",
  "params": {
    "subscriptions": [
      "toolsListChanged",
      "promptsListChanged",
      "resourcesListChanged",
      {
        "type": "resourceSubscriptions",
        "uri": "file:///data/report.csv"
      }
    ]
  }
}
```

服务器接受订阅后，在持续的 POST-response stream 上推送通知，每条通知带有 `io.modelcontextprotocol/subscriptionId` 标签。请求级别的通知（如 `notifications/progress`、`notifications/message`）仍然走请求自己的响应流。

这一轮改动里，`ping`、`logging/setLevel`、`notifications/roots/list_changed` 被移出核心路径。Log level 改成通过 `_meta.io.modelcontextprotocol/logLevel` per-request 控制。

### 3.5 `resultType`：所有结果都要声明自己的类型

这是个简单但影响深远的要求。**所有** JSON-RPC 结果对象现在必须包含 `resultType` 字段：

- `"complete"`：普通结果，这是最终回答
- `"input_required"`：中间结果，服务器需要更多信息才能给出最终回答

```json
{
  "resultType": "complete",
  "result": {
    "weather": "sunny"
  }
}
```

或者：

```json
{
  "resultType": "input_required",
  "inputRequests": [],
  "requestState": "..."
}
```

兼容性处理：老服务器返回的结果不带 `resultType`，客户端**必须**把它们当作 `"complete"` 处理。

## 4. Deprecated 功能的“下岗再就业”

以下功能进入 deprecated 状态或被明确给出替代路径。新实现不应该再主动采用，现有实现应该开始迁移。

| 功能 | 为什么调整 | 替代方案 |
| --- | --- | --- |
| **Roots** | 文件系统布局是客户端的事，协议不应该管太深 | 通过 tool 参数、resource URI 或服务器配置传目录 |
| **Sampling** | 服务器不应该反向调用客户端的 LLM | 客户端直接调 LLM provider API |
| **Logging** | 传输层不需要管日志 | stdio 模式写 `stderr`；HTTP 模式用 OpenTelemetry |
| **HTTP+SSE 传输** | 旧传输路径继续收敛 | 迁移到 Streamable HTTP |
| **Dynamic Client Registration** | 注册机制迁移 | 改用 Client ID Metadata Documents |

此外，`includeContext` 的 `"thisServer"` / `"allServers"` 值也进入 deprecated registry，迁移方向是省略该字段或使用 `"none"`。

## 5. 迁移指南

### 5.1 优先级排序

不是所有改动都需要立刻做。可以按优先级推进：

| 优先级 | 改动 | 原因 |
| --- | --- | --- |
| 🔴 P0 | 实现 `_meta` 注入（客户端）/ 解析（服务器） | 不做就无法完整理解新版本请求 |
| 🔴 P0 | 去掉对 `initialize` 的强依赖 | 新协议不再以握手作为前置条件 |
| 🔴 P0 | 实现 `server/discover`（服务器端） | 新版服务器必须宣告版本、能力和身份 |
| 🟡 P1 | 去掉 session ID 管理 | session header 被移除，继续依赖会影响扩展和调试 |
| 🟡 P1 | 实现 MRTR（客户端解析 `input_required`） | 需要额外信息的流程会走新模式 |
| 🟢 P2 | 迁移订阅机制到 `subscriptions/listen` | 旧订阅方式被统一替代 |
| 🟢 P2 | 添加 `resultType` 到所有结果（服务器端） | 新协议结果对象必须声明类型 |
| ⚪ P3 | 迁移 Roots / Sampling / Logging | deprecated 窗口内逐步完成 |
| ⚪ P3 | HTTP+SSE → Streamable HTTP | 旧传输路径继续收敛 |

### 5.2 客户端改造 Checklist

```text
□ 删除对 initialize() / notifications/initialized 的强依赖
□ 在每个请求的 _meta 中注入:
    □ io.modelcontextprotocol/protocolVersion
    □ io.modelcontextprotocol/clientCapabilities
    □ io.modelcontextprotocol/clientInfo（建议）
□ 删除 Mcp-Session-Id header 的生成和追踪
□ 连接后调用 server/discover 做版本协商
□ 处理 resultType 字段:
    □ 解析 "complete" → 正常返回
    □ 解析 "input_required" → 收集 inputResponses，重试原请求
    □ 不存在 → 当作 "complete"
□ 用 subscriptions/listen 替代旧的 resources/subscribe 和 HTTP GET 轮询
□ 删除 ping 相关代码
□ 从 _meta 读 logLevel，替代 logging/setLevel
□ 开始迁移 deprecated 功能（Roots / Sampling / Logging → 替代方案）
```

### 5.3 服务器改造 Checklist

```text
□ 实现 server/discover:
    □ 返回支持的协议版本列表
    □ 返回 ServerCapabilities（含 extensions 字段）
    □ 返回 ServerInfo
□ 从每个请求的 _meta 解析:
    □ protocolVersion → 不匹配返回 UnsupportedProtocolVersionError
    □ clientCapabilities → 按能力调整行为
□ 删除 session 表，列表端点返回固定结果
□ 需要跨请求状态 → 生成不透明 handle，当 tool 参数返回给客户端
□ 用 InputRequiredResult 替代 server push:
    □ 需要客户端数据 → 返回 resultType: "input_required" + inputRequests
    □ 用 requestState 在往返之间恢复处理上下文
□ 实现 subscriptions/listen:
    □ 维护长连接 POST-response stream
    □ 按客户端 opt-in 类型推送通知
    □ 通知带上 io.modelcontextprotocol/subscriptionId
□ 删除 ping、logging/setLevel 实现
□ 从请求 _meta 读 logLevel
□ 列表/读取接口返回 CacheableResult（ttlMs + cacheScope）
□ tools/list 返回确定性顺序
```

### 5.4 短期兼容性策略

过渡期可能需要同时支持新旧两种客户端/服务器：

1. **服务器端**：实现 `server/discover` 的同时，保留旧版 `initialize` 作为 fallback。从 `_meta` 判断客户端版本，旧客户端走旧路径，新客户端走新路径。
2. **客户端端**：先调 `server/discover`。如果服务器不支持，回退到 `initialize` 握手。
3. **List 端点**：服务器可以继续 per-session 返回结果给旧客户端，但对新客户端（通过 `_meta` 识别）返回固定结果。

## 6. 这次改动的意义

MCP 2026-07-28 不是一次功能膨胀，而是一次**范围收窄**。

收窄不好做。尤其在开源社区里，“去掉功能”永远比“加功能”难。有人依赖你砍掉或废弃的每一个 API。但 MCP 的维护者做出了正确的判断：

**一个协议的长期价值不取决于它做了多少，而取决于它做对了什么。**

这次收窄带来的长期收益：

- **更小的协议表面积**：更少的 bug、更好的互操作性。不同 SDK（Python / TypeScript / Go）之间的行为差异，会因为需要实现的东西少了而自然减少。
- **真正的水平扩展**：MCP 服务器现在可以像普通 HTTP API 一样部署在负载均衡器后面。不需要 sticky session、不需要共享 session 存储、重启不丢状态。
- **更清晰的边界**：MCP 管 RPC 调用和工具发现。LLM 调用、文件系统管理、日志——这些是应用层的事，协议不掺和。
- **Extension 机制更重要**：Tasks 扩展（`io.modelcontextprotocol/tasks`）从实验性能力进入官方扩展体系，验证了“核心保持小、能力走扩展”的路线。
- **deprecation 窗口给生态留缓冲**：Roots、Sampling、Logging 等功能不是“一夜消失”，而是进入有明确迁移路径的过渡期。

## 7. 附录

### Breaking Change 速查表

| 变更 | 旧行为 | 新行为 | 影响面 |
| --- | --- | --- | --- |
| 无状态化 | `initialize` → `notifications/initialized` 握手 | 每个请求在 `_meta` 带协议版本和能力 | 客户端 + 服务器 |
| Session 移除 | `Mcp-Session-Id` header，per-session 列表 | 无协议级 session，列表固定，状态通过 handle 传递 | 客户端 + 服务器 |
| `server/discover` | 不存在 | 服务器宣告版本、能力、身份 | 服务器 |
| MRTR | 服务器 push 请求到客户端 | 服务器返回 `input_required`，客户端重试 | 客户端 + 服务器 |
| 订阅重做 | `resources/subscribe` + HTTP GET | `subscriptions/listen` 统一流 | 客户端 + 服务器 |
| `resultType` | 不存在 | 所有结果必须带 `"complete"` 或 `"input_required"` | 客户端 + 服务器 |
| ping 移除 | `ping` RPC 心跳 | 不再作为核心协议能力 | 客户端 + 服务器 |
| logging 重做 | `logging/setLevel` RPC | `_meta.io.modelcontextprotocol/logLevel` per-request | 客户端 + 服务器 |
| SSE 重连移除 | `Last-Event-ID` 断线重连 | 断了重发请求 | 客户端 |

### 相关 SEP

| SEP | 标题 | 涉及变更 |
| --- | --- | --- |
| [SEP-2567](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2567) | Remove protocol-level sessions | Session 移除 |
| [SEP-2575](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2575) | Stateless protocol & subscriptions | 无状态化、discover、订阅重做 |
| [SEP-2322](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2322) | Multi round-trip requests | MRTR、resultType |
| [SEP-2663](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2663) | Tasks extension | Tasks 官方扩展 |
| [SEP-2577](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2577) | Deprecate Roots, Sampling, Logging | 功能 deprecated |
| [SEP-2596](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2596) | Feature lifecycle policy | 生命周期策略 |
| [SEP-2549](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2549) | Cacheable results | ttlMs、cacheScope |
| [SEP-2243](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2243) | MCP request headers | Mcp-Method、Mcp-Name headers |
| [SEP-414](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/414) | OpenTelemetry trace context | traceparent、tracestate |
| [SEP-2106](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2106) | Schema looseness | JSON Schema 2020-12 关键字支持 |
| [SEP-1850](https://github.com/modelcontextprotocol/specification/pull/1850) | SEP workflow | PR 驱动的规范修订流程 |

### 完整变更链接

- [GitHub 完整 diff: 2025-11-25...2026-07-28](https://github.com/modelcontextprotocol/specification/compare/2025-11-25...2026-07-28)
- [2026-07-28 协议规范](https://modelcontextprotocol.io/specification/2026-07-28)
- [Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [Feature Lifecycle 策略](https://modelcontextprotocol.io/community/feature-lifecycle)
- [Deprecated Features Registry](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
