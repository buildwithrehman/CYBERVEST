"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { FAIRResultOutput, FAIRScenarioInput } from "@/lib/types/api";
import { LoadingState, ErrorState } from "@/components/ui/States";
import Link from "next/link";
import {
  ShieldAlert,
  Server,
  AlertTriangle,
  Activity,
  Lightbulb,
  Search,
  Calendar,
  Download,
  SlidersHorizontal,
  FileSpreadsheet,
  FileBox,
  
  ArrowRight
} from "lucide-react";

const defaultFairScenario: FAIRScenarioInput = {
  scenario_id: "explorer_baseline",
  scenario_name: "Annual Baseline Exposure",
  tef: { min_val: 100, likely_val: 14200, max_val: 20000 },
  susceptibility: { min_val: 0.2, likely_val: 0.44, max_val: 0.8 },
  productivity_loss: { min_val: 500000, likely_val: 2000000, max_val: 5000000 },
  response_cost: { min_val: 100000, likely_val: 500000, max_val: 1500000 },
  regulatory_loss: { min_val: 50000, likely_val: 150000, max_val: 2000000 },
  reputation_loss: { min_val: 200000, likely_val: 800000, max_val: 3000000 },
  simulation_count: 10000
};

function formatINR(val: number) {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)}Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)}L`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

export default function RiskExplorerPage() {
  const { data: fairData, isLoading: fairLoading, error: fairError } = useQuery({
    queryKey: ["fair_explorer_baseline"],
    queryFn: () =>
      fetchApi<FAIRResultOutput>("/api/fair/run", {
        method: "POST",
        body: JSON.stringify(defaultFairScenario),
      }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: assetsData, isLoading: assetsLoading, error: assetsError } = useQuery({
    queryKey: ["explorer_assets"],
    queryFn: () => fetchApi<any>("/api/assets/"),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (fairLoading || assetsLoading) return <LoadingState message="Loading Risk Explorer..." />;
  if (fairError) return <ErrorState error={fairError as Error} />;
  if (assetsError) return <ErrorState error={assetsError as Error} />;

  // EAL from backend
  const eal = fairData?.eal || 0;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full font-sans text-slate-900 pb-16">
      {/* PAGE HEADER WITH ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Risk Explorer</h1>
          <p className="text-sm text-slate-500 mt-0.5">Trace financial cyber risk from business service to technical exposure</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 rounded-lg border border-border bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50" disabled>
            <SlidersHorizontal className="w-4 h-4" />
            <span>Configure Baselines</span>
          </button>
          <button className="h-10 px-4 rounded-lg bg-[#0F3F2E] text-white hover:bg-[#14533D] text-sm font-medium flex items-center gap-2 shadow transition-colors disabled:opacity-50" disabled>
            <Download className="w-4 h-4" />
            <span>Export CSV / Report</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL EXPECTED ANNUAL LOSS */}
        <div className="bg-[#0F3F2E] text-white rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#bcedd5] font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                TOTAL EXPECTED ANNUAL LOSS
              </span>
            </div>
            <div className="text-3xl font-bold mt-2 tracking-tight text-white tabular-nums">
              {formatINR(eal)}<span className="text-sm font-normal text-[#96d3b7] ml-1">/year</span>
            </div>
          </div>
          <div className="relative z-10 text-xs text-[#96d3b7] mt-3 pt-2 border-t border-white/10">
            Backend-calculated FAIR expected loss
          </div>
        </div>

        {/* Card 2: CRITICAL ASSETS (Unavailable) */}
        <div className="bg-slate-50 border border-border border-dashed rounded-xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <Server className="w-5 h-5 text-slate-300 mb-2" />
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">CRITICAL ASSETS</span>
          <p className="text-sm text-slate-400">Asset telemetry temporarily unavailable</p>
        </div>

        {/* Card 3: HIGH RISK SCENARIOS (Unavailable) */}
        <div className="bg-slate-50 border border-border border-dashed rounded-xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <AlertTriangle className="w-5 h-5 text-slate-300 mb-2" />
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">HIGH RISK SCENARIOS</span>
          <p className="text-sm text-slate-400">Risk records unavailable</p>
        </div>

        {/* Card 4: LARGEST RISK DRIVER (Unavailable) */}
        <div className="bg-slate-50 border border-border border-dashed rounded-xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <Activity className="w-5 h-5 text-slate-300 mb-2" />
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">LARGEST RISK DRIVER</span>
          <p className="text-sm text-slate-400">Risk records unavailable</p>
        </div>
      </div>

      {/* TOP INSIGHT BANNER (Empty State) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-border border-dashed flex items-center justify-center shadow-sm h-24">
        <div className="flex flex-col items-center text-slate-400">
          <Lightbulb className="w-6 h-6 mb-1 opacity-50" />
          <span className="text-sm font-medium">Executive Insights require active risk telemetry</span>
        </div>
      </div>

      {/* COMPACT FILTER BAR */}
      <div className="p-4 bg-white rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5 opacity-60 pointer-events-none">
          <div className="lg:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input disabled className="pl-8 pr-3 py-1.5 h-9 w-full text-sm bg-slate-50 border border-border rounded-lg" placeholder="Search scenario, asset, CVE..." type="text"/>
          </div>
          <select disabled className="h-9 px-2.5 py-1 text-sm bg-slate-50 border border-border rounded-lg text-slate-500">
            <option>All Services</option>
          </select>
          <select disabled className="h-9 px-2.5 py-1 text-sm bg-slate-50 border border-border rounded-lg text-slate-500">
            <option>All Assets</option>
          </select>
          <select disabled className="h-9 px-2.5 py-1 text-sm bg-slate-50 border border-border rounded-lg text-slate-500">
            <option>Criticality: All</option>
          </select>
          <select disabled className="h-9 px-2.5 py-1 text-sm bg-slate-50 border border-border rounded-lg text-slate-500">
            <option>Risk: All</option>
          </select>
          <select disabled className="h-9 px-2.5 py-1 text-sm bg-slate-50 border border-border rounded-lg text-slate-500">
            <option>Frameworks</option>
          </select>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border flex-wrap gap-2">
          <span className="text-xs text-slate-500 italic">Filters are disabled while no backend risk dataset is currently exposed.</span>
        </div>
      </div>

      {/* MAIN SPLIT WORKSPACE: LEDGER + FORENSIC DRAWER */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* MAIN LEDGER CARD */}
        <div className="flex-1 w-full bg-white border border-border rounded-xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Financial Risk Exposure Ledger</h3>
              <p className="text-sm text-slate-500">0 scenarios available</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50">
            <FileBox className="w-12 h-12 mb-4 opacity-50 text-slate-300" />
            <h3 className="font-semibold text-slate-700 mb-2">No Backend Risk Dataset</h3>
            <p className="text-sm text-center max-w-sm">Connect asset/risk telemetry to populate this view with modeled financial exposures and vulnerabilities.</p>
            <Link href="/assets" className="mt-6 px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined">database</span>
              Go to Assets
            </Link>
          </div>
        </div>

        {/* SLIDE-OUT FORENSIC DETAIL DRAWER (Unavailable State) */}
        <div className="w-full xl:w-[460px] bg-slate-50 border border-border border-dashed rounded-xl shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px] shrink-0 text-slate-400 text-center">
          <Activity className="w-10 h-10 mb-4 opacity-30" />
          <h3 className="font-semibold text-slate-600 mb-1">Trace Detail Unavailable</h3>
          <p className="text-sm">Select a valid scenario from the ledger to view the end-to-end risk trace chain and financial distribution.</p>
        </div>
      </div>
    </div>
  );
}
