"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { FAIRResultOutput, FAIRScenarioInput } from "@/lib/types/api";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  Server,
  TrendingDown,
  Wallet,
  Activity,
  PieChart,
  List,
  ThumbsUp,
  ArrowRight,
  Compass,
  FlaskConical,
  Scale
} from "lucide-react";

const defaultFairScenario: FAIRScenarioInput = {
  scenario_id: "dash_baseline",
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

export default function DashboardPage() {
  const { data: fairData, isLoading: fairLoading, error: fairError } = useQuery({
    queryKey: ["fair_baseline"],
    queryFn: () =>
      fetchApi<FAIRResultOutput>("/api/fair/run", {
        method: "POST",
        body: JSON.stringify(defaultFairScenario),
      }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ["assets_count"],
    queryFn: () => fetchApi<any>("/api/assets/"),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (fairLoading) return <LoadingState message="Running FAIR Monte Carlo simulation..." />;
  if (fairError) return <ErrorState error={fairError as Error} />;
  
  if (!fairData) return <EmptyState title="No Risk Data" description="Unable to load FAIR baseline." />;

  // Derived metrics for UI
  const eal = fairData.eal;
  const p10 = fairData.p10;
  const p50 = fairData.p50;
  const p90 = fairData.p90;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full font-sans text-slate-900 pb-12">
      {/* Page Title & Controls Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Cyber risk exposure, financial impact and investment priorities</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center px-2.5 py-1.5 rounded-lg bg-white border border-border text-sm font-medium shadow-sm tabular-nums">
            <span className="text-slate-500 mr-1 text-xs">Currency:</span> [INR ₹]
          </div>
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F3F2E] hover:bg-[#14533D] text-white text-sm transition-colors shadow-sm font-medium">
            Export Executive Brief
          </button>
        </div>
      </div>

      {/* KPI ROW (5 COMPACT CARDS) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* CARD 1: Expected Annual Loss */}
        <div className="bg-[#0F3F2E] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#14533D] rounded-full opacity-40 blur-xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#bcedd5] tracking-wide uppercase font-semibold">Expected Annual Loss</span>
              <div className="w-7 h-7 rounded-lg bg-[#1a4f3b] flex items-center justify-center text-white">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold tracking-tight text-white tabular-nums">{formatINR(eal)}</span>
            </div>
            <p className="text-xs text-[#bcedd5] opacity-90 mt-0.5">Expected Annual Loss</p>
          </div>
          <div className="relative z-10 mt-4 pt-3 border-t border-[#1b5540] flex items-center justify-between">
             <span className="text-xs text-[#96d3b7]">DemoFin Bank — Baseline Scenario</span>
          </div>
        </div>

        {/* CARD 2: P90 Tail Exposure */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 font-medium">P90 Tail Exposure</span>
              <AlertTriangle className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{formatINR(p90)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">90th percentile annual loss</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
              Severe Capital Stress
            </span>
            <span className="text-xs text-slate-500">10% of modeled outcomes exceed this level.</span>
          </div>
        </div>

                {/* CARD 3: Assets Tracked */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 font-medium">Assets Tracked</span>
              <Server className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {assetsLoading ? "..." : (assetsData?.length || 0)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Discovered critical systems</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
             <Link href="/assets" className="text-xs text-[#0F3F2E] font-semibold hover:underline">View Asset Telemetry →</Link>
          </div>
        </div>

        {/* CARD 4: Risk Reduction Opportunity (Unsupported) */}
        <div className="bg-slate-50 border border-border border-dashed rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <TrendingDown className="w-6 h-6 text-slate-300 mb-2" />
          <span className="text-sm text-slate-500 font-medium">Risk Reduction Opportunity</span>
          <p className="text-xs text-slate-400 mt-1">Run Optimizer to calculate</p>
        </div>

        {/* CARD 5: Targeted Security Investment (Unsupported) */}
        <div className="bg-slate-50 border border-border border-dashed rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <Wallet className="w-6 h-6 text-slate-300 mb-2" />
          <span className="text-sm text-slate-500 font-medium">Targeted Security Investment</span>
          <p className="text-xs text-slate-400 mt-1">Run Optimizer to calculate</p>
        </div>
      </section>

      {/* MAIN GRID ROW 1 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT (8 COLUMNS): Loss Distribution */}
        <div className="lg:col-span-8 bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0F3F2E]"></span>
                <h3 className="text-lg font-semibold text-slate-900">Annual Cyber Loss Distribution</h3>
                <span className="inline-block px-2 py-0.5 rounded bg-[#E8F3EE] text-[#0F3F2E] border border-[#D1E7DD] text-xs font-medium">
                  FAIR Engine
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#0F3F2E]">Backend-calculated FAIR Monte Carlo result</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2 mb-4">
              FAIR annual-loss distribution visualization with modeled percentile markers.
            </p>
            
            {/* Derived SVG Chart */}
            <div className="relative w-full h-56 mt-2">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 200">
                <defs>
                  <linearGradient id="curveGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#0F3F2E" stopOpacity="0.25"></stop>
                    <stop offset="80%" stopColor="#2e6951" stopOpacity="0.06"></stop>
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0"></stop>
                  </linearGradient>
                  <linearGradient id="tailGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#ba1a1a" stopOpacity="0.18"></stop>
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0"></stop>
                  </linearGradient>
                </defs>
                <line stroke="#F1F3F0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="40" y2="40"></line>
                <line stroke="#F1F3F0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="90" y2="90"></line>
                <line stroke="#F1F3F0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="140" y2="140"></line>
                <line stroke="#E2E8E0" strokeWidth="1.5" x1="0" x2="700" y1="190" y2="190"></line>
                <path d="M 520 120 C 560 148, 620 178, 690 188 L 690 190 L 520 190 Z" fill="url(#tailGradient)"></path>
                <path d="M 10 190 C 60 188, 100 150, 140 90 C 175 40, 215 25, 260 38 C 310 52, 380 95, 430 115 C 490 140, 560 165, 690 188 L 690 190 L 10 190 Z" fill="url(#curveGradient)"></path>
                <path d="M 10 190 C 60 188, 100 150, 140 90 C 175 40, 215 25, 260 38 C 310 52, 380 95, 430 115 C 490 140, 560 165, 690 188" fill="none" stroke="#0F3F2E" strokeLinecap="round" strokeWidth="2.5"></path>
                <line stroke="#717974" strokeDasharray="3 3" strokeWidth="1" x1="140" x2="140" y1="90" y2="190"></line>
                <circle cx="140" cy="90" fill="#FFFFFF" r="4" stroke="#717974" strokeWidth="2"></circle>
                <line stroke="#2e6951" strokeDasharray="3 3" strokeWidth="1" x1="270" x2="270" y1="41" y2="190"></line>
                <circle cx="270" cy="41" fill="#FFFFFF" r="4" stroke="#2e6951" strokeWidth="2"></circle>
                <line stroke="#0F3F2E" strokeWidth="2" x1="330" x2="330" y1="62" y2="190"></line>
                <circle cx="330" cy="62" fill="#0F3F2E" r="5" stroke="#ffffff" strokeWidth="2"></circle>
                <line stroke="#B91C1C" strokeDasharray="3 3" strokeWidth="1.5" x1="520" x2="520" y1="120" y2="190"></line>
                <circle cx="520" cy="120" fill="#FFFFFF" r="4" stroke="#B91C1C" strokeWidth="2"></circle>
              </svg>
              
              <div className="absolute left-[20%] top-12 -translate-x-1/2 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 text-[11px] font-semibold text-slate-500 pointer-events-none tabular-nums">
                P10: {formatINR(p10)}
              </div>
              <div className="absolute left-[38%] top-2 -translate-x-1/2 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 text-[11px] font-semibold text-[#2e6951] pointer-events-none tabular-nums">
                P50: {formatINR(p50)}
              </div>
              <div className="absolute left-[47%] top-8 -translate-x-1/2 bg-[#0F3F2E] text-white px-2.5 py-0.5 rounded shadow-sm text-[11px] font-bold pointer-events-none flex items-center gap-1 tabular-nums">
                <span>EAL: {formatINR(eal)}/yr</span>
              </div>
              <div className="absolute left-[74%] top-14 -translate-x-1/2 bg-[#FEF2F2] text-[#B91C1C] px-2 py-0.5 rounded border border-[#FEE2E2] text-[11px] font-bold pointer-events-none tabular-nums">
                P90: {formatINR(p90)}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500">10th Percentile</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{formatINR(p10)}</span>
              <span className="text-[10px] text-slate-500">Favorable operations</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500">Median (P50)</span>
              <span className="text-lg font-bold text-[#2e6951] tabular-nums">{formatINR(p50)}</span>
              <span className="text-[10px] text-slate-500">Baseline probability</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[#0F3F2E] font-semibold">Expected Annual Loss</span>
              <span className="text-lg font-bold text-[#0F3F2E] tabular-nums">{formatINR(eal)}</span>
              <span className="text-[10px] text-[#2e6951]">Actuarial weighted mean</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-red-600 font-semibold">90th Percentile Tail</span>
              <span className="text-lg font-bold text-red-600 tabular-nums">{formatINR(p90)}</span>
              <span className="text-[10px] text-slate-500">Stress reserve needed</span>
            </div>
          </div>
        </div>

        {/* RIGHT (4 COLUMNS): Primary Risk Drivers */}
        <div className="lg:col-span-4 bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#2e6951]" />
                <h3 className="text-lg font-semibold text-slate-900">Primary Risk Drivers</h3>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2 mb-5">
              FAIR factor decomposition identifying mathematical contributors to the modeled expected loss.
            </p>
            
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="font-medium text-slate-900">Vulnerability &amp; Susceptibility</span>
                </div>
                <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                  <span>Derived Mean: {(fairData.susceptibility_mean * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="font-medium text-slate-900">Threat Event Frequency (TEF)</span>
                </div>
                <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                  <span>Derived Mean: {fairData.tef_mean.toLocaleString()} events/yr</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="font-medium text-slate-900">Primary Loss Magnitude</span>
                </div>
                <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                  <span>Derived Mean: {formatINR(fairData.primary_loss_mean)}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="font-medium text-slate-900">Secondary Loss Magnitude</span>
                </div>
                <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                  <span>Derived Mean: {formatINR(fairData.secondary_loss_mean)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-3.5 rounded-xl bg-slate-50 border border-border flex items-start gap-3">
            <div className="text-sm text-slate-900">
              <span className="font-semibold text-[#0F3F2E]">Note:</span> These risk drivers are analytically derived directly from the baseline scenario parameters sent to <code className="text-xs bg-slate-200 px-1 py-0.5 rounded">/api/fair/run</code>.
            </div>
          </div>
        </div>
      </section>

      {/* MAIN GRID ROW 2 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-slate-50 border border-border border-dashed rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <TrendingDown className="w-8 h-8 text-slate-300 mb-2" />
          <h3 className="text-lg font-semibold text-slate-900">Risk Exposure Trend</h3>
          <p className="text-sm text-slate-500 mt-2">12-Month Telemetry is not natively supported by the current API backend.</p>
        </div>
        
        <div className="lg:col-span-6 bg-slate-50 border border-border border-dashed rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <PieChart className="w-8 h-8 text-slate-300 mb-2" />
          <h3 className="text-lg font-semibold text-slate-900">Exposure Distribution by Unit</h3>
          <p className="text-sm text-slate-500 mt-2">Business Unit aggregation is not natively supported by the current API backend.</p>
        </div>
      </section>

      {/* MAIN GRID ROW 3 */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 bg-slate-50 border border-border border-dashed rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <List className="w-8 h-8 text-slate-300 mb-2" />
          <h3 className="text-lg font-semibold text-slate-900">Top Cyber Risks Ledger</h3>
          <p className="text-sm text-slate-500 mt-2">Detailed risk asset breakdown is deferred to the future Risk Explorer endpoint.</p>
          <Link href="/risk-explorer" className="mt-4 px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            Go to Risk Explorer
          </Link>
        </div>
        
        <div className="xl:col-span-5 bg-slate-50 border border-border border-dashed rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <ThumbsUp className="w-8 h-8 text-slate-300 mb-2" />
          <h3 className="text-lg font-semibold text-slate-900">Recommended Investments</h3>
          <p className="text-sm text-slate-500 mt-2">Requires running Optimizer endpoint with explicit mitigations and budget.</p>
          <Link href="/optimizer" className="mt-4 px-4 py-2 bg-[#0F3F2E] rounded-lg text-sm font-medium text-white hover:bg-[#14533D]">
            Open Investment Optimizer
          </Link>
        </div>
      </section>

      {/* BOTTOM EXECUTIVE ACTION STRIP */}
      <footer className="bg-white border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E8F3EE] text-[#0F3F2E] flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Ready to model changes to the capital plan?</div>
            <div className="text-xs text-slate-500">Simulate controls impact or configure regulatory compliance frameworks.</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/risk-explorer" className="px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-900 text-sm transition-colors border border-border flex items-center gap-1.5 font-medium">
            <Compass className="w-4 h-4" />
            <span>Explore Risk Details</span>
          </Link>
          <Link href="/scenarios" className="px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-900 text-sm transition-colors border border-border flex items-center gap-1.5 font-medium">
            <FlaskConical className="w-4 h-4" />
            <span>Run What-if Scenario</span>
          </Link>
          <Link href="/optimizer" className="px-3.5 py-1.5 rounded-lg bg-[#0F3F2E] hover:bg-[#14533D] text-white text-sm transition-colors flex items-center gap-1.5 font-medium shadow-sm">
            <Scale className="w-4 h-4" />
            <span>Optimize Capital Allocation</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
