"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { ErrorState } from "@/components/ui/States";
import {
  OptimizationRequest,
  OptimizationResponse,
  Mitigation,
  FAIRScenarioInput
} from "@/lib/types/api";
import {
  TrendingUp,
  ShieldAlert,
  Play,
  Percent,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";
import Link from "next/link";

function formatINR(val: number) {
  if (val === undefined || val === null) return "—";
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
  simulation_count: 500
};

const certifiedMitigations: Mitigation[] = [
  {
    id: "mitig_mfa",
    name: "Enterprise MFA (FIDO2 Hardening)",
    description: "Mandatory phishing-resistant keys for API gateway admin tokens",
    category: "Identity",
    cost: 1200000,
    implementation_time: 3,
    risk_reduction_parameters: { tef_multiplier: 1.0, susceptibility_multiplier: 0.6, productivity_loss_multiplier: 1.0, response_cost_multiplier: 1.0, regulatory_loss_multiplier: 1.0, reputation_loss_multiplier: 1.0 },
    status: "proposed"
  },
  {
    id: "mitig_patching",
    name: "Critical CVE Patching (SLA <24h)",
    description: "Automated ingress container vulnerability mitigation & canary deploys",
    category: "Vulnerability Management",
    cost: 800000,
    implementation_time: 1,
    risk_reduction_parameters: { tef_multiplier: 1.0, susceptibility_multiplier: 0.74, productivity_loss_multiplier: 1.0, response_cost_multiplier: 1.0, regulatory_loss_multiplier: 1.0, reputation_loss_multiplier: 1.0 },
    status: "proposed"
  },
  {
    id: "mitig_segmentation",
    name: "Network Micro-Segmentation",
    description: "Strict zero-trust east-west zoning between payment ingress and core DB",
    category: "Network Security",
    cost: 1500000,
    implementation_time: 6,
    risk_reduction_parameters: { tef_multiplier: 0.88, susceptibility_multiplier: 1.0, productivity_loss_multiplier: 1.0, response_cost_multiplier: 1.0, regulatory_loss_multiplier: 1.0, reputation_loss_multiplier: 1.0 },
    status: "proposed"
  },
  {
    id: "mitig_pam",
    name: "Privileged Access Management (PAM)",
    description: "Ephemeral session tokens and dual-authorization key rotation",
    category: "Identity",
    cost: 1100000,
    implementation_time: 4,
    risk_reduction_parameters: { tef_multiplier: 0.9, susceptibility_multiplier: 1.0, productivity_loss_multiplier: 1.0, response_cost_multiplier: 1.0, regulatory_loss_multiplier: 1.0, reputation_loss_multiplier: 1.0 },
    status: "proposed"
  },
  {
    id: "mitig_edr",
    name: "EDR Agent Deployment (Ingress Cluster)",
    description: "Real-time memory anomaly detection on production worker nodes",
    category: "Endpoint Security",
    cost: 1500000,
    implementation_time: 2,
    risk_reduction_parameters: { tef_multiplier: 1.0, susceptibility_multiplier: 1.0, productivity_loss_multiplier: 0.8, response_cost_multiplier: 0.8, regulatory_loss_multiplier: 1.0, reputation_loss_multiplier: 1.0 },
    status: "proposed"
  },
  {
    id: "mitig_backups",
    name: "Immutable WORM Backups",
    description: "Write-Once-Read-Many offline cloud snapshot replication",
    category: "Resilience",
    cost: 900000,
    implementation_time: 2,
    risk_reduction_parameters: { tef_multiplier: 1.0, susceptibility_multiplier: 1.0, productivity_loss_multiplier: 0.7, response_cost_multiplier: 1.0, regulatory_loss_multiplier: 1.0, reputation_loss_multiplier: 1.0 },
    status: "proposed"
  }
];

export default function OptimizerPage() {
  const [budget, setBudget] = useState<number>(10000000);

    const mutation = useMutation({
    mutationFn: (req: OptimizationRequest) =>
      fetchApi<OptimizationResponse>("/api/optimization/run", {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("latest_optimization_result", JSON.stringify(data));
      }
    }
  });

  const handleOptimize = () => {
    mutation.mutate({
      organization_id: "00000000-0000-0000-0000-000000000000",
      budget: budget,
      mitigations: certifiedMitigations,
      baseline_scenario: defaultFairScenario
    });
  };

  const isSelected = (id: string) => {
    if (!mutation.data) return false;
    return mutation.data.selected_mitigations.some(m => m.id === id);
  };

  const ealDiff = mutation.data ? mutation.data.baseline_eal - mutation.data.optimized_eal : 0;
  const isReduction = ealDiff >= 0;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      
      {/* HEADER SECTION */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Investment Optimizer</h1>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 border border-slate-200">
              Synthetic Demonstration
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Allocate a fixed cybersecurity budget to maximize modeled risk reduction using knapsack OR-Tools algorithms.
          </p>
        </div>
        <div className="flex items-center gap-3">
                    <button 
            onClick={handleOptimize}
            disabled={mutation.isPending}
            className="px-5 py-2.5 bg-[#0F3F2E] hover:bg-[#14533D] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{mutation.isPending ? "Running Engine..." : "Run Optimization"}</span>
          </button>
          {mutation.data && (
            <Link href="/optimizer/results" className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
              <FileText className="w-4 h-4" />
              <span>Executive Report</span>
            </Link>
          )}
        </div>
      </section>

      {/* KPI ROW (If Result Exists) */}
      {mutation.data && (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm font-medium">Baseline EAL</span>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-bold text-slate-900 tracking-tight">{formatINR(mutation.data.baseline_eal)}</div>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              Prior Model Simulation
            </div>
          </div>

          <div className="rounded-2xl p-5 flex flex-col justify-between bg-[#0F3F2E] text-white shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between z-10">
              <span className="text-sm font-semibold text-emerald-200">Optimized EAL</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-900/50 text-emerald-100 font-semibold border border-emerald-800">
                {mutation.data.status}
              </span>
            </div>
            <div className="my-2 z-10">
              <div className="text-3xl font-bold tracking-tight text-white">{formatINR(mutation.data.optimized_eal)}</div>
            </div>
            <div className="pt-3 border-t border-emerald-800 flex items-center justify-between text-xs text-emerald-200 z-10">
              <span>Post-Mitigation Exposure</span>
              <span className="font-medium text-white flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Solved
              </span>
            </div>
          </div>

          <div className={`bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between shadow-sm ${!isReduction ? 'border-red-300' : ''}`}>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm font-medium">{isReduction ? "Modeled Risk Reduction" : "Modeled Risk Increase"}</span>
              <ShieldAlert className={`w-5 h-5 ${isReduction ? 'text-emerald-500' : 'text-red-500'}`} />
            </div>
            <div className="my-2">
              <div className={`text-3xl font-bold tracking-tight ${isReduction ? 'text-slate-900' : 'text-red-600'}`}>
                {formatINR(Math.abs(ealDiff))}
              </div>
              <div className="text-sm text-slate-500 mt-1">Annualized Expected Change</div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Primary Financial Delta</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm font-medium">Modeled Risk Reduction</span>
              <Percent className="w-5 h-5 text-slate-400" />
            </div>
            <div className="my-2">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-slate-900 tracking-tight">{mutation.data.percentage_risk_reduction.toFixed(2)}%</div>
                <div className="text-sm font-bold text-[#0F3F2E] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  ROSI: {mutation.data.rosi ? mutation.data.rosi.toFixed(2) + 'x' : 'N/A'}
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-[#0F3F2E] h-2 rounded-full" style={{ width: `${Math.min(100, mutation.data.percentage_risk_reduction)}%` }}></div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[10px] leading-tight text-slate-500 italic">
                ROSI is a modeled demonstration metric based on synthetic FAIR exposure and mitigation assumptions; actual returns depend on organization-specific data and costs.
              </p>
            </div>
          </div>
        
          <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm font-medium">Risk Reduction</span>
              <Percent className="w-5 h-5 text-slate-400" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-bold text-slate-900 tracking-tight">{mutation.data.percentage_risk_reduction.toFixed(2)}%</div>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              Modeled absolute: {formatINR(mutation.data.absolute_risk_reduction)}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm font-medium">Expected ROSI</span>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-bold text-slate-900 tracking-tight">{mutation.data.rosi.toFixed(2)}x</div>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              Return on Security Investment
            </div>
          </div></section>
      )}

      {mutation.isError && (
        <ErrorState error={mutation.error as Error} />
      )}

      {/* WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Budget Allocation */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Security Budget Allocation</h2>
                <p className="text-sm text-slate-500">Adjust available capital envelope for OR-Tools optimization</p>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-500 font-medium">Current Target Budget</span>
                <span className="text-2xl font-bold text-[#0F3F2E]">{formatINR(budget)}</span>
              </div>
              <div className="relative mt-4">
                <input 
                  type="range" 
                  min="2000000" 
                  max="25000000" 
                  step="500000"
                  value={budget} 
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F3F2E]"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>Min ₹20L</span>
                  <span>Max ₹2.5Cr</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              <span className="text-sm text-slate-500 self-center mr-2">Presets:</span>
              <button onClick={() => setBudget(5000000)} className={`px-3 py-1.5 text-sm rounded-md border ${budget === 5000000 ? 'bg-[#0F3F2E] text-white border-[#0F3F2E]' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>₹50L</button>
              <button onClick={() => setBudget(10000000)} className={`px-3 py-1.5 text-sm rounded-md border ${budget === 10000000 ? 'bg-[#0F3F2E] text-white border-[#0F3F2E]' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>₹1Cr</button>
              <button onClick={() => setBudget(15000000)} className={`px-3 py-1.5 text-sm rounded-md border ${budget === 15000000 ? 'bg-[#0F3F2E] text-white border-[#0F3F2E]' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>₹1.5Cr</button>
              <button onClick={() => setBudget(20000000)} className={`px-3 py-1.5 text-sm rounded-md border ${budget === 20000000 ? 'bg-[#0F3F2E] text-white border-[#0F3F2E]' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>₹2Cr</button>
            </div>
          </div>

          {/* Candidate Mitigations */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Available Security Investments</h2>
                <p className="text-sm text-slate-500">Candidate controls available for optimization</p>
              </div>
              {mutation.data && (
                <div className="px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  {mutation.data.selected_mitigations.length} of {certifiedMitigations.length} Selected
                </div>
              )}
            </div>
            
            <div className="mt-5 space-y-3">
              {certifiedMitigations.map(mitig => {
                const selected = isSelected(mitig.id);
                return (
                  <div key={mitig.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors ${selected ? 'border-[#0F3F2E] bg-emerald-50/30' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center border ${selected ? 'border-[#0F3F2E] bg-[#0F3F2E] text-white' : 'border-slate-300'}`}>
                        {selected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{mitig.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{mitig.description}</div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right mt-3 sm:mt-0 pl-8 sm:pl-0 flex-shrink-0">
                      <div className="text-sm font-bold text-slate-900">Cost: {formatINR(mitig.cost)}</div>
                      {selected && (
                        <div className="text-xs text-[#0F3F2E] font-semibold mt-1">Included in Portfolio</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Candidate Controls: {certifiedMitigations.length}</span>
              {mutation.data && (
                <span className="font-semibold text-slate-900">Optimized Subset: {mutation.data.selected_mitigations.length}</span>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          
          {mutation.data ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Optimizer Result</h2>
                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  {mutation.data.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 my-5">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <span className="text-xs text-slate-500">Total Investment</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">{formatINR(mutation.data.total_investment)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <span className="text-xs text-slate-500">Remaining Budget</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">{formatINR(mutation.data.remaining_budget)}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Selected Portfolio Detail</h3>
                {mutation.data.selected_mitigations.length === 0 && (
                  <div className="text-sm text-slate-500 py-2">No investments selected. Budget may be too low.</div>
                )}
                {mutation.data.selected_mitigations.map(sel => (
                  <div key={sel.id} className="p-3 border-l-2 border-[#0F3F2E] bg-slate-50 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-slate-900">{sel.name}</span>
                      <span className="text-xs font-bold text-slate-900">{formatINR(sel.cost)}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{sel.reason_for_selection}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>Optimization results are model-based estimates using the configured FAIR assumptions and candidate investment model.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center h-64 text-slate-400">
              <Play className="w-8 h-8 mb-3 opacity-50" />
              <span className="text-sm font-medium">Run optimization to view results</span>
              <span className="text-xs text-slate-400 mt-2 text-center">Backend knapsack solver will select the optimal portfolio based on your target budget.</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
