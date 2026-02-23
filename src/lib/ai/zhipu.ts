import { fetchWebContext } from "./search";
import { gatherIntelligence } from "./agents/researcher";
import { provideLegalOpinion } from "./agents/legalExpert";
import { findAlternatives } from "./agents/architect";
import { formatReport } from "./agents/formatter";

export async function analyzeToolCompliance(toolNames: string[]) {
  // 我们针对用户传入的所有工具名并发启动 "Multi-Agent 工作流"
  const workflowPromises = toolNames.map(async (toolName) => {
    try {
      console.log(`[Workflow - ${toolName}] Step 1: 正在检索最新网页资讯...`);
      const query = `"${toolName}" license terms of service commercial use restrictions`;
      const searchContext = await fetchWebContext(query);

      console.log(`[Workflow - ${toolName}] Step 2: 🕵️ Researcher Agent 开始收集情报...`);
      const intelligence = await gatherIntelligence(toolName, searchContext);

      console.log(`[Workflow - ${toolName}] Step 3: ⚖️ Legal Expert Agent 正在分析风险...`);
      const legalOpinion = await provideLegalOpinion(toolName, intelligence);

      console.log(`[Workflow - ${toolName}] Step 4: 🏗️ Architect Agent 正在寻找替代品...`);
      const alternatives = await findAlternatives(toolName, legalOpinion);

      console.log(`[Workflow - ${toolName}] Step 5: 📝 Formatter Agent 正在汇总格式化 JSON 报告...`);
      const finalReport = await formatReport(toolName, intelligence, legalOpinion, alternatives);

      console.log(`[Workflow - ${toolName}] 💯 多 Agent 分析流程结束！`);
      return finalReport;

    } catch (err) {
      console.error(`Workflow Error for ${toolName}:`, err);
      // Fallback
      return {
        name: toolName,
        version: "未知",
        license: "分析出错",
        company: "未知",
        usage_restrictions: "分析过程遇到异常，未能成功执行多 Agent 工作流。",
        risk_analysis: "分析过程遇到异常。",
        alternative_solutions: "分析过程遇到异常。",
      };
    }
  });

  const scanResults = await Promise.all(workflowPromises);
  return scanResults;
}
