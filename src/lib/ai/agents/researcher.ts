import { ZhipuAI } from "zhipuai";

const aiClient = new ZhipuAI({
  apiKey: process.env.ZHIPU_API_KEY || "",
});

export async function gatherIntelligence(
  toolName: string,
  searchContext: string,
) {
  const prompt = `
作为资深的开源情报研究员，你的任务是收集和总结关于软件工具 "${toolName}" 的最新许可协议（License）和商业使用限制（TOS）的客观信息。

我为你提供了最新的搜索引擎摘要作为参考：
<搜索引擎摘要>
${searchContext || "暂无最新搜索结果。"}
</搜索引擎摘要>

请结合你的内部知识库和上述摘要，提供一段详实的情报总结，必须包含：
1. 该工具当前的最新主版本号大约是多少？
2. 它目前使用的核心许可协议是什么名称？（例如：MIT, Apache 2.0, BSL, SSPL 等）
3. 它的归属商业公司或开源基金会是谁？
4. 根据摘要或你的知识，该协议是否有任何商业收费限制、用户规模限制或云托管限制？

请直接输出客观的情报总结文本，不需要任何多余的客套话。
`;

  try {
    const response = await aiClient.chat.completions.create({
      model: "glm-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error(`Researcher Agent Error for ${toolName}:`, error);
    return `情报收集中断：无法获取 ${toolName} 的相关协议细节。`;
  }
}
