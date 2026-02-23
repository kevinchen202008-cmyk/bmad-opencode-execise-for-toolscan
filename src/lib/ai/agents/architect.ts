import { ZhipuAI } from "zhipuai";

const aiClient = new ZhipuAI({
  apiKey: process.env.ZHIPU_API_KEY || "",
});

export async function findAlternatives(toolName: string, legalOpinion: string) {
  const prompt = `
你是资深开源软件架构师。你接到了法务专家的警告：
关于工具 "${toolName}" 的合规风险分析：
<法务意见>
${legalOpinion}
</法务意见>

根据这个报告，似乎 ${toolName} 目前可能存在一定程度的商业使用限制，例如使用了 BSL、SSPL 等不完全开源的协议。你的任务是根据此评估，推荐 2-3 款在功能上与 "${toolName}" 高度相似的**纯开源替代方案**。这些替代方案必须使用 OSI 认证的宽松或强开源协议（如 MIT, Apache 2.0, BSD 等），确保企业可以免费用于任何商业用途或托管服务。

如果 ${toolName} 本身就是完全开源、极其安全的（如 Nginx、React），你可以说“暂不需要替换，此工具已极其安全”。

你的输出请限制在一段约 100-200 字的建议文字中。必须明确说明替代品名称及其许可协议，不含多余的引导语（如“好的，我的推荐是”等）。
`;

  try {
    const response = await aiClient.chat.completions.create({
      model: "glm-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Allow a bit more creativity in finding alternatives
    });
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error(`Architect Agent Error for ${toolName}:`, error);
    return `架构选型中断：未找到合适的替代方案。`;
  }
}
