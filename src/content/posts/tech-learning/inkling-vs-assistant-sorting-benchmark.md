---
title: Assistant 的对手，开始住进你的 Mac 里了
date: 2026-11-21
description: 在 M4 Mac mini 上用同一提示词测试 Inkling 2 Mini 与 Assistant 实现五种经典排序算法，对比正确性、边界处理、代码质量与生成体验。
keywords: [Inkling 2 Mini, Assistant, Ollama, 本地大模型, 排序算法, Python, 代码生成]
author: DoggyDad
tags: [AI, 本地大模型, Ollama, Python, 算法, 代码评测]
category: tech-learning
takeaways:
  - Inkling 2 Mini 与 Assistant 的五种排序实现均通过本次测试
  - Inkling 的快速排序采用三数取中与三路分区，能更稳健地处理有序和重复输入
  - 两组算法运行时间因输入分布不同，不能作为严格性能排名
---

# Assistant 的对手，开始住进你的 Mac 里了

一个能在 32 GB 内存的 Mac 上离线运行的模型，写基础算法到底靠不靠谱？

我在 M4 Mac mini 上通过 Ollama 运行 Inkling 2 Mini，让它一次性实现冒泡、插入、归并、快速和堆排序，再用同一组正确性测试与 Assistant 的参考实现对照。结果很干脆：两边都是 **5 / 5 通过**。真正拉开体验差距的，不是这道题的正确率，而是生成速度、输出完整性，以及后续解释和修改的效率。

![Inkling 2 Mini 本地模型与在线 Assistant 处理同一组排序任务](/images/posts/tech-learning/inkling-vs-assistant-sorting-benchmark.png)

*配图由 GPT Image 生成。*

> 先说明范围：这是一轮小型、可复现的功能测试，不是完整的模型能力排行榜。它回答的是“两个工具能否按约束正确完成这道排序题”，不能外推为一般编码能力的绝对排名。

## 为什么选择排序算法？

经典排序题不难，却能同时检查几项很实用的代码生成能力：

- 是否准确遵守函数签名和返回值约束；
- 是否处理空列表、负数和重复值；
- 是否避免修改调用者传入的列表；
- 是否理解快速排序在有序数据和大量重复值上的退化风险；
- 是否能一次输出完整、可运行的多函数代码。

换句话说，这组任务更像一轮“基础工程素养体检”，而不是考察模型能否背出五段教科书代码。

## 测试环境

| 项目 | 配置 |
|---|---|
| 设备 | Mac mini |
| 芯片 | Apple M4 |
| 内存 | 32 GB 统一内存 |
| 本地运行方式 | Ollama + Metal |
| 本地模型 | `inkling-2-mini:latest` |

Inkling 2 Mini 是 Thinking Machines Lab 发布的开放权重模型。官方模型卡标注其总参数量为 26.4B，每个 token 的有效激活参数量为 5.4B；单一检查点约 20 GB，并明确支持 32 GB 及以上内存的 Apple silicon 设备本地推理。

## 测试提示词

两边使用相同的核心要求：

```text
只输出最终 Python 代码，不要解释，不要 Markdown，不要思考过程。
实现 5 个函数：bubble_sort、insertion_sort、merge_sort、quick_sort、heap_sort。
每个函数接收 list[int]，不修改输入，返回新列表，支持空列表、负数、重复值。
quick_sort 使用随机或三数取中并用三路分区，避免有序和重复输入退化。
只输出函数代码，不要测试。
```

这里特意把“不修改输入”和“三路分区”写进提示词。前者检查接口契约，后者避免模型交出一个只在普通随机数组上看起来没问题、遇到极端输入就明显退化的快速排序。

## 如何判定正确？

每个函数都与 Python 内置的 `sorted()` 对照，同时确认原列表没有被修改：

```python
original_data = data.copy()

assert algorithm(data) == sorted(data)
assert data == original_data
```

测试集覆盖：

- 空列表与单元素列表；
- 负数和重复值：`[3, -1, 2, 2, 0]`；
- 1,000 个已排序元素；
- 1,000 个逆序元素；
- 1,000 个完全相同的元素；
- 20 组随机整数数组，元素范围为 `[-100, 100]`。

## 正确性结果：双方都是 5 / 5

| 算法 | Inkling 2 Mini | Assistant |
|---|:---:|:---:|
| Bubble Sort | PASS | PASS |
| Insertion Sort | PASS | PASS |
| Merge Sort | PASS | PASS |
| Quick Sort | PASS | PASS |
| Heap Sort | PASS | PASS |
| **总计** | **5 / 5** | **5 / 5** |

这意味着两份实现都满足本次测试的功能要求，也都保留了输入列表。

### Inkling 的快速排序值得单独说

Inkling 生成的快速排序没有使用最简单的“首元素作为 pivot”，而是采用了：

- 三数取中选择 pivot；
- 荷兰国旗式三路分区；
- 单独聚合等于 pivot 的元素。

这些做法与提示词要求一致。对于已排序数组和大量重复值，它比朴素的二路分区更稳健。需要注意的是，三数取中与三路分区只是降低常见退化风险，并没有改变快速排序理论上的最坏时间复杂度。

## 生成体验：正确，但不算快

Inkling 2 Mini 完整生成五个函数耗时约 **73.1 秒**，API 返回 `done_reason = stop`，共生成 1,268 个 token。

第一次运行使用了较小的 token 预算，输出在快速排序中途被截断。提高预算后，模型才完整交付五个函数。这是本地模型使用中很实际的一点：除了模型能力，还要关注输出上限、生成速度和机器资源；“代码思路正确”不等于“一次就能拿到完整文件”。

Assistant 在这轮体验中的优势主要是交付更快，并能立即继续解释复杂度、定位问题和按反馈修改。不过本次记录没有为 Assistant 保存可复核的精确生成耗时，因此这里只做体验描述，不给出速度倍数。

## 算法运行时间：只能做 sanity check

下面的数字是**生成代码的运行时间**，不是模型生成代码的耗时。

### Inkling 生成代码

输入为 5,000 个已排序元素：

```text
bubble_sort     0.0002 s  PASS
insertion_sort  0.0004 s  PASS
merge_sort      0.0051 s  PASS
quick_sort      0.0172 s  PASS
heap_sort       0.0086 s  PASS
```

### Assistant 参考代码

输入为 5,000 个随机元素：

```text
bubble_sort     0.8235 s  PASS
insertion_sort  0.3569 s  PASS
merge_sort      0.0077 s  PASS
quick_sort      0.0062 s  PASS
heap_sort       0.0090 s  PASS
```

**这两组数字不能直接比较。** 冒泡和插入排序在已排序输入上可以接近线性时间，在随机输入上通常是平方级；输入分布的差异足以解释巨大的时间差。当前数据只能证明代码可执行，不能证明 Inkling 的实现一定更快或更慢。

如果要做严格性能比较，至少应该：

1. 固定 Python 版本、进程环境和硬件状态；
2. 为双方使用完全相同的数据，并固定随机种子；
3. 覆盖随机、已排序、逆序和高重复率等多种分布；
4. 预热后多次运行，报告中位数与波动范围；
5. 将代码生成耗时与算法执行耗时分开记录。

## 五种算法的复杂度

| 算法 | 最好 | 平均 | 最坏 | 稳定性 |
|---|---:|---:|---:|---|
| 冒泡排序 | O(n)¹ | O(n²) | O(n²) | 稳定 |
| 插入排序 | O(n) | O(n²) | O(n²) | 稳定 |
| 归并排序 | O(n log n) | O(n log n) | O(n log n) | 稳定 |
| 快速排序 | O(n log n) | O(n log n) | O(n²) | 通常不稳定 |
| 堆排序 | O(n log n) | O(n log n) | O(n log n) | 不稳定 |

¹ 冒泡排序的 O(n) 最好情况要求实现包含“本轮无交换则提前结束”的优化。

## 我从这次测试得到的结论

第一，**Inkling 2 Mini 已经能胜任这类边界明确的基础代码任务**。它不仅交出了五个正确实现，快速排序的策略也符合题目要求。

第二，**本地运行的价值不只在速度**。离线可用、数据留在本机、开放权重以及可控的运行环境，都是实实在在的优势。官方资料也将 Apple silicon 32 GB 以上设备列为支持的本地运行平台。

第三，**交互效率仍然影响日常体验**。本次完整输出耗时约 73 秒，而且第一次因 token 预算不足被截断。对于频繁问答、代码审查和连续迭代，Assistant 的即时反馈更顺手。

所以，我不会把这次结果概括成简单的“谁赢了”：

- 想要本地、离线和隐私友好的代码学习或实验环境，Inkling 2 Mini 很有吸引力；
- 想要快速交付、解释、审查和持续修改，Assistant 更适合作为实时协作者；
- 真正严谨的模型比较，还需要更多题目、重复实验、盲测和统一计时。

## 相关资料

- [Inkling 2 Mini 模型卡](https://thinkingmachines.ai/model-card/inkling-2-mini/)
- [Thinking Machines Lab：Introducing Inkling 2 Mini](https://thinkingmachines.ai/news/inkling-2-mini/)
- [Ollama：Inkling 2 Mini](https://ollama.com/library/inkling-2-mini)

