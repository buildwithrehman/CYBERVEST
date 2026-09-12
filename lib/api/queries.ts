import { fetchApi } from "./client";
import { FAIRScenarioInput, FAIRResultOutput } from "../types/api";

export const defaultFairScenario: FAIRScenarioInput = {
  scenario_id: "baseline",
  scenario_name: "Annual Baseline Exposure",
  tef: { min_val: 100, likely_val: 14200, max_val: 20000 },
  susceptibility: { min_val: 0.2, likely_val: 0.44, max_val: 0.8 },
  productivity_loss: { min_val: 500000, likely_val: 2000000, max_val: 5000000 },
  response_cost: { min_val: 100000, likely_val: 500000, max_val: 1500000 },
  regulatory_loss: { min_val: 50000, likely_val: 150000, max_val: 2000000 },
  reputation_loss: { min_val: 200000, likely_val: 800000, max_val: 3000000 },
  simulation_count: 10000
};

export async function runFairBaseline() {
  return fetchApi<FAIRResultOutput>("/api/fair/run", {
    method: "POST",
    body: JSON.stringify(defaultFairScenario),
  });
}

export async function getAssetsCount() {
  const assets = await fetchApi<any>("/api/assets/");
  // the API currently returns a dict with status and message, not an array.
  // We'll safely return 0 or an empty array.
  return Array.isArray(assets) ? assets.length : 0;
}
