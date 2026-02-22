import { ZhipuAI } from "zhipuai";

const aiClient = new ZhipuAI({
  apiKey: process.env.ZHIPU_API_KEY || "",
});

export async function analyzeToolCompliance(toolNames: string[]) {
  const prompt = `
作为企业软件合规专家，请帮我分析以下工具的合规性。
目标工具：${toolNames.join(", ")}

请根据你内部所掌握的官网服务条款 (TOS) 知识，逐个分析以上工具，并提供合规扫描报告。
你的回答必须是一个严格的 JSON 数组，每个元素包含以下字段：
- "name" (string): 工具名称
- "version" (string): 常见的最新稳定版本
- "license" (string): 使用许可或开源协议
- "company" (string): 所属公司信息
- "usage_restrictions" (string): 商业用户使用限制
- "risk_analysis" (string): 潜在商业用户不合规的风险分析
- "alternative_solutions" (string): 推荐的开源替代方案建议

请确保只输出符合上述格式的纯 JSON 数组，不要包含任何 Markdown 格式代码块 (不要输出 \`\`\`json)，也不要包含任何额外的文字解释。
`;

  try {
    const response = await aiClient.chat.completions.create({
      model: "glm-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from GLM");

    // Defensive parsing: try to strip markdown if the model disobeys instructions
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
