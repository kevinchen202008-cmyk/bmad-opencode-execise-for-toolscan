import { analyzeToolCompliance } from "./zhipu";

async function main() {
  const result = await analyzeToolCompliance(["Docker Desktop", "Redis"]);
  console.log(JSON.stringify(result, null, 2));
}
main();
