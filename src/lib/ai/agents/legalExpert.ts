import { ZhipuAI } from "zhipuai";

const aiClient = new ZhipuAI({
  apiKey: process.env.ZHIPU_API_KEY || "",
});

export async function provideLegalOpinion(
  toolName: string,
  intelligence: string,
) {
  const prompt = `
你是企业高级法务与开源合规专家。你的职责是阅读“开源情报研究员”提供的客观事实，并给出一份严肃的法务与财务风险评估意见。

这是研究员关于工具 "${toolName}" 的调查报告：
<研究员情报报告>
${intelligence}
</研究员情报报告>

请基于这份情报，撰写一段约 100-200 字的风险分析报告（risk_analysis）。你需要非常明确地回答：
1. 这个协议对企业商用是否友好？
2. 如果企业未经授权在生产环境使用了这款工具，可能会面临哪些具体的法务纠纷（如侵权诉讼）或财务损失（如高额补缴授权费或按收入分成）？
3. 该协议是否存在传染性或开源衍生品限制？

你的输出必须仅仅是一段连贯的专业分析段落，不要包含项目符号列表，也不要包含诸如“分析如下”、“你好”等任何寒暄用语。
`;

  try {
    const response = await aiClient.chat.completions.create({
      model: "glm-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Legal advice should be highly deterministic
    });
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error(`Legal Expert Agent Error for ${toolName}:`, error);
    return `法务评估中断：无法提供有效的合规风险分析。`;
  }
}
