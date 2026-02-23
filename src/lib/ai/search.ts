import fetch from "node-fetch";
import * as cheerio from "cheerio";

// 这是一个简化的免 Key 搜索引擎聚合 (例如使用 DuckDuckGo 或类似公开接口进行网页摘要获取)
// 由于免费且无 Key 的 Google Search API (如 Custom Search) 都有额度限制且必须配 Key，
// 我们在这里实现一个基于公开 Web 搜索接口的平替方案，或者直接使用 Zhipu 的内置 Web Search 能力 (如果模型支持 tools)。
// 为了保证项目的独立性和免费性，我们在这里实现一个简单的爬虫逻辑来获取相关信息。

export async function fetchWebContext(query: string): Promise<string> {
  try {
    // 使用公开的网页搜索引擎 (DuckDuckGo Lite) 抓取摘要
    const url = `https://lite.duckduckgo.com/lite/`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      body: new URLSearchParams({ q: query }),
    });

    if (!response.ok) {
      console.warn(`Search failed for query: ${query}`);
      return "";
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    let context = "";
    // 提取搜索结果的摘要 (Snippet)
    $("td.result-snippet").each((i, el) => {
      if (i < 3) { // 只取前 3 条结果
        context += $(el).text().trim() + "\n";
      }
    });

    return context;
  } catch (error) {
    console.error("Error fetching web context:", error);
    return "";
  }
}
