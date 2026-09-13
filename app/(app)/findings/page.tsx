"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { ComplianceFinding } from "@/lib/types/api";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { AlertTriangle, Clock, Target, Calendar } from "lucide-react";
import Link from "next/link";

export default function FindingsPage() {
  const { data: findings, isLoading, error } = useQuery({
    queryKey: ["compliance_findings"],
    queryFn: () => fetchApi<ComplianceFinding[]>("/api/compliance/findings"),
  });

  if (isLoading) return <LoadingState message="Loading Compliance Findings..." />;
  if (error) return <ErrorState error={error instanceof Error ? error : new Error("Failed to load findings")} />;

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Compliance Findings</h1>
          <p className="text-sm text-slate-500 mt-1">Formal exceptions, violations, and identified gaps tracked for remediation.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/compliance" className="h-10 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
            Back to Compliance
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {!findings || findings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400">
            <Target className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-slate-700">No Findings</h3>
            <p className="text-sm mt-1">No compliance findings or gaps have been registered for this organization.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Finding Title</th>
                  <th className="px-6 py-4 font-semibold">Severity</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Control Map</th>
                  <th className="px-6 py-4 font-semibold">Created / Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {findings.map((finding) => (
                  <tr key={finding.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {finding.finding.includes("[DEMO]") && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">Demo</span>
                        )}
                        {finding.finding.replace("[DEMO]", "").trim()}
                      </div>

                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${
                          finding.severity === 'CRITICAL' ? 'text-red-500' :
                          finding.severity === 'HIGH' ? 'text-orange-500' :
                          finding.severity === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'
                        }`} />
                        <span className="font-medium text-slate-900 capitalize">{finding.severity.toLowerCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        finding.status === 'OPEN' ? 'bg-red-100 text-red-700' :
                        finding.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {finding.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {finding.organization_control_id ? (
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">Mapped</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unmapped</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(finding.created_at).toLocaleDateString()}</div>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
