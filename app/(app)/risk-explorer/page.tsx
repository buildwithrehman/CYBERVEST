"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { FAIRResultOutput, FAIRScenarioInput, RiskAsset } from "@/lib/types/api";
import { LoadingState, ErrorState } from "@/components/ui/States";
import Link from "next/link";
import {
  ShieldAlert,
  Server,
  AlertTriangle,
  Activity,
  Lightbulb,
  Search,
  Download,
  SlidersHorizontal,
  FileBox,
  Target
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
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export default function RiskExplorerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const { data: fairData, isLoading: fairLoading } = useQuery({
    queryKey: ["fair_explorer_baseline"],
    queryFn: () =>
      fetchApi<FAIRResultOutput>("/api/fair/run", {
        method: "POST",
        body: JSON.stringify(defaultFairScenario),
      }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: riskAssets, isLoading: assetsLoading, error: assetsError } = useQuery({
    queryKey: ["risk_explorer"],
    queryFn: () => fetchApi<RiskAsset[]>("/api/risk-explorer/"),
  });

  const filteredAssets = useMemo(() => {
    if (!riskAssets) return [];
    return riskAssets.filter((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [riskAssets, searchTerm]);

  const selectedAsset = useMemo(() => {
    return riskAssets?.find(a => a.id === selectedAssetId) || null;
  }, [riskAssets, selectedAssetId]);

  const eal = fairData?.eal || 0;
  
  // Aggregate Metrics
  const criticalAssetsCount = riskAssets?.filter(a => a.criticality === 'critical').length || 0;
  const highRiskAssetsCount = riskAssets?.filter(a => a.vuln_critical_count > 0 || a.incident_count > 0).length || 0;

  if (assetsLoading || fairLoading) return <LoadingState message="Loading Risk Explorer..." />;
  if (assetsError) return <ErrorState error={assetsError instanceof Error ? assetsError : new Error("Failed to load risk telemetry data")} />;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      
      {/* PAGE HEADER WITH ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Risk Explorer</h1>
          <p className="text-sm text-slate-500 mt-0.5">Prioritize cyber risk based on real technical exposure</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 rounded-lg border border-border bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50" disabled>
            <SlidersHorizontal className="w-4 h-4" />
            <span>Configure Baselines</span>
          </button>
          <button className="h-10 px-4 rounded-lg bg-[#0F3F2E] text-white hover:bg-[#14533D] text-sm font-medium flex items-center gap-2 shadow transition-colors disabled:opacity-50" disabled>
            <Download className="w-4 h-4" />
            <span>Export Report</span>
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
            Calculated via independent FAIR baseline scenario. (Asset-level FAIR mapping currently unavailable)
          </div>
        </div>

        {/* Card 2: CRITICAL ASSETS */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <Server className="w-5 h-5 text-red-500 mb-2" />
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">CRITICAL ASSETS</span>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">{criticalAssetsCount}</div>
          <p className="text-xs text-slate-400 mt-2">Assets marked as mission-critical</p>
        </div>

        {/* Card 3: HIGH RISK ASSETS */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <AlertTriangle className="w-5 h-5 text-orange-500 mb-2" />
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">HIGH RISK ASSETS</span>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">{highRiskAssetsCount}</div>
          <p className="text-xs text-slate-400 mt-2">Assets with critical vulns or incidents</p>
        </div>

        {/* Card 4: LARGEST RISK DRIVER (Unavailable) */}
        <div className="bg-slate-50 border border-border border-dashed rounded-xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <Activity className="w-5 h-5 text-slate-300 mb-2" />
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">LARGEST RISK DRIVER</span>
          <p className="text-sm text-slate-400">Risk attribution modeling unavailable</p>
        </div>
      </div>

      {/* TOP INSIGHT BANNER */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
        <div className="flex items-center text-blue-800 gap-2">
          <Lightbulb className="w-5 h-5" />
          <span className="text-sm font-medium">Showing prioritization metrics derived from actual telemetry data. Full FAIR financial quantification per-asset requires additional mapping.</span>
        </div>
      </div>

      {/* COMPACT FILTER BAR */}
      <div className="p-4 bg-white rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
          <div className="lg:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              className="pl-8 pr-3 py-1.5 h-9 w-full text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3F2E]" 
              placeholder="Search assets..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select disabled className="h-9 px-2.5 py-1 text-sm bg-slate-50 border border-border rounded-lg text-slate-500 opacity-60">
            <option>All Services</option>
          </select>
          <select disabled className="h-9 px-2.5 py-1 text-sm bg-slate-50 border border-border rounded-lg text-slate-500 opacity-60">
            <option>Criticality: All</option>
          </select>
        </div>
      </div>

      {/* MAIN SPLIT WORKSPACE: LEDGER + FORENSIC DRAWER */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* MAIN LEDGER CARD */}
        <div className="flex-1 w-full bg-white border border-border rounded-xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3 bg-slate-50">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Asset Risk Prioritization</h3>
              <p className="text-sm text-slate-500">{filteredAssets?.length || 0} assets available</p>
            </div>
          </div>
          
          {!riskAssets || riskAssets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50">
              <FileBox className="w-12 h-12 mb-4 opacity-50 text-slate-300" />
              <h3 className="font-semibold text-slate-700 mb-2">No Assets Found</h3>
              <p className="text-sm text-center max-w-sm">No assets exist in the current organization&apos;s telemetry database.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full flex-1">
              <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Asset Name</th>
                    <th className="px-6 py-4">Critical Vulns</th>
                    <th className="px-6 py-4">Incidents</th>
                    <th className="px-6 py-4">Max EPSS</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets?.map((asset) => (
                    <tr 
                      key={asset.id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedAssetId === asset.id ? 'bg-slate-50 border-l-2 border-l-[#0F3F2E]' : 'border-l-2 border-l-transparent'}`}
                      onClick={() => setSelectedAssetId(asset.id)}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                        <Server className="w-4 h-4 text-slate-400" />
                        {asset.name}
                      </td>
                      <td className="px-6 py-4">
                        {asset.vuln_critical_count > 0 ? (
                          <span className="text-red-600 font-semibold">{asset.vuln_critical_count}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {asset.incident_count > 0 ? (
                          <span className="text-orange-600 font-semibold">{asset.incident_count}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {asset.epss_max ? (
                          <span className={asset.epss_max > 0.5 ? "text-red-600" : "text-slate-600"}>
                            {(asset.epss_max * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/assets/${asset.id}`} 
                          className="text-[#0F3F2E] hover:underline font-medium text-xs border border-[#0F3F2E]/20 px-2 py-1 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAssets?.length === 0 && (
                <div className="p-8 text-center text-slate-500">No matching assets found.</div>
              )}
            </div>
          )}
        </div>

        {/* SLIDE-OUT FORENSIC DETAIL DRAWER */}
        <div className="w-full xl:w-[400px] bg-white border border-border rounded-xl shadow-sm p-6 flex flex-col min-h-[400px] shrink-0">
          {selectedAsset ? (
            <div className="flex flex-col gap-4">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#0F3F2E]" /> {selectedAsset.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1 capitalize">{selectedAsset.criticality || "Unspecified"} Criticality</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Derived Prioritization Indicators</div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-slate-500">Critical Vulns</div>
                      <div className="font-semibold text-slate-900">{selectedAsset.vuln_critical_count}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">High Vulns</div>
                      <div className="font-semibold text-slate-900">{selectedAsset.vuln_high_count}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Events (30d)</div>
                      <div className="font-semibold text-slate-900">{selectedAsset.event_count_30d}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Historical Incidents</div>
                      <div className="font-semibold text-slate-900">{selectedAsset.incident_count}</div>
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/assets/${selectedAsset.id}`}
                  className="w-full text-center block bg-[#0F3F2E] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#14533D] transition-colors mt-2"
                >
                  View Full Asset Details
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center">
              <Activity className="w-10 h-10 mb-4 opacity-30" />
              <h3 className="font-semibold text-slate-600 mb-1">No Asset Selected</h3>
              <p className="text-sm max-w-[250px]">Select an asset from the ledger to view its prioritization metrics and telemetry summary.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
