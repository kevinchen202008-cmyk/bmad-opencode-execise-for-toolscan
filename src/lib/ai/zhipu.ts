import { ZhipuAI } from "zhipuai";
import { fetchWebContext } from "./search";

const aiClient = new ZhipuAI({
  apiKey: process.env.ZHIPU_API_KEY || "",
});

export async function analyzeToolCompliance(toolNames: string[]) {
  // 1. 获取网络上下文增强 RAG (Retrieval-Augmented Generation)
  // 如果工具有很多，我们并行抓取它们的合规相关新闻或 TOS 摘要
  const contextPromises = toolNames.map(async (name) => {
    // 构建高级搜索词以定位许可与合规相关信息
    const query = `"${name}" license terms of service commercial use restrictions`;
    const snippet = await fetchWebContext(query);
    return `[${name} 实时搜索摘要]:\n${snippet || "暂无最新搜索结果。"}`;
  });

  const searchContexts = await Promise.all(contextPromises);
  const combinedContext = searchContexts.join("\n\n");

  // 2. 将搜索到的事实依据喂给 GLM 模型
  const prompt = `
作为企业软件合规专家，请帮我分析以下工具的合规性。
目标工具：${toolNames.join(", ")}

为了保证你的分析不落后于时代（因为许多工具可能在近两年更改了许可协议，例如从开源协议转向 SSPL 或 BSL 等非开源商业协议），我为你提供了最新的搜索引擎抓取摘要作为上下文参考：

<最新搜索引擎摘要 (请优先参考这里的信息以判断工具最新的使用限制)>
${combinedContext}
</最新搜索引擎摘要>

请综合你的内部知识库以及上述【最新搜索引擎摘要】，逐个分析目标工具，并提供合规扫描报告。
你的回答必须是一个严格的 JSON 数组，每个元素包含以下字段：
- "name" (string): 工具名称
- "version" (string): 常见的最新稳定版本
- "license" (string): 使用许可或开源协议
- "company" (string): 所属公司信息
- "usage_restrictions" (string): 商业用户使用限制 (必须指出是否收费，有没有人数/收入限制的豁免条款)
- "risk_analysis" (string): 潜在商业用户不合规的法务/财务风险分析
- "alternative_solutions" (string): 推荐的、无商业限制的纯开源替代方案建议

请确保只输出符合上述格式的纯 JSON 数组，不要包含任何 Markdown 格式代码块 (不要输出 \`\`\`json)，也不要包含任何额外的文字解释。
`;

  try {
    const response = await aiClient.chat.completions.create({
      model: "glm-4", // 如果使用的是支持 tools 的 glm-4-plus, 甚至可以直接调用 web_search tool, 但为保持通用性我们手写了外部搜索
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // 低温保持理性输出
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from GLM");

    // 严防死守模型吐出多余的 Markdown
    const jsonString = content
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error analyzing tools with Zhipu AI:", error);
    throw error;
  }
}
