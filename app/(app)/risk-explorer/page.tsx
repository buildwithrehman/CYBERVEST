"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { FAIRResultOutput, FAIRScenarioInput, RiskAsset } from "@/lib/types/api";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { supabase } from "@/lib/auth/supabase";
import Link from "next/link";
import {
  Server,
  Activity,
  Search,
  Download,
  SlidersHorizontal,
  FileBox,
  Target,
  RefreshCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function RiskExplorerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [baselineOpen, setBaselineOpen] = useState(false);

  // Compliance baseline data
  const { data: complianceData, isLoading: complianceLoading, error: complianceError } = useQuery({
    queryKey: ["compliance_overview"],
    queryFn: () => fetchApi<{
      organization_id: string;
      framework_posture: Record<string, { IMPLEMENTED: number; PARTIALLY_IMPLEMENTED: number; GAP: number; NOT_ASSESSED: number }>;
      critical_gaps: number;
      high_gaps: number;
    }>("/api/compliance/overview"),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Derive baseline metrics from real compliance data
  const baselineMetrics = useMemo(() => {
    if (!complianceData?.framework_posture) return null;
    const posture = complianceData.framework_posture;
    const frameworks = Object.keys(posture);
    if (frameworks.length === 0) return null;

    let totalImplemented = 0;
    let totalPartial = 0;
    let totalGap = 0;
    let totalNotAssessed = 0;

    for (const fw of frameworks) {
      totalImplemented += posture[fw].IMPLEMENTED;
      totalPartial += posture[fw].PARTIALLY_IMPLEMENTED;
      totalGap += posture[fw].GAP;
      totalNotAssessed += posture[fw].NOT_ASSESSED;
    }

    const totalControls = totalImplemented + totalPartial + totalGap + totalNotAssessed;
    const assessedControls = totalImplemented + totalPartial + totalGap;
    const baselinePct = assessedControls > 0 ? (totalImplemented / assessedControls) * 100 : null;

    return {
      frameworks,
      frameworkPosture: posture,
      totalImplemented,
      totalPartial,
      totalGap,
      totalNotAssessed,
      totalControls,
      assessedControls,
      baselinePct,
      criticalGaps: complianceData.critical_gaps,
      highGaps: complianceData.high_gaps,
    };
  }, [complianceData]);

  // Filter States
  const [serviceFilter, setServiceFilter] = useState("All");
  const [criticalityFilter, setCriticalityFilter] = useState("All");
  const [environmentFilter, setEnvironmentFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Sort States
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data: riskAssets, isLoading: assetsLoading, error: assetsError } = useQuery({
    queryKey: ["risk_explorer"],
    queryFn: () => fetchApi<RiskAsset[]>("/api/risk-explorer/"),
  });

  const { data: businessServices } = useQuery({
    queryKey: ["business_services_map"],
    queryFn: async () => {
      const { data } = await supabase.from("business_services").select("id, name");
      if (!data) return {};
      return data.reduce((acc, curr) => {
        acc[curr.id] = curr.name;
        return acc;
      }, {} as Record<string, string>);
    }
  });

  // Unique lists for dynamic dropdowns
  const uniqueServices = useMemo(() => {
    if (!riskAssets) return [];
    const services = new Set<string>();
    riskAssets.forEach(a => {
      if (a.business_service_id) services.add(a.business_service_id);
    });
    return Array.from(services).sort();
  }, [riskAssets]);

  const filteredAssets = useMemo(() => {
    if (!riskAssets) return [];
    
    let filtered = riskAssets.filter((a) => {
      // Search
      if (searchTerm && !a.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      // Filters
      if (serviceFilter !== "All" && a.business_service_id !== serviceFilter) return false;
      if (criticalityFilter !== "All" && (a.criticality || "unspecified").toLowerCase() !== criticalityFilter.toLowerCase()) return false;
      if (environmentFilter !== "All" && (a.environment || "unspecified").toLowerCase() !== environmentFilter.toLowerCase()) return false;
      if (typeFilter !== "All" && (a.asset_type || "unspecified").toLowerCase() !== typeFilter.toLowerCase()) return false;
      
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let valA: any = a.name;
      let valB: any = b.name;

      if (sortBy === "crit_vulns") {
        valA = a.vuln_critical_count;
        valB = b.vuln_critical_count;
      } else if (sortBy === "high_vulns") {
        valA = a.vuln_high_count;
        valB = b.vuln_high_count;
      } else if (sortBy === "epss") {
        valA = a.epss_max || 0;
        valB = b.epss_max || 0;
      } else if (sortBy === "events") {
        valA = a.event_count_30d;
        valB = b.event_count_30d;
      } else if (sortBy === "incidents") {
        valA = a.incident_count;
        valB = b.incident_count;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [riskAssets, searchTerm, serviceFilter, criticalityFilter, environmentFilter, typeFilter, sortBy, sortOrder]);

  const selectedAsset = useMemo(() => {
    return riskAssets?.find(a => a.id === selectedAssetId) || null;
  }, [riskAssets, selectedAssetId]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setServiceFilter("All");
    setCriticalityFilter("All");
    setEnvironmentFilter("All");
    setTypeFilter("All");
    setSortBy("name");
    setSortOrder("asc");
  };

  const hasActiveFilters = searchTerm !== "" || serviceFilter !== "All" || criticalityFilter !== "All" || environmentFilter !== "All" || typeFilter !== "All";

  
  const handleExport = () => {
    try {
      setIsExporting(true);
      setExportError(null);
      
      if (!filteredAssets || filteredAssets.length === 0) {
        throw new Error("No data available to export");
      }

      // Prepare headers
      const headers = [
        "Asset Name",
        "Asset Type",
        "Business Service",
        "Environment",
        "Criticality",
        "Internet Exposed",
        "Critical Vulns",
        "High Vulns",
        "Max EPSS",
        "Events (30d)",
        "Incidents"
      ];

      // Prepare rows
      const rows = filteredAssets.map(asset => [
        `"${(asset.name || "").replace(/"/g, '""')}"`,
        `"${(asset.asset_type || "unspecified").replace(/"/g, '""')}"`,
        `"${((businessServices && businessServices[asset.business_service_id || ""]) ? businessServices[asset.business_service_id || ""] : (asset.business_service_id || "")).replace(/"/g, '""')}"`,
        `"${(asset.environment || "unspecified").replace(/"/g, '""')}"`,
        `"${(asset.criticality || "unspecified").replace(/"/g, '""')}"`,
        asset.internet_exposed ? "Yes" : "No",
        asset.vuln_critical_count || 0,
        asset.vuln_high_count || 0,
        asset.epss_max ? asset.epss_max.toFixed(4) : "0",
        asset.event_count_30d || 0,
        asset.incident_count || 0
      ]);

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Risk_Explorer_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  if (assetsLoading) return <LoadingState message="Loading Risk Explorer..." />;
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
          <button 
            onClick={() => setBaselineOpen(prev => !prev)}
            className={`h-10 px-4 rounded-lg border bg-white text-slate-900 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors ${baselineOpen ? 'border-[#0F3F2E] ring-1 ring-[#0F3F2E]/20' : 'border-border hover:bg-slate-50'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Configuration Baseline</span>
            {baselineOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="h-10 px-4 rounded-lg bg-[#0F3F2E] text-white hover:bg-[#14533D] text-sm font-medium flex items-center gap-2 shadow transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Exporting..." : "Export Report"}</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {exportError}
        </div>
      )}

      {/* CONFIGURATION BASELINE PANEL */}
      {baselineOpen && (
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0F3F2E]" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Configuration Baseline</h3>
              <p className="text-sm text-slate-500">Security control implementation posture derived from organization compliance data</p>
            </div>
          </div>
          <div className="p-5">
            {complianceLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0F3F2E]"></div>
              </div>
            ) : complianceError ? (
              <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                Failed to load compliance baseline data.
              </div>
            ) : !baselineMetrics || baselineMetrics.totalControls === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                <ShieldCheck className="w-8 h-8 text-slate-300 mb-3" />
                <h4 className="font-semibold text-slate-700 mb-1">Insufficient Data</h4>
                <p className="text-sm max-w-sm">No organization controls have been mapped. Configure compliance frameworks in the Compliance Center to populate the configuration baseline.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* OVERALL BASELINE SCORE */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Overall Baseline Compliance</div>
                    {baselineMetrics.baselinePct !== null ? (
                      <div className="flex items-end gap-3">
                        <span className={`text-4xl font-bold tabular-nums ${baselineMetrics.baselinePct >= 70 ? 'text-[#0F3F2E]' : baselineMetrics.baselinePct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {baselineMetrics.baselinePct.toFixed(1)}%
                        </span>
                        <span className="text-sm text-slate-500 mb-1">
                          {baselineMetrics.totalImplemented} of {baselineMetrics.assessedControls} assessed controls implemented
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">No assessed controls to calculate baseline</span>
                    )}
                    <div className="mt-3 h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                      {baselineMetrics.assessedControls > 0 && (
                        <>
                          <div className="bg-[#0F3F2E] h-full transition-all" style={{ width: `${(baselineMetrics.totalImplemented / baselineMetrics.totalControls) * 100}%` }} />
                          <div className="bg-amber-400 h-full transition-all" style={{ width: `${(baselineMetrics.totalPartial / baselineMetrics.totalControls) * 100}%` }} />
                          <div className="bg-red-400 h-full transition-all" style={{ width: `${(baselineMetrics.totalGap / baselineMetrics.totalControls) * 100}%` }} />
                          <div className="bg-slate-200 h-full transition-all" style={{ width: `${(baselineMetrics.totalNotAssessed / baselineMetrics.totalControls) * 100}%` }} />
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0F3F2E] inline-block" />Implemented ({baselineMetrics.totalImplemented})</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Partial ({baselineMetrics.totalPartial})</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Gap ({baselineMetrics.totalGap})</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />Not Assessed ({baselineMetrics.totalNotAssessed})</span>
                    </div>
                  </div>

                  {/* OPEN GAPS SUMMARY */}
                  <div className="sm:border-l sm:border-slate-200 sm:pl-5 flex gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center min-w-[80px]">
                      <div className="text-2xl font-bold text-red-700 tabular-nums">{baselineMetrics.criticalGaps}</div>
                      <div className="text-[11px] text-red-600 font-medium uppercase tracking-wider">Critical</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center min-w-[80px]">
                      <div className="text-2xl font-bold text-amber-700 tabular-nums">{baselineMetrics.highGaps}</div>
                      <div className="text-[11px] text-amber-600 font-medium uppercase tracking-wider">High</div>
                    </div>
                  </div>
                </div>

                {/* PER-FRAMEWORK BREAKDOWN */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Framework Posture</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {baselineMetrics.frameworks.map(fw => {
                      const p = baselineMetrics.frameworkPosture[fw];
                      const assessed = p.IMPLEMENTED + p.PARTIALLY_IMPLEMENTED + p.GAP;
                      const total = assessed + p.NOT_ASSESSED;
                      const pct = assessed > 0 ? (p.IMPLEMENTED / assessed) * 100 : null;
                      return (
                        <div key={fw} className="border border-slate-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-900">{fw}</span>
                            {pct !== null ? (
                              <span className={`text-sm font-bold tabular-nums ${pct >= 70 ? 'text-[#0F3F2E]' : pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                {pct.toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">N/A</span>
                            )}
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                            {total > 0 && (
                              <>
                                <div className="bg-[#0F3F2E] h-full" style={{ width: `${(p.IMPLEMENTED / total) * 100}%` }} />
                                <div className="bg-amber-400 h-full" style={{ width: `${(p.PARTIALLY_IMPLEMENTED / total) * 100}%` }} />
                                <div className="bg-red-400 h-full" style={{ width: `${(p.GAP / total) * 100}%` }} />
                              </>
                            )}
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                            <span><CheckCircle2 className="w-3 h-3 inline text-[#0F3F2E] mr-0.5" />{p.IMPLEMENTED}</span>
                            <span><AlertTriangle className="w-3 h-3 inline text-amber-500 mr-0.5" />{p.PARTIALLY_IMPLEMENTED}</span>
                            <span><XCircle className="w-3 h-3 inline text-red-400 mr-0.5" />{p.GAP}</span>
                            <span className="text-slate-400">{total} total</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* FILTER BAR */}
      <div className="bg-white border border-border rounded-xl p-4 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              className="pl-8 pr-3 py-1.5 h-9 w-full text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3F2E]" 
              placeholder="Search assets..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="h-9 px-2.5 py-1 text-sm bg-white border border-border rounded-lg text-slate-700"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="All">All Services</option>
            {uniqueServices.map(s => (
              <option key={s} value={s}>{businessServices?.[s] || s}</option>
            ))}
          </select>
          
          <select 
            className="h-9 px-2.5 py-1 text-sm bg-white border border-border rounded-lg text-slate-700"
            value={criticalityFilter}
            onChange={(e) => setCriticalityFilter(e.target.value)}
          >
            <option value="All">Criticality: All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select 
            className="h-9 px-2.5 py-1 text-sm bg-white border border-border rounded-lg text-slate-700"
            value={environmentFilter}
            onChange={(e) => setEnvironmentFilter(e.target.value)}
          >
            <option value="All">Environment: All</option>
            <option value="Production">Production</option>
            <option value="Staging">Staging</option>
            <option value="Testing">Testing</option>
            <option value="Development">Development</option>
          </select>

          <select 
            className="h-9 px-2.5 py-1 text-sm bg-white border border-border rounded-lg text-slate-700"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">Asset Type: All</option>
            <option value="WEB_APPLICATION">Web Application</option>
            <option value="SERVER">Server</option>
            <option value="DATABASE">Database</option>
            <option value="ENDPOINT">Endpoint</option>
            <option value="API">API</option>
            <option value="NETWORK_DEVICE">Network Device</option>
            <option value="IDENTITY_INFRASTRUCTURE">Identity Infrastructure</option>
            <option value="CLOUD_RESOURCE">Cloud Resource</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">Sort by:</span>
            <select 
              className="h-8 px-2 py-1 text-xs bg-white border border-border rounded text-slate-700"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Asset Name</option>
              <option value="crit_vulns">Critical Vulnerabilities</option>
              <option value="high_vulns">High Vulnerabilities</option>
              <option value="epss">Max EPSS</option>
              <option value="events">Events (30d)</option>
              <option value="incidents">Incidents</option>
            </select>
            <button 
              className="h-8 px-2 text-xs bg-white border border-border rounded text-slate-700 hover:bg-slate-50"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "Ascending ↑" : "Descending ↓"}
            </button>
          </div>

          {hasActiveFilters && (
            <button 
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* MAIN SPLIT WORKSPACE: LEDGER + FORENSIC DRAWER */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* MAIN LEDGER CARD */}
        <div className="flex-1 w-full bg-white border border-border rounded-xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3 bg-slate-50">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Asset Risk Prioritization</h3>
              <p className="text-sm text-slate-500">{filteredAssets?.length || 0} of {riskAssets?.length || 0} assets</p>
            </div>
          </div>
          
          {!riskAssets || riskAssets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50">
              <FileBox className="w-12 h-12 mb-4 opacity-50 text-slate-300" />
              <h3 className="font-semibold text-slate-700 mb-2">No Assets Found</h3>
              <p className="text-sm text-center max-w-sm">No assets exist in the current organization&apos;s telemetry database.</p>
            </div>
          ) : filteredAssets?.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 bg-white">
              <Search className="w-10 h-10 mb-4 opacity-30 text-slate-400" />
              <h3 className="font-semibold text-slate-600 mb-2">No Matches Found</h3>
              <p className="text-sm text-center max-w-sm mb-4">No assets match the current filter criteria.</p>
              <button 
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Clear Filters
              </button>
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
