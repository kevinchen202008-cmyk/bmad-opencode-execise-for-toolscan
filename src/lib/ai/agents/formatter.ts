import { ZhipuAI } from "zhipuai";

const aiClient = new ZhipuAI({
  apiKey: process.env.ZHIPU_API_KEY || "",
});

export async function formatReport(
  toolName: string,
  intelligence: string,
  legalOpinion: string,
  alternatives: string,
) {
  const prompt = `
你是合规报告整合员 (Reviewer & JSON Formatter)。你的职责是将其他三位专家分散的文本片段整合为严格的、随时可被系统解析的单一 JSON 格式数据。

这是针对工具 "${toolName}" 的原始审查材料：

<1. 情报研究员的客观数据>
${intelligence}
</1. 情报研究员的客观数据>

<2. 法务专家的风险分析意见>
${legalOpinion}
</2. 法务专家的风险分析意见>

<3. 架构师给出的替代品建议>
${alternatives}
</3. 架构师给出的替代品建议>

请严格根据上述材料（且必须忠实于他们的结论，特别是法务与架构师的分析），输出一个单一的、不包含任何多余字符的 JSON 对象，它必须符合以下精确结构（不要输出数组，只输出对象）：

{
  "name": "${toolName}",
  "version": "根据情报研究员提取的版本号 (提取不到则填 '未知')",
  "license": "根据情报研究员提取的许可协议全称 (如 MIT, Apache 2.0, SSPL, BSL 等)",
  "company": "根据情报研究员提取的归属公司 (提取不到则填 '未知')",
  "usage_restrictions": "综合情报和法务意见提取出的商业使用与托管限制 (约50-100字)",
  "risk_analysis": "直接原封不动复制或稍微润色法务专家的风险分析意见",
  "alternative_solutions": "直接原封不动复制或稍微润色架构师给出的替代品建议"
}

重要：除了这段 JSON 外，请确保不要有任何 Markdown 格式代码块 (不要输出 \`\`\`json)，也不要包含任何额外的文字解释、注释。
`;

  try {
    const response = await aiClient.chat.completions.create({
      model: "glm-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Highly strict and deterministic for JSON parsing
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from formatting GLM");

    // Clean markdown
    const jsonString = content
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    return JSON.parse(jsonString);
  } catch (error) {
    console.error(`Formatter Agent Error for ${toolName}:`, error);
    // Return a fallback object so the UI doesn't crash
    return {
      name: toolName,
      version: "解析错误",
      license: "解析错误",
      company: "未知",
      usage_restrictions: intelligence.substring(0, 100) + "...",
      risk_analysis: "格式化报告生成失败，无法提取法务意见。",
      alternative_solutions: "格式化报告生成失败，无法提取架构师建议。",
    };
  }
}
