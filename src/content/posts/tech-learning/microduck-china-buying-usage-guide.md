---
title: Microduck：从 GitHub Repo 到中国大陆落地的一份购买与使用指南
date: 2026-08-28
description: 从开源运行时、MuJoCo + PPO 训练链路、硬件配置、开发套件，到中国大陆购买与含锂电池转运，系统梳理 Microduck 适合谁、怎么买、如何从仿真走到真机。
keywords: [Microduck, Pollen Robotics, Physical AI, Embodied AI, MuJoCo, PPO, Sim2Real, ONNX, 机器人, 中国大陆购买]
tags: [Physical AI, Robotics, 强化学习, Sim2Real, 开源项目, 购买指南]
author: DoggyDad
category: tech-learning
sourceUrl: https://github.com/pollen-robotics/microduck
takeaways:
  - Microduck 更值得关注的不是“机器鸭”外形，而是一套从 MuJoCo、PPO、Sim2Real 到真机 ONNX 推理的开发闭环。
  - 中国大陆目前不在官方首发配送范围内，跨境购买的主要不确定性来自预售交付、税费、售后与锂电池运输。
  - 最低风险的路径是先跑通 microduck_rl 仿真与 policy 导出，再决定是否购买真机和 Dev Pack。
---

最近 Pollen Robotics 发布了 Microduck。

它是一只大约 25 厘米高、不到 800 克重的小型双足机器人。它会走路、坐下、踢球、用嘴叼起物体、摔倒后重新站起来，甚至还能换上轮子滑行。

单看演示视频，它很容易被理解成一只可爱的 AI 玩具。

但如果打开它的 GitHub 仓库，会发现 Microduck 真正有意思的地方并不只是“做了一只会走路的鸭子”。

它尝试提供的是一条相对完整的 Physical AI 开发链路：

```text
MuJoCo 仿真
    ↓
PPO 强化学习
    ↓
Domain Randomization / Backlash Simulation
    ↓
Sim2Real
    ↓
ONNX Policy
    ↓
RK3566 板载推理
    ↓
robotd @ 50 Hz
    ↓
15 个电机
    ↓
Physical Microduck
```

对于中国大陆开发者来说，真正的问题因此不只是：

> 这只鸭子好不好玩？

而是：

> 它是不是一个值得购买的 Physical AI 开发平台？如果值得，怎样从 GitHub Repo、仿真训练一路走到中国大陆的真机实验？

本文试着把这条路径讲清楚。

> 本文信息核对时间为 2026 年 8 月 28 日。Microduck 刚刚开放预售，官方称首批交付目标为 2026 年圣诞节前。价格、配送地区、软件成熟度和物流规则都可能继续变化，下单与发货前应再次向 Pollen Robotics、转运商和承运人确认。

## 一、Microduck 到底是什么？

Microduck 是 Pollen Robotics 推出的小型双足机器人。Pollen Robotics 也是 Reachy 系列机器人的开发团队，目前属于 Hugging Face。

官方把它定位为一台面向 Physical AI、强化学习和娱乐的小型机器人。硬件出厂时已经带有训练好的动作，可以直接通过手柄控制；开发者也可以修改仿真环境、重新训练 policy，再部署到真机。

它的公开软件主要分成两个项目：

- [`pollen-robotics/microduck`](https://github.com/pollen-robotics/microduck)：真机运行时、控制、传感器、通信、更新和部署
- [`pollen-robotics/microduck_rl`](https://github.com/pollen-robotics/microduck_rl)：MuJoCo 仿真、PPO、Sim2Real 配置和 ONNX 导出

这两个 Repo 组成了一条从训练到部署的闭环。

其中，真机运行时以 Rust 编写。`robotd` 负责 50Hz 控制循环和电机总线；`updaterd` 负责签名更新、健康检查和失败回滚；`configd` 管理网络与设备身份；`btd`、`padd`、`mediad` 和 `tofd` 分别处理蓝牙、手柄、WebRTC 摄像头流和深度传感器。

这些进程通过 Unix Domain Socket 上的 JSON-RPC 协议通信。控制台、手柄、App 和开发者自己的脚本，最终都可以走同一套调用契约。

这也是 Microduck 最值得观察的地方：

**它不只是机器人硬件，而是一套有明确进程边界、控制循环、模型部署和更新机制的 Robotics Runtime。**

## 二、15 个电机和 policy 的 14 维动作是什么关系？

官方硬件规格写的是 15 个电机，真机总线也确实管理 15 个舵机。

但当前 `microduck_rl` 的核心 locomotion policy 使用 14 个 servo joint 的动作空间，公开路线图中也出现了：

```text
obs[1, 61] → actions[1, 14]
```

简单理解，可以把它看成：

- 机器人硬件共有 15 个电机
- 强化学习 locomotion policy 主要控制 14 个运动关节
- 嘴部等角色化机构可以由运行时和高层技能单独编排

这个区别很重要。写 Physical AI 应用时，不一定需要让一个巨大的端到端模型直接输出所有电机目标。

更合理的结构往往是：

```text
VLM / LLM / VLA
    ↓
High-level Intent
    ↓
walk / sit / kick / grab / recover
    ↓
RL Policy
    ↓
Joint Targets
```

高层模型决定“做什么”，低层 policy 负责“怎样稳定地完成动作”。

## 三、它适合哪些场景？

Microduck 不是工业重载机器人，也不适合安全关键型任务。它更适合低负载、低成本、强调运动、交互和快速试错的场景。

| 场景 | 主要价值 |
|---|---|
| Robotics 教育 | 学习强化学习、Sim2Real、运动控制和机器人软件架构 |
| Physical AI 开发 | 验证 VLM、VLA、Agent 与真实机器人之间的连接方式 |
| Embodied AI 研究 | 低成本实验感知、动作技能、任务规划和多机器人协作 |
| AI 玩具与陪伴 | 结合声音、视觉、动作和角色化设计 |
| IP 与展示机器人 | 体积小、动作表现力强，适合展览和内容创作 |
| 轻量观察节点 | 使用摄像头、ToF、Wi-Fi 和 WebRTC 观察环境 |
| Robot App 平台 | 把 walk、sit、kick、camera 等能力封装成可调用技能 |

Microduck 更值得关注的潜在定位，可能是：

**机器人时代的 Raspberry Pi 式实验平台。**

这并不是说它拥有 Raspberry Pi 那样成熟的生态，而是说它试图降低进入 Physical AI 的门槛：不需要大型实验室，不需要昂贵的全尺寸人形机器人，也能接触仿真、策略训练、真机控制和 Sim2Real。

## 四、真机硬件包括什么？

根据官方商城当前公布的信息，Microduck 的核心配置包括：

| 硬件 | 规格或作用 |
|---|---|
| 主控 | Rockchip RK3566，带 AI 加速能力 |
| 内存 | 1GB RAM |
| 存储 | 32GB |
| 电机 | 15 个，用于全身运动与可动嘴部 |
| IMU | 2 个 |
| 深度传感器 | 8×8 ToF LiDAR |
| 摄像头 | 前置广角摄像头 |
| 音频 | 麦克风与扬声器 |
| NFC | 头部与嘴部共 2 个天线 |
| 网络 | Wi-Fi 与 Bluetooth |
| 电池 | 可拆卸 NP-F550，官方称续航约 1 小时 |
| 控制 | 随机附带游戏手柄 |
| 体积 | 约 25 厘米高、780 克 |

Microduck 本体包装包括机器人、电池、USB-C 线和游戏手柄。

如果目标只是：

```text
连接机器人
→ SSH / robotctl
→ 修改运行时
→ 替换 ONNX policy
→ 调整控制逻辑
```

官方整机已经提供了所需的板载计算和传感器，不需要再购买 Jetson 才能运行 policy。

但需要注意：RK3566 上的 1GB 内存适合运行控制循环、传感器进程和已经导出的模型，并不适合承担大规模 RL 训练，也不应该把它理解成一台能直接运行大型 VLM 的高性能边缘计算机。

## 五、训练仍然需要一台外部电脑

Microduck 的合理分工是：

```text
开发机 / 云端 GPU
        ↓
MuJoCo Warp
        ↓
PPO Training
        ↓
ONNX Export
        ↓
Microduck
        ↓
50Hz Runtime Inference
```

`microduck_rl` 当前基于 mjlab、MuJoCo Warp 和 PPO。官方 Quickstart 要求 CUDA GPU 与 `uv`，并给出了 4096 个并行环境下训练步态的示例。官方称可用步态大约需要 1～2 小时，但实际时间会明显受到 GPU、环境数量、任务和超参数影响。

因此更稳妥的训练环境是：

- Linux 开发机
- NVIDIA GPU
- 可用的 CUDA 环境
- 足够的磁盘空间保存依赖、日志和 checkpoint
- MuJoCo / mjlab 所需的 Python 环境

RTX 2080 Ti 级别的显卡有机会运行这类任务，但官方并没有给出这张卡的保证性能数据。正式购买真机前，最好直接在自己的电脑上运行短 smoke test，再决定是否需要升级 GPU 或使用 Hugging Face Jobs。

官方推荐的基本路径类似：

```bash
git clone https://github.com/pollen-robotics/microduck_rl
cd microduck_rl

# 先做小规模 smoke test
uv run train Mjlab-Velocity-Flat-MicroDuck \
  --env.scene.num-envs 64 \
  --agent.max_iterations 5

# 再启动正式训练
uv run train Mjlab-Velocity-Flat-MicroDuck \
  --env.scene.num-envs 4096
```

训练完成后，可以导出 ONNX，并先在 CPU MuJoCo 中进行部署演练：

```bash
uv run scripts/export.py Mjlab-Velocity-Flat-MicroDuck \
  --wandb-run-path <entity/project/run_id>

uv run scripts/infer_policy.py --walking output.onnx
```

这意味着即使完全没有真机，也可以先完成一大部分学习：

- 跑通官方 simulation
- 理解 observation 与 action
- 修改 reward
- 加入 domain randomization
- 训练自己的 locomotion policy
- 导出并验证 ONNX

## 六、Sim2Real 为什么是核心，而不是附加功能？

在仿真中让机器人走起来并不难。

难的是让同一个 policy 到真实世界里仍然能走。

真实机器人会遇到很多仿真里容易被忽略的问题：

- 电池电压变化
- 电机摩擦与反电动势
- 指令延迟
- 齿轮间隙
- IMU 噪声
- 地面摩擦差异
- 结构件误差
- 摔倒与冲击

Microduck RL 仓库的价值就在于，它没有只给一个漂亮的 MuJoCo 模型，而是公开了 actuator model、domain randomization、backlash simulation，以及一系列从真机失败中积累的 reward 和观测设计经验。

对于研究者来说，这些“为什么仿真能走、真机却失败”的细节，往往比最终那段走路视频更有价值。

## 七、是否应该购买 Dev Pack？

官方目前提供三个相关选项：

- Microduck：机器人、电池、USB-C 线、游戏手柄
- Charger Pack：2 块电池和双槽充电器
- Dev Pack：备用电机、线材、电池、充电器、NFC Tag、工具和 Hugging Face 训练额度

Dev Pack 当前列出的内容包括：

- 3 个备用电机
- 5 根电机线
- 2 块电池
- 1 个双槽充电器
- 10 个 NFC Tag
- Hugging Face Credit
- 1 把螺丝刀
- 1 包备用螺丝

如果只是体验机器人，Microduck 本体就够了。

如果明确准备长期修改 policy、做跌倒恢复、测试不同地面和反复进行 Sim2Real，Dev Pack 的备用电机和线材会很有价值。自定义 policy 可能带来摔倒、碰撞、关节过载和线材松动，机械易损件比增加一个新传感器更实际。

但是对中国大陆买家来说，Dev Pack 还有一个现实问题：

**它额外包含两块可拆卸锂电池。**

这会显著增加跨境运输的复杂度。

## 八、软件开源不等于可以完整自制一台

Pollen Robotics 把 Microduck 描述为 open source。当前公开内容确实包括：

- 真机 SDK 与 Rust Runtime
- MuJoCo 模型与仿真环境
- PPO 训练配置
- Sim2Real 方法
- ONNX policy 部署链路
- 更新、回滚和 IPC 设计文档

但“软件栈公开”和“可以根据完整制造文件复刻硬件”不是一回事。

截至本文核对时，公开资料清楚展示了从 Onshape 导出的 MJCF 模型，但我没有找到一套面向第三方完整复刻的、经过官方承诺的制造包，其中同时包含完整 CAD/STL、生产级 PCB、采购 BOM、装配公差和测试流程。

因此现阶段更稳妥的理解是：

```text
运行时：开放
训练栈：开放
仿真模型：开放
Policy 与 Sim2Real 方法：开放
完整硬件复刻路径：不要默认已经具备
```

它目前并不像一些提供完整 BOM、打印件和装配手册的机器人项目那样，适合直接从零采购零件复刻。

如果目标是运行官方 Repo 和现有 policy，购买官方整机仍然是风险最低的方案。

## 九、中国大陆能不能直接购买？

Microduck 的官方预售价为 399 美元，不含税费与运费。商城会根据地区显示不同币种；最终金额应以结账页面为准。

官方当前列出的首发市场包括：

- 美国与加拿大
- 欧盟与英国
- 挪威与瑞士
- 日本
- 韩国

中国大陆没有出现在首发配送列表中，因此不能默认官方商城可以直接寄送中国大陆地址。

更重要的是，Microduck 目前仍处于预售阶段。官方目标是 2026 年圣诞节前开始首批交付，这意味着购买者还要承担：

- 生产和交付延期
- 软件接口继续变化
- 预售产品早期质量问题
- 跨境售后与退换成本
- 税费和物流方案变化

如果结账页面不接受中国大陆地址，比较现实的候选路线是：

```text
Pollen Robotics 官方商城
        ↓
日本或其他首发地区地址
        ↓
支持含锂设备的合规承运商
        ↓
中国大陆清关
```

但这不是官方承诺的中国大陆购买方案，也不意味着任何日本转运仓都会接收。下单前必须先把商品链接、电池类型、数量、Wh 参数和目的地发给转运商书面确认。

对于学校、实验室或批量采购，官方商城还提供 10 台以上订单的批量报价、支持和进口文件协助。机构用户直接联系官方销售，通常比个人转运更稳妥。

## 十、跨境运输的核心变量是锂电池

Microduck 使用可拆卸 NP-F550 锂离子电池。

航空运输中，电池的运输形态会影响分类：

- 独立运输的锂离子电池通常归入 **UN3480**
- 安装在设备内或与对应设备同箱运输的锂离子电池通常归入 **UN3481**

UN3480 与 UN3481 在包装、标签、文件、荷电状态和承运人接受政策上可能不同。IATA 2026 指南还要求制造商或后续分销商能够提供适用的 UN38.3 测试摘要。

因此，不要简单地认为“NP-F550 很常见，所以可以随普通包裹寄送”。承运人真正关心的是：

- 电池的准确型号和化学体系
- 单块电池的 Wh 容量
- 电池数量
- 是装在设备内、与设备同箱，还是单独运输
- UN38.3 测试摘要是否可获得
- 包装、标签和荷电状态是否符合当期规则
- 承运人及具体线路是否接受

更稳妥的做法是：

1. 下单前向 Pollen Robotics 索取随附电池的型号、Wh 和 UN38.3 信息。
2. 把完整信息提交给日本转运商或 DHL/FedEx 危险品渠道确认。
3. 不要隐瞒电池，也不要自行填写不确定的 UN 编号。
4. 优先让有资质的承运人决定电池应该安装、同箱还是拆分运输。
5. 确认中国大陆目的地的清关资料、税费和收件人要求。

“保留一块电池装机、把额外电池去掉”有时可以降低运输复杂度，但并不是所有承运人和线路都接受同一种方案。最终分类和包装必须由实际承运人确认。

这也是 Dev Pack 反而更麻烦的原因：两块额外电池可能使包裹从单一含锂设备，变成同时包含设备与多块备用电池的更复杂货件。

对首次购买者，一个更保守的策略是：

```text
先购买 Microduck 本体
        ↓
确认官方电池文件和可用线路
        ↓
完成首台设备运输与清关
        ↓
再决定是否购买 Dev Pack
```

不要先假设国内购买的任意 NP-F550 都能兼容。除了电压与接口，还需要核对物理尺寸、放电能力、保护电路和固件检测要求。

## 十一、最推荐的购买与使用路径

如果目标是研究 Physical AI，而不是收藏一只机器鸭，最合理的路线不是立刻下单。

### Phase 1：零硬件投入

先运行：

```text
microduck_rl
+ MuJoCo
+ PPO
```

目标包括：

- 跑通官方仿真
- 完成小规模 smoke test
- 理解 61 维 observation 和 policy action
- 修改一个 reward
- 训练一个 locomotion policy
- 导出 ONNX
- 在 CPU MuJoCo 中完成 inference rehearsal

完成这一步，可以验证自己真正感兴趣的是机器人开发，而不只是发布视频里的可爱外形。

### Phase 2：评估购买条件

在付款前确认：

- 官方预计交付时间
- 收货国家和地址
- 最终税费与运费
- 电池型号、Wh 和 UN38.3 文件
- 转运商是否书面接受
- 故障后的退换与维修路径

### Phase 3：购买真机并跑通官方栈

真机到手后，不要第一天就部署自己训练的激进 policy。

先完成：

- 官方动作与手柄测试
- `robotctl` 健康检查
- 网络、蓝牙和摄像头验证
- OTA 更新与回滚测试
- 官方 policy 的日志和观测记录

建立可靠基线之后，再替换自己的 ONNX。

### Phase 4：进入 Sim2Real

接下来重点研究：

- actuator mismatch
- battery voltage 与 voltage sag
- friction randomization
- backlash
- IMU noise
- command latency
- fall recovery
- policy stability

每次只修改少量变量，并始终保留可回滚的官方 policy。

### Phase 5：加入高层 AI

当基础动作稳定后，可以继续叠加：

```text
Camera / ToF / Audio
        ↓
VLM / VLA / LLM Agent
        ↓
High-level Planner
        ↓
Motion Skill
        ↓
RL Policy
        ↓
Microduck
```

例如把动作能力封装成：

```text
walk_forward()
turn_left()
look_at_person()
sit()
kick()
grab()
recover()
celebrate()
```

高层 Agent 负责理解场景与规划任务，低层 policy 负责稳定、实时和安全地控制身体。

这比让 LLM 直接输出每个舵机的位置更符合当前机器人系统的工程现实。

## 十二、最终建议

如果只是想判断 Microduck 值不值得买，我的建议仍然是：

**先别急着买。**

先在现有 GPU 或 Hugging Face Jobs 上跑通：

```text
官方 simulation
→ 小规模训练
→ 修改 reward
→ 自己训练
→ 导出 ONNX
→ 仿真推理验证
```

如果完成这些步骤后仍然觉得有意思，再购买真机。

这样买到的就不只是一只“会走路的玩具”，而是一台可以持续用于：

- Reinforcement Learning
- Sim2Real
- Embodied AI
- VLA
- Robotics Runtime
- Physical AI Agent

实验的小型平台。

Microduck 真正值得研究的地方，也不只是它的机械结构。

它更像是在尝试回答一个更大的问题：

> 未来 AI 开发者，能不能像今天开发 Web 和 App 一样，以足够低的成本开发、测试、发布和分享 Physical AI？

Microduck 还很早，软件和交付都在快速变化，生态也远未成熟。

但它提供的这条路径——从 MuJoCo 到 PPO，从 ONNX 到 50Hz 真机控制，从模型更新到失败回滚——已经比“买一只会动的机器人”更值得关注。

## 参考资料

- [Microduck 官方 GitHub Repo](https://github.com/pollen-robotics/microduck)
- [Microduck RL 训练项目](https://github.com/pollen-robotics/microduck_rl)
- [Microduck 官方介绍](https://pollen-robotics.com/microduck/)
- [Pollen Robotics：Meet Microduck](https://pollen-robotics.com/microduck/blog/introducing-microduck/)
- [Microduck 官方商城](https://store.pollen-robotics.com/products/microduck)
- [Microduck Dev Pack](https://store.pollen-robotics.com/products/dev-pack)
- [IATA 2026 Lithium Battery Guidance Document](https://www.iata.org/contentassets/05e6d8742b0047259bf3a700bc9d42b9/lithium-battery-guidance-document.pdf)
