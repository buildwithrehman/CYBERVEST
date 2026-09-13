"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { ComplianceOverview, ComplianceGap, Framework } from "@/lib/types/api";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { ShieldCheck, AlertTriangle, FileText, Activity } from "lucide-react";
import Link from "next/link";

export default function CompliancePage() {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ["compliance_overview"],
    queryFn: () => fetchApi<ComplianceOverview>("/api/compliance/overview"),
  });

  const { data: frameworks, isLoading: frameworksLoading } = useQuery({
    queryKey: ["compliance_frameworks"],
    queryFn: () => fetchApi<Framework[]>("/api/compliance/frameworks"),
  });

  const { data: gaps, isLoading: gapsLoading } = useQuery({
    queryKey: ["compliance_gaps"],
    queryFn: () => fetchApi<ComplianceGap[]>("/api/compliance/gaps"),
  });

  if (overviewLoading || frameworksLoading || gapsLoading) return <LoadingState message="Loading Compliance Posture..." />;
  if (overviewError) return <ErrorState error={overviewError instanceof Error ? overviewError : new Error("Failed to load compliance data")} />;

  const hasFrameworks = overview?.framework_posture && Object.keys(overview.framework_posture).length > 0;

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Compliance Posture</h1>
          <p className="text-sm text-slate-500 mt-1">Track regulatory requirements, framework controls, and implementation status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/findings" className="h-10 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>View Findings</span>
          </Link>
          <Link href="/evidence" className="h-10 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Manage Evidence</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5 mb-2">
            <ShieldCheck className="w-4 h-4 text-green-500" /> ACTIVE FRAMEWORKS
          </div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {hasFrameworks ? Object.keys(overview.framework_posture).length : 0}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> CRITICAL GAPS
          </div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums text-red-600">
            {overview?.critical_gaps || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5 mb-2">
            <Activity className="w-4 h-4 text-amber-500" /> TOTAL IDENTIFIED GAPS
          </div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums text-amber-600">
            {gaps?.length || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frameworks Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Organization Frameworks</h2>
          {!hasFrameworks ? (
            <div className="text-center py-10 text-slate-400">
              No frameworks mapped to this organization.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(overview!.framework_posture).map(([fwName, stats]) => {
                const total = stats.IMPLEMENTED + stats.PARTIALLY_IMPLEMENTED + stats.GAP + stats.NOT_ASSESSED;
                const progress = total > 0 ? Math.round((stats.IMPLEMENTED / total) * 100) : 0;
                
                return (
                  <div key={fwName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{fwName}</span>
                      <span className="text-sm font-bold text-green-600">{progress}% Implemented</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                      <div className="bg-green-500 h-2.5" style={{ width: `${total > 0 ? (stats.IMPLEMENTED/total)*100 : 0}%` }}></div>
                      <div className="bg-amber-400 h-2.5" style={{ width: `${total > 0 ? (stats.PARTIALLY_IMPLEMENTED/total)*100 : 0}%` }}></div>
                      <div className="bg-red-500 h-2.5" style={{ width: `${total > 0 ? (stats.GAP/total)*100 : 0}%` }}></div>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 mt-1">
                      <span><span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>{stats.IMPLEMENTED} Implemented</span>
                      <span><span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-1"></span>{stats.PARTIALLY_IMPLEMENTED} Partial</span>
                      <span><span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>{stats.GAP} Gaps</span>
                      <span><span className="inline-block w-2 h-2 bg-slate-300 rounded-full mr-1"></span>{stats.NOT_ASSESSED} Unassessed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Known Control Gaps */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[500px]">
          <div className="p-6 pb-2 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Outstanding Control Gaps</h2>
            <p className="text-xs text-slate-500">Controls marked as NOT IMPLEMENTED or PARTIALLY IMPLEMENTED.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {!gaps || gaps.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                No outstanding gaps identified.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Control</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gaps.map((gap) => (
                    <tr key={gap.organization_control_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{gap.control_code}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]" title={gap.title}>{gap.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${gap.status === 'NOT_IMPLEMENTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {gap.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
