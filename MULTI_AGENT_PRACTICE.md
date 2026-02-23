# 多 Agent 编程 (Multi-Agent Programming) 实践指南

本项目 (ComplianceOS) 目前采用的是**单 Agent (Single-Agent)** 架构：一个大模型 (GLM-4) 负责同时完成搜索摘要阅读、协议提取、风险分析和替代方案推荐等所有工作。

如果您希望在此项目上实践**多 Agent 编程 (Multi-Agent Programming)**，这是一个极其完美的切入点！合规分析本身就是一个高度复杂、多角色的工作。

## 为什么适合多 Agent？

在真实的法务合规场景中，工作流程通常是：

1. **情报收集员 (Researcher Agent)**：负责去各大官网、GitHub 仓库、新闻网站收集工具的最新 License 变更公告。
2. **法务专家 (Legal Expert Agent)**：精通 OSI 认证的各种开源协议（GPL, MIT, Apache等）以及商业源码协议（BSL, SSPL等），负责解读“情报收集员”找来的条款，判断是否具有“传染性”或“商业收费限制”。
3. **架构师 (Architect Agent)**：负责根据法务专家指出的风险，在开源社区中寻找功能最匹配、协议最宽松的平替方案（如 Redis -> Valkey）。
4. **报告汇总员 (Reviewer/Writer Agent)**：将上述三位专家的意见汇总，格式化为您看到的结构化 JSON 报告。

## 实践路径 (如何在 ComplianceOS 中重构)

如果您想动手实践，您可以按照以下步骤将 `src/lib/ai/zhipu.ts` 重构为多 Agent 协作流：

### 第一步：定义 Agents (角色与 Prompt)

在 `src/lib/ai/agents/` 下创建不同的 Agent 文件：

```typescript
// src/lib/ai/agents/legalExpert.ts
export async function analyzeLicense(toolName: string, rawTerms: string) {
  const prompt = `你是资深法务专家。请阅读以下软件的最终用户许可协议(EULA)或开源协议文本，并简明扼要地告诉我：1. 该协议的准确名称是什么？2. 企业商业使用是否有金额或人数限制？风险在哪？\n文本：${rawTerms}`;
  // 调用 LLM...
}

// src/lib/ai/agents/architect.ts
export async function findAlternatives(
  toolName: string,
  restrictedLicense: string,
) {
  const prompt = `你是开源架构师。${toolName} 目前使用的是 ${restrictedLicense}，对商业不友好。请推荐 2-3 个功能相似且使用宽松协议(如 MIT/Apache 2.0)的纯开源替代方案，并说明理由。`;
  // 调用 LLM...
}
```

### 第二步：编排 Agent 工作流 (Workflow Orchestration)

修改主控文件 `src/lib/ai/zhipu.ts`，让它成为一个“主管 (Manager)”，协调多个 Agent 的执行顺序：

```typescript
// 伪代码演示 Agent 工作流
export async function analyzeToolCompliance(toolNames: string[]) {
  const results = [];

  for (const tool of toolNames) {
    // 1. Researcher Agent: 收集生肉数据
    const searchContext = await fetchWebContext(
      tool + " commercial license terms",
    );

    // 2. Legal Expert Agent: 法务出具风险意见
    const legalOpinion = await legalExpert.analyzeLicense(tool, searchContext);

    // 3. Architect Agent: 寻找替代品
    const techAdvice = await architect.findAlternatives(
      tool,
      legalOpinion.licenseType,
    );

    // 4. Writer Agent: 汇总 JSON
    const finalReport = await writer.formatReport(
      tool,
      legalOpinion,
      techAdvice,
    );

    results.push(finalReport);
  }

  return results;
}
```

## 推荐的 Multi-Agent 框架

如果您想更深入、更工程化地实践多 Agent 协同，不建议全程手写 Prompt 和循环。您可以尝试将以下流行框架引入本项目：

1. **LangChain.js / LangGraph.js**: 业界标杆。LangGraph 特别适合构建状态机驱动的循环多 Agent 流程（比如让法务 Agent 和审查 Agent 互相辩论，直到达成一致再输出）。
2. **Vercel AI SDK**: 极简的 Next.js 原生方案。使用 `generateObject` 结合自定义的 tool call（工具调用），可以让一个 Master Agent 自动决定何时调用 Researcher，何时调用 Architect。
3. **AutoGen (Python为主，也有 Node 移植)**: 微软开源的框架，侧重于 Agent 之间的对话和自动写代码。

## 总结

**绝对可以！** 而且 `ComplianceOS` 拥有清晰的输入输出边界（输入工具名 -> 输出合规报告），是用来学习 `LangGraph` 或原生多 Agent 编排的绝佳靶场。您可以分阶段尝试：先手写串行请求（主管 -> 专家A -> 专家B），再引入状态机管理框架。
