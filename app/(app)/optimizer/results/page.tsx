"use client";

import React, { useEffect, useState } from "react";
import { OptimizationResponse } from "@/lib/types/api";
import { ArrowLeft, CheckCircle2, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function OptimizerResultsPage() {
  const [result, setResult] = useState<OptimizationResponse | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("latest_optimization_result");
      if (saved) {
        setResult(JSON.parse(saved));
      }
    }
  }, []);

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null) return "—";
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 font-sans">
        <AlertTriangle className="w-12 h-12 mb-4 opacity-50 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700">No Optimization Session Found</h2>
        <p className="mt-2 text-sm text-center max-w-md">
          There are no optimization results available in the current session. Return to the optimizer to configure and run the OR-Tools solver.
        </p>
        <Link href="/optimizer" className="mt-6 px-4 py-2 bg-[#0F3F2E] text-white rounded-lg text-sm font-semibold">
          Go to Optimizer
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/optimizer" className="p-2 -ml-2 rounded hover:bg-slate-100 text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Report</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${result.status === 'OPTIMAL' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
              SOLVER: {result.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 ml-10">
            Algorithmic portfolio recommendation based on FAIR financial exposure modeling.
          </p>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-[#0F3F2E] text-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> Investment Recommendation
        </h2>
        <p className="text-xl md:text-2xl font-light leading-relaxed">
          With a <strong className="font-bold">{formatCurrency(result.budget)}</strong> budget, the optimizer recommends <strong className="font-bold">{result.selected_mitigations.length}</strong> controls, requiring <strong className="font-bold">{formatCurrency(result.total_investment)}</strong> investment and reducing modeled annual loss exposure from <strong className="font-bold">{formatCurrency(result.baseline_eal)}</strong> to <strong className="font-bold text-emerald-300">{formatCurrency(result.optimized_eal)}</strong>.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Investment</div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(result.total_investment)}</div>
          <div className="text-xs text-slate-400 mt-2">Remaining: {formatCurrency(result.remaining_budget)}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Absolute Risk Reduction</div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(result.absolute_risk_reduction)}</div>
          <div className="text-xs text-slate-400 mt-2">Annualized Modeled Decrease</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Relative Reduction</div>
          <div className="text-2xl font-bold text-slate-900">{result.percentage_risk_reduction.toFixed(2)}%</div>
          <div className="text-xs text-slate-400 mt-2">Versus Baseline Exposure</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Expected ROSI</div>
          <div className="text-2xl font-bold text-emerald-600">{result.rosi.toFixed(2)}x</div>
          <div className="text-xs text-slate-400 mt-2">Return on Security Investment</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Selected Controls List */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Optimal Portfolio</h3>
            <p className="text-sm text-slate-500">Selected subset solving the knapsack constraints</p>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-5 py-3">Control Name</th>
                  <th className="px-5 py-3 text-right">Cost</th>
                  <th className="px-5 py-3 text-right">Benefit (Modeled)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.selected_mitigations.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-900">{m.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 ml-6">{m.reason_for_selection}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold whitespace-nowrap">{formatCurrency(m.cost)}</td>
                    <td className="px-5 py-4 text-right whitespace-nowrap text-emerald-600 font-medium">+{formatCurrency(m.modeled_eal_reduction)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Solver Context / Assumptions */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Solver Context</h3>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex justify-between"><span>Combinatorial Scope:</span> <span className="font-mono">{result.portfolio_validation}</span></li>
              <li className="flex justify-between"><span>Feasible Portfolios:</span> <span className="font-mono">{result.feasible_portfolio_count}</span></li>
              <li className="flex justify-between"><span>MIP Engine Match:</span> <span className="font-mono text-emerald-600">{result.mip_exact_match ? 'VERIFIED' : 'NO'}</span></li>
              <li className="flex justify-between"><span>Engine Version:</span> <span className="font-mono">{result.calculation_version}</span></li>
            </ul>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Assumptions & Limits</h3>
            <ul className="list-disc pl-4 space-y-2 text-xs text-slate-600 marker:text-slate-400">
              {result.assumptions?.map((asmp, i) => (
                <li key={i}>{asmp}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
