"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { FAIRResultOutput, FAIRScenarioInput, PERTDistribution } from "@/lib/types/api";
import { LoadingState, ErrorState } from "@/components/ui/States";
import {
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  SlidersHorizontal
} from "lucide-react";

function formatINR(val: number) {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)}Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)}L`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

const defaultFairScenario: FAIRScenarioInput = {
  scenario_id: "fair_baseline",
  scenario_name: "DemoFin Bank — Baseline Scenario",
  tef: { min_val: 100, likely_val: 14200, max_val: 20000 },
  susceptibility: { min_val: 0.2, likely_val: 0.44, max_val: 0.8 },
  productivity_loss: { min_val: 500000, likely_val: 2000000, max_val: 5000000 },
  response_cost: { min_val: 100000, likely_val: 500000, max_val: 1500000 },
  regulatory_loss: { min_val: 50000, likely_val: 150000, max_val: 2000000 },
  reputation_loss: { min_val: 200000, likely_val: 800000, max_val: 3000000 },
  simulation_count: 10000
};

export default function ScenariosPage() {
  const [scenarioName, setScenarioName] = useState("Payment API — Security Hardening");
  const [tefAdj, setTefAdj] = useState(0); // percentage -100 to 100
  const [susAdj, setSusAdj] = useState(0);
  const [lmAdj, setLmAdj] = useState(0);

  const baselineQuery = useQuery({
    queryKey: ["fair", "baseline"],
    queryFn: () => fetchApi<FAIRResultOutput>("/api/fair/run", {
      method: "POST",
      body: JSON.stringify(defaultFairScenario),
    }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const scenarioMutation = useMutation({
    mutationFn: (data: FAIRScenarioInput) =>
      fetchApi<FAIRResultOutput>("/api/fair/run", {
        method: "POST",
        body: JSON.stringify(data),
      })
  });

  const applyAdj = (pert: PERTDistribution, adj: number, isProb = false): PERTDistribution => {
    const factor = 1 + (adj / 100);
    const clamp = (val: number) => isProb ? Math.max(0, Math.min(1, val)) : Math.max(0, val);
    return {
      min_val: clamp(pert.min_val * factor),
      likely_val: clamp(pert.likely_val * factor),
      max_val: clamp(pert.max_val * factor),
    };
  };

  const handleRunScenario = () => {
    const scenario: FAIRScenarioInput = {
      ...defaultFairScenario,
      scenario_id: "fair_whatif_" + Date.now(),
      scenario_name: scenarioName,
      tef: applyAdj(defaultFairScenario.tef, tefAdj),
      susceptibility: applyAdj(defaultFairScenario.susceptibility, susAdj, true),
      productivity_loss: applyAdj(defaultFairScenario.productivity_loss, lmAdj),
      response_cost: applyAdj(defaultFairScenario.response_cost, lmAdj),
      regulatory_loss: applyAdj(defaultFairScenario.regulatory_loss, lmAdj),
      reputation_loss: applyAdj(defaultFairScenario.reputation_loss, lmAdj),
    };
    scenarioMutation.mutate(scenario);
  };

  // Helper variables for Risk Comparison
  let ealDiff = 0;
  let isReduction = true;
  let absDiff = 0;
  let pctChange = 0;
  
  if (baselineQuery.data && scenarioMutation.data) {
    ealDiff = baselineQuery.data.eal - scenarioMutation.data.eal;
    isReduction = ealDiff >= 0;
    absDiff = Math.abs(ealDiff);
    pctChange = baselineQuery.data.eal > 0 ? (absDiff / baselineQuery.data.eal) * 100 : 0;
  }

  // Calculate scaling for the percentile visualization bar
  const renderVisualBar = (data: FAIRResultOutput, maxVal: number, colorClass: string) => {
    const scale = (val: number) => (val / maxVal) * 100;
    return (
      <div className="relative w-full h-8 bg-slate-100 rounded border border-slate-200 mt-2">
        <div className={`absolute top-0 bottom-0 ${colorClass} opacity-20`} style={{ left: 0, right: `${100 - scale(data.p90)}%` }}></div>
        <div className={`absolute top-0 bottom-0 ${colorClass} opacity-40`} style={{ left: 0, right: `${100 - scale(data.p50)}%` }}></div>
        
        {/* P10 */}
        <div className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-slate-400" style={{ left: `${scale(data.p10)}%` }} title="P10"></div>
        
        {/* P50 */}
        <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-5 bg-slate-600" style={{ left: `${scale(data.p50)}%` }} title="P50"></div>
        
        {/* EAL */}
        <div className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-6 ${isReduction ? 'bg-amber-500' : 'bg-red-500'} rounded-sm z-10 shadow-sm`} style={{ left: `${scale(data.eal)}%` }} title="EAL"></div>
        
        {/* P90 */}
        <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-5 bg-red-800" style={{ left: `${scale(data.p90)}%` }} title="P90"></div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F3F2E]">What-if Scenario</h1>
          <p className="text-sm text-slate-500">Model how security improvements change financial cyber risk using statistical bounds.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRunScenario}
            disabled={baselineQuery.isLoading || scenarioMutation.isPending}
            className="px-4 h-10 rounded-lg bg-[#0F3F2E] text-white hover:bg-[#14533D] font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {scenarioMutation.isPending ? "Calculating..." : "Run Scenario"}
          </button>
        </div>
      </div>

      {baselineQuery.isLoading && <LoadingState message="Loading Baseline Scenario..." />}
      {baselineQuery.isError && <ErrorState error={baselineQuery.error as Error} />}

      {baselineQuery.data && (
        <>
          {/* KPI ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-xl p-5 ${scenarioMutation.data && !isReduction ? 'bg-[#93000a]' : 'bg-[#0F3F2E]'} text-white flex flex-col justify-between shadow-sm relative overflow-hidden transition-colors`}>
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-white/80">
                  {scenarioMutation.data ? (isReduction ? "Modeled Risk Reduction" : "Modeled Risk Increase") : "Modeled Risk Change"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/90 text-xs">Modeled Estimate</span>
              </div>
              <div className="my-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white tabular-nums">
                    {scenarioMutation.data 
                      ? formatINR(absDiff) 
                      : "—"}
                  </span>
                  <span className="text-sm text-white/80 font-medium">/ year {isReduction ? "saved" : "additional exposure"}</span>
                </div>
                {scenarioMutation.data && (
                  <div className="inline-flex items-center gap-1 mt-2 text-sm text-white/90">
                    {isReduction ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    <span>
                      {pctChange.toFixed(1)}% {isReduction ? "reduction" : "increase"} in Expected Annual Loss
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl p-5 bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-slate-500">Residual Modeled Exposure</span>
              </div>
              <div className="my-4">
                <div className="text-4xl font-bold text-slate-900 tabular-nums">
                  {scenarioMutation.data ? formatINR(scenarioMutation.data.eal) : formatINR(baselineQuery.data.eal)}
                </div>
                <div className="text-sm text-slate-500 mt-2">
                  {scenarioMutation.data ? "Expected Annual Loss after modeled mitigations" : "Baseline Expected Annual Loss"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Controls */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
                  <SlidersHorizontal className="w-5 h-5 text-[#0F3F2E]" />
                  <h2 className="text-lg font-bold text-[#0F3F2E]">Scenario Assumptions</h2>
                </div>

                <div className="flex flex-col gap-2 mb-6">
                  <label className="text-sm font-semibold text-slate-900">Scenario Name</label>
                  <input 
                    type="text" 
                    value={scenarioName} 
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-6">
                  {/* TEF Adjust */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-[#0F3F2E]">Threat Event Frequency (TEF)</span>
                      <span className="text-sm font-bold text-slate-700">{tefAdj > 0 ? '+' : ''}{tefAdj}%</span>
                    </div>
                    <input 
                      type="range" min="-99" max="100" value={tefAdj} onChange={(e) => setTefAdj(Number(e.target.value))}
                      className="w-full accent-[#0F3F2E]"
                    />
                    <div className="text-xs text-slate-500 mt-2">Adjust frequency of threat contact</div>
                  </div>

                  {/* Susceptibility Adjust */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-[#0F3F2E]">Susceptibility</span>
                      <span className="text-sm font-bold text-slate-700">{susAdj > 0 ? '+' : ''}{susAdj}%</span>
                    </div>
                    <input 
                      type="range" min="-99" max="100" value={susAdj} onChange={(e) => setSusAdj(Number(e.target.value))}
                      className="w-full accent-[#0F3F2E]"
                    />
                    <div className="text-xs text-slate-500 mt-2">Adjust probability of loss given a threat event</div>
                  </div>

                  {/* Loss Magnitude Adjust */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-[#0F3F2E]">Loss Magnitude — All Loss Components</span>
                      <span className="text-sm font-bold text-slate-700">{lmAdj > 0 ? '+' : ''}{lmAdj}%</span>
                    </div>
                    <input 
                      type="range" min="-99" max="100" value={lmAdj} onChange={(e) => setLmAdj(Number(e.target.value))}
                      className="w-full accent-[#0F3F2E]"
                    />
                    <div className="text-xs text-slate-500 mt-2">Scenario assumption scaling productivity, response, regulatory, and reputation loss components.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Results */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <h2 className="text-lg font-bold text-[#0F3F2E]">Loss Exposure Comparison</h2>
                  {scenarioMutation.data && (
                    <span className={`px-3 py-1 rounded-full ${isReduction ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} text-xs font-semibold`}>
                      {isReduction ? '-' : '+'}{formatINR(absDiff)} Modeled Delta
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Baseline Card */}
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                        <span className="text-xs uppercase font-bold text-red-800 tracking-wider">DemoFin Baseline</span>
                      </div>
                      <div className="text-xs text-slate-500">Expected Annual Loss</div>
                      <div className="text-2xl font-bold tabular-nums text-red-700 mt-1">{formatINR(baselineQuery.data.eal)}<span className="text-sm font-normal text-slate-500">/yr</span></div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-red-200/50 space-y-2 text-sm text-slate-600 tabular-nums">
                      <div className="flex justify-between"><span>P10 (Low):</span> <strong className="text-slate-900">{formatINR(baselineQuery.data.p10)}</strong></div>
                      <div className="flex justify-between"><span>P50 (Median):</span> <strong className="text-slate-900">{formatINR(baselineQuery.data.p50)}</strong></div>
                      <div className="flex justify-between"><span>P90 (Tail Risk):</span> <strong className="text-red-700">{formatINR(baselineQuery.data.p90)}</strong></div>
                    </div>
                  </div>

                  {/* Scenario Card */}
                  <div className="p-4 rounded-xl border-2 border-[#0F3F2E] bg-emerald-50/50 flex flex-col justify-between opacity-100 transition-opacity">
                    {scenarioMutation.data ? (
                      <>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-[#0F3F2E]"></span>
                            <span className="text-xs uppercase font-bold text-[#0F3F2E] tracking-wider">Scenario Uplifted</span>
                          </div>
                          <div className="text-xs text-slate-500">Expected Annual Loss</div>
                          <div className="text-2xl font-bold tabular-nums text-[#0F3F2E] mt-1">{formatINR(scenarioMutation.data.eal)}<span className="text-sm font-normal text-slate-500">/yr</span></div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-emerald-200 space-y-2 text-sm text-slate-600 tabular-nums">
                          <div className="flex justify-between"><span>P10 (Low):</span> <strong className="text-slate-900">{formatINR(scenarioMutation.data.p10)}</strong></div>
                          <div className="flex justify-between"><span>P50 (Median):</span> <strong className="text-slate-900">{formatINR(scenarioMutation.data.p50)}</strong></div>
                          <div className="flex justify-between"><span>P90 (Tail Risk):</span> <strong className="text-[#0F3F2E]">{formatINR(scenarioMutation.data.p90)}</strong></div>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <ArrowRightLeft className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm font-medium">Run scenario to compare</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* DUAL DISTRIBUTION COMPARISON - TEXTUAL/PERCENTILE BAR (Replaces Fake SVG) */}
              {scenarioMutation.data && (
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#0F3F2E]">Percentile Distribution Comparison</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Backend-returned P10, P50, EAL, and P90 percentile values for Baseline vs Modeled Scenario.</p>
                  
                  {(() => {
                     const maxVal = Math.max(baselineQuery.data.p90, scenarioMutation.data.p90) * 1.1; // Add 10% padding
                     return (
                       <div className="space-y-6">
                         <div>
                           <div className="flex justify-between text-sm mb-1">
                             <span className="font-semibold text-red-700">DemoFin Baseline</span>
                             <span className="text-slate-500 text-xs">P90: {formatINR(baselineQuery.data.p90)}</span>
                           </div>
                           {renderVisualBar(baselineQuery.data, maxVal, 'bg-red-500')}
                         </div>
                         <div>
                           <div className="flex justify-between text-sm mb-1">
                             <span className="font-semibold text-[#0F3F2E]">Modeled Scenario</span>
                             <span className="text-slate-500 text-xs">P90: {formatINR(scenarioMutation.data.p90)}</span>
                           </div>
                           {renderVisualBar(scenarioMutation.data, maxVal, 'bg-emerald-500')}
                         </div>
                         
                         <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-slate-500">
                           <div className="flex items-center gap-1.5"><div className="w-1.5 h-3 bg-slate-400"></div> P10</div>
                           <div className="flex items-center gap-1.5"><div className="w-2 h-4 bg-slate-600"></div> P50 (Median)</div>
                           <div className="flex items-center gap-1.5"><div className="w-2.5 h-4 bg-amber-500 rounded-sm"></div> EAL</div>
                           <div className="flex items-center gap-1.5"><div className="w-2 h-4 bg-red-800"></div> P90 (Tail Risk)</div>
                         </div>
                       </div>
                     );
                  })()}
                  
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
