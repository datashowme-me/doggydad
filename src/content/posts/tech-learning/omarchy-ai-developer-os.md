---
title: Omarchy 为什么会火：AI 时代，我们还需要一套 Developer OS 吗？
date: 2026-08-24
description: 从 Omarchy 这套 DHH 推动的 Arch + Hyprland 开发环境出发，讨论 AI coding agent 已经能配置环境之后，开发者为什么仍然需要一套 opinionated AI Developer Environment。
keywords: [Omarchy, DHH, Developer OS, AI Developer Environment, Claude Code, Codex, Hyprland, Arch Linux, dotfiles]
tags: [开发环境, AI 工程, Omarchy, Linux, 工具链]
author: DoggyDad
category: tech-learning
sourceUrl: https://omarchy.org/
takeaways:
  - Omarchy 的核心价值不是某个软件，而是一套已经替开发者做完决策的 opinionated developer environment。
  - AI agent 能降低配置成本，但不会天然替你定义“优秀开发环境应该长什么样”。
  - AI 时代真正值得固化的不是某个 OS 或编辑器，而是 Developer + Agent 共同工作的完整系统。
---

最近看了 Omarchy。

它是 DHH 推的一套 Linux 开发环境，基于 Arch Linux，整合了 Hyprland、终端、编辑器、快捷键、主题、开发工具，以及 Claude Code、Codex、Gemini、OpenCode 等 AI agent 工具链。官方站点把它描述成一套面向快速开发工作流的 Arch Linux setup，手册里也明确写到 Omarchy 默认集成 OpenCode 和 Claude Code，并为 Codex、Gemini、GitHub Copilot CLI 等 agent CLI 提供预接入口。

第一眼看上去很酷。

但仔细想一个问题：

现在 Codex、Claude Code 已经能帮我们安装软件、修改配置、生成脚本、维护开发环境了，我们真的还需要 Omarchy 这种“Developer OS”吗？

讨论到最后，我发现真正值得思考的，其实不是 Omarchy，而是一个更大的问题：

**AI 时代，开发环境到底还有多少价值？**

## 一、Omarchy 本质上是什么？

先把神秘感去掉。

Omarchy 并没有发明新的操作系统内核，也没有发明新的窗口管理器、终端或者编辑器。

它的大部分组成部分，本来就存在：

- Arch Linux
- Hyprland
- Terminal
- Neovim
- Git
- 各种 CLI 工具
- Claude Code
- Codex
- Gemini
- OpenCode

所以从技术角度看，有人说：

> Omarchy 不就是 Arch + Hyprland + 一大堆 dotfiles 吗？

这句话不能说错。

但它只看到了实现，没有看到产品。

Omarchy 真正做的事情是：

```text
大量开发工具
    ↓
作者替你筛选
    ↓
确定默认配置
    ↓
统一快捷键
    ↓
统一视觉
    ↓
统一工作流
    ↓
持续维护和升级
    ↓
变成一个可以直接使用的开发环境
```

所以 Omarchy 卖的不是某一个软件。

它卖的是：

**一整套已经替你做完决策的 Developer Environment。**

## 二、为什么这种东西会流行？

Linux 最大的优势一直是自由。

但 Linux 最大的问题，也恰恰是自由。

安装完一个基础 Linux 系统之后，你会面对大量选择：

- 用什么桌面环境？
- GNOME 还是 KDE？
- 要不要 Hyprland？
- Terminal 用哪个？
- Shell 用 bash、zsh 还是 fish？
- 编辑器用 Vim、Neovim、VS Code？
- 怎么管理 Node、Python、Rust？
- 快捷键怎么设计？
- 窗口怎么布局？
- 主题怎么统一？
- 通知、截图、剪贴板、电源管理又怎么处理？

对于喜欢折腾 Linux 的人来说，这些都是乐趣。

但对于大多数开发者来说，这些其实都是成本。

开发者真正想做的是：

```text
打开电脑
→ 打开终端
→ 进入项目
→ 开始工作
```

而不是：

```text
打开电脑
→ 配终端
→ 查插件
→ 修快捷键
→ 调 Hyprland
→ 修 dotfiles
→ Debug 配置
→ 两小时过去了
```

Omarchy 做的事情，就是替你消灭这些选择。

它告诉你：

> 不用选了，这一套我已经替你配好了。

这其实是一个非常经典的产品策略：

**Convention over Configuration。**

也就是 Rails 当年最重要的设计哲学之一：

> 不要让每个开发者重新做一遍相同的决定。

## 三、但 Codex 和 Claude Code 不是已经能配置环境了吗？

这正是有意思的地方。

过去，如果想搭一套开发环境，你可能需要自己写大量配置：

- 安装软件
- 写 shell 配置
- 装语言运行时
- 配置 Neovim
- 配置 tmux
- 写 aliases
- 维护 dotfiles

现在完全可以对 Claude Code 或 Codex 说：

```text
帮我配置一台 Ubuntu 开发机：
- zsh
- mise
- Node
- Python
- Rust
- Docker
- Git
- Neovim
- tmux
- ripgrep
- fd
- fzf
- GitHub CLI
所有配置要求可重复安装，并生成 bootstrap.sh。
```

Agent 很快就能帮你完成。

于是 AI 确实削弱了 Omarchy 的一部分价值。

以前：

```text
配置能力稀缺
→ Omarchy 帮你配置
→ 很有价值
```

现在：

```text
AI 可以帮你配置
→ 配置本身越来越便宜
```

这也是为什么我一开始会产生疑问：

> 既然 AI 都能帮我搞定，我为什么还需要 Omarchy？

## 四、关键区别：AI 能帮你配置，但不会天然替你决定“配成什么”

这是整个问题最重要的一点。

Codex 很擅长回答：

> 帮我安装 Hyprland。

Claude Code 也很擅长回答：

> 帮我配置一个漂亮的终端环境。

但更难的问题其实是：

> 一个优秀的现代开发者工作环境，到底应该长什么样？

这里涉及大量主观判断：

- Terminal-first 还是 GUI-first？
- 是否应该使用 tiling window manager？
- 默认编辑器是什么？
- runtime 怎么管理？
- 项目目录怎么组织？
- 快捷键应该怎么统一？
- Agent 应该怎么启动？
- Skills 放在哪里？
- Context 如何管理？
- 怎么在不同机器上保持一致？
- 怎么升级而不破坏环境？

这些不是单纯的“配置问题”。

这是设计问题。

也是产品决策问题。

AI 可以执行决定。

但前提是：

> 有人先做决定。

Omarchy 的价值就在这里。

DHH 替用户做了大量决定。

你可以不同意他的选择。

但至少他给出了一套完整答案。

## 五、所以大家实际上是在“用配置”吗？

某种程度上，是的。

但更准确地说：

**大家使用的不是配置文件，而是配置背后的决策。**

一个 `.zshrc` 文件本身没有多少价值。

一个 `hyprland.conf` 也没有多少价值。

真正有价值的是：

- 为什么用这个工具？
- 为什么这个快捷键这样设计？
- 为什么这个窗口这样布局？
- 为什么选择这个默认值？
- 这些东西如何组合起来？

所以：

```text
dotfiles ≠ Developer Environment
```

就像：

```text
CSS 文件 ≠ Design System
Ruby 代码 ≠ Rails
React Native 配置 ≠ Expo
```

当一堆配置被：

- 筛选
- 组合
- 设计
- 文档化
- 自动安装
- 持续升级
- 保证兼容

之后，它就开始从“配置”变成“产品”。

这可能才是 Omarchy 真正成功的地方。

## 六、那为什么不直接 Ubuntu + 一套 dotfiles？

完全可以。

而且对于很多开发者，我甚至觉得这可能是更合理的方案。

假设真正需要的工作流只是：

- Terminal
- Claude Code
- Codex
- Docker
- Git
- Node
- Python
- Browser
- SSH

那根本不一定需要 Arch，更不一定需要完整迁移到 Omarchy。

完全可以做：

```text
Ubuntu LTS
+
自己的 Developer Environment
```

例如：

```text
dotfiles/
├── install.sh
├── packages/
│   ├── apt.txt
│   └── brew.txt
├── shell/
│   ├── zshrc
│   └── aliases.zsh
├── terminal/
│   └── ghostty.conf
├── git/
│   └── gitconfig
├── tmux/
│   └── tmux.conf
├── nvim/
├── mise/
│   └── config.toml
├── agents/
│   ├── claude/
│   └── codex/
├── scripts/
│   ├── bootstrap.sh
│   ├── update.sh
│   └── doctor.sh
└── README.md
```

然后只需要三个命令：

```bash
./bootstrap.sh
./update.sh
./doctor.sh
```

其中：

- `bootstrap.sh`：初始化整台开发机
- `update.sh`：统一更新环境
- `doctor.sh`：检查缺失依赖和环境异常

到了这个程度，其实已经拿走了 Omarchy 很大一部分核心价值。

区别只是：

Omarchy 是 DHH 的 opinionated environment。

这套东西是：

**自己的 opinionated environment。**

## 七、AI 时代，真正值得做的可能不是 dotfiles

如果继续往前推一步，会发现 dotfiles 这个概念可能都太小了。

未来真正有价值的可能是一套：

**AI-native Developer Environment。**

它不只是管理：

- shell
- terminal
- editor
- packages

还要管理：

- Agent
- Skills
- Context
- Rules
- Project Instructions
- Automation
- Tool Permissions
- MCP
- Environment

过去的开发环境：

```text
OS
├── Terminal
├── Editor
├── Browser
└── Git
```

未来可能变成：

```text
Developer Environment
├── Terminal
├── Editor
├── Browser
├── Git
├── Claude Code
├── Codex
├── Skills
├── AGENTS.md
├── Project Context
├── MCP
├── Automations
└── Environment Rules
```

这时候，“开发环境”就已经不只是 OS 了。

它开始变成：

**人和 AI Agent 共同工作的运行环境。**

## 八、Omarchy 真正值得观察的地方

所以现在再回头看 Omarchy，我反而不太关心：

> Omarchy 好不好用？

或者：

> 要不要把 Mac 换成 Omarchy？

我更关心的是：

> 为什么在 AI Coding 快速发展的今天，一套强 opinionated 的开发环境反而重新受到欢迎？

可能因为 AI 正在改变软件开发的分工。

以前开发者大量时间花在：

```text
写代码
```

未来 Agent 越来越多地负责：

```text
写代码
改代码
跑测试
查问题
重构
```

那么人的注意力可能会逐渐上移到：

```text
定义问题
设计系统
提供上下文
定义规则
组织 Agent
设计工作流
```

这时候：

> “环境怎么设计”反而重新变得重要。

只是这里的“环境”，已经不再单纯是 Linux Desktop。

它变成：

**Developer + Agent 的整体工作系统。**

## 最后

所以讨论 Omarchy，最后其实不是在讨论 Linux。

也不是讨论 Arch 和 Ubuntu 谁更好。

甚至不是讨论 dotfiles。

真正的问题是：

> AI 已经可以替我们写越来越多代码之后，我们还应该把什么东西固化成自己的工作系统？

我的答案可能是：

不是某一个编辑器。

不是某一个 Agent。

甚至不是某一个 OS。

而是一套属于自己的：

**Opinionated AI Developer Environment。**

Omarchy 只是目前比较醒目的一个样本。

真正值得做的，也许不是复制 Omarchy。

而是开始认真整理：

**自己的开发方式，到底应该被固化成什么。**

## 参考

- [Omarchy 官方网站](https://omarchy.org/)
- [Omarchy Manual: AI](https://learn.omacom.io/2/the-omarchy-manual/107/ai)
- [Omarchy Manual: Development Tools](https://omarchy.org/manual/development-tools/)
