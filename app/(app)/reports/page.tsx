"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/auth/supabase";
import { generateReport, downloadReportPdf } from "@/lib/api/reports";
import { ReportResponse } from "@/lib/types/api";
import { fetchApi } from "@/lib/api/client";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { FileText, Download, X, AlertTriangle, Printer, BarChart3, Shield, TrendingUp, CheckSquare, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { FAIRResultOutput, OptimizationResponse, RiskAsset } from "@/lib/types/api";

function formatINR(val: number) {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)}Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)}L`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

export default function ReportsPage() {
  const { data: fairData, isLoading: fairLoading } = useQuery({
    queryKey: ["fair_latest"],
    queryFn: () => fetchApi<FAIRResultOutput>("/api/fair/latest"),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: optResult, isLoading: optLoading } = useQuery({
    queryKey: ["opt_latest"],
    queryFn: () => fetchApi<OptimizationResponse>("/api/optimization/latest"),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: riskExplorerData, isLoading: riskLoading } = useQuery({
    queryKey: ["riskExplorer"],
    queryFn: () => fetchApi<RiskAsset[]>("/api/risk-explorer/"),
    staleTime: 1000 * 60 * 5,
  });

  const assetCount = riskExplorerData?.length || 0;
  const criticalVulns = riskExplorerData?.reduce((acc, a) => acc + (a.vuln_critical_count || 0), 0) || 0;
  const highVulns = riskExplorerData?.reduce((acc, a) => acc + (a.vuln_high_count || 0), 0) || 0;
  const incidentCount = riskExplorerData?.reduce((acc, a) => acc + (a.incident_count || 0), 0) || 0;

  const handleDownloadExecutive = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Your session has expired. Please sign in again.");
      }
      const blob = await downloadReportPdf(session.access_token, { report_type: "EXECUTIVE_RISK" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "CYBERVEST_Executive_Brief.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReportResponse | null>(null);

  const handleDownload = async () => {
    if (!preview) return;
    setIsDownloading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Your session has expired. Please sign in again.");
      }
      const blob = await downloadReportPdf(session.access_token, { report_type: preview.metadata.report_type === "Comprehensive Cyber Risk & Compliance Report" ? "FRAMEWORK_EVIDENCE" : "UNKNOWN" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "CYBERVEST_Framework_Evidence_Report.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerate = async (reportType: string) => {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Your session has expired. Please sign in again.");
      }
      
      const data = await generateReport(session.access_token, { report_type: reportType });
      
      // Fetch extra data for comprehensive reporting
      const [fairData, optData, assetsData, evidenceRes] = await Promise.allSettled([
        fetchApi("/api/fair/latest").catch(() => null),
        fetchApi("/api/optimization/latest").catch(() => null),
        fetchApi("/api/risk-explorer/").catch(() => null),
        supabase.from("evidence").select("*")
      ]);
      
      data.content.fair = fairData.status === "fulfilled" ? fairData.value : null;
      data.content.optimization = optData.status === "fulfilled" ? optData.value : null;
      data.content.assets = assetsData.status === "fulfilled" ? assetsData.value : null;
      data.content.evidence = evidenceRes.status === "fulfilled" ? evidenceRes.value.data : null;

      data.metadata.report_type = "Comprehensive Cyber Risk & Compliance Report";
      setPreview(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  
  const handleDownloadCsv = () => {
    if (!preview || preview.metadata.report_type !== "Comprehensive Cyber Risk & Compliance Report") return;
    const controls = preview.content.controls || [];
    const headers = ["Framework", "Control Code", "Title", "Status"];
    const rows = controls.map((c: any) => [
        `"${c.framework_controls?.frameworks?.short_name || 'N/A'}"`,
        `"${c.framework_controls?.control_code || 'N/A'}"`,
        `"${c.framework_controls?.title || 'N/A'}"`,
        `"${c.status || 'N/A'}"`
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "CYBERVEST_Framework_Evidence_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="print:hidden">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate decision-ready views of cyber risk, financial exposure, investment and compliance evidence.
        </p>
      </div>

      {error && (
        <div className="print:hidden">
          <ErrorState error={new Error(error)} retry={() => setError(null)} />
        </div>
      )}

      {loading && (
        <div className="print:hidden">
          <LoadingState message="Generating report..." />
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
          
          {/* Executive Risk Report */}
          <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-[#0F3F2E]" />
                <h3 className="text-lg font-semibold text-slate-900">Executive Risk Report</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">Financial exposure and key risk decisions.</p>
              
              {fairLoading ? (
                <div className="text-sm text-slate-400 mb-4">Loading data...</div>
              ) : fairData ? (
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Expected Loss (EAL):</span>
                    <span className="font-semibold text-slate-900">{formatINR(fairData.eal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">P90 Exposure:</span>
                    <span className="font-semibold text-red-600">{formatINR(fairData.p90 || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-medium text-emerald-600">Calculated</span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-700 text-xs font-medium px-2 py-1 rounded mb-4 flex items-center gap-1 w-fit border border-amber-200">
                  <AlertTriangle className="w-3 h-3" />
                  Run FAIR analysis first
                </div>
              )}
            </div>
            <div>
              {fairData ? (
                <button 
                  onClick={handleDownloadExecutive}
                  disabled={isDownloading}
                  className="w-full py-2 bg-[#0F3F2E] text-white text-sm font-medium rounded hover:bg-[#0a2e22] transition-colors"
                >
                  {isDownloading ? "Generating PDF..." : "Download PDF"}
                </button>
              ) : (
                <button disabled className="w-full py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded cursor-not-allowed border border-slate-200">
                  Report Unavailable
                </button>
              )}
            </div>
          </div>

          {/* CISO Risk Report */}
          <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-[#0F3F2E]" />
                <h3 className="text-lg font-semibold text-slate-900">CISO Risk Report</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">Technical risk and FAIR analysis.</p>
              
              {riskLoading ? (
                <div className="text-sm text-slate-400 mb-4">Loading data...</div>
              ) : riskExplorerData && assetCount > 0 ? (
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Assets Analyzed:</span>
                    <span className="font-semibold text-slate-900">{assetCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Crit/High Vulns:</span>
                    <span className="font-semibold text-red-600">{criticalVulns} / {highVulns}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Recent Incidents:</span>
                    <span className="font-semibold text-slate-900">{incidentCount}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-700 text-xs font-medium px-2 py-1 rounded mb-4 flex items-center gap-1 w-fit border border-amber-200">
                  <AlertTriangle className="w-3 h-3" />
                  No assets found
                </div>
              )}
            </div>
            <div>
              <button disabled className="w-full py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded cursor-not-allowed border border-slate-200">
                Detailed PDF generation unavailable
              </button>
            </div>
          </div>

          {/* Investment Report */}
          <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-[#0F3F2E]" />
                <h3 className="text-lg font-semibold text-slate-900">Investment Report</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">Budget allocation and risk reduction.</p>

              {optLoading ? (
                <div className="text-sm text-slate-400 mb-4">Loading data...</div>
              ) : optResult ? (
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Budget:</span>
                    <span className="font-semibold text-slate-900">{formatINR(optResult.budget || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Investment:</span>
                    <span className="font-semibold text-blue-600">{formatINR(optResult.total_investment || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Risk Reduction:</span>
                    <span className="font-semibold text-emerald-600">{formatINR(optResult.absolute_risk_reduction || 0)}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-700 text-xs font-medium px-2 py-1 rounded mb-4 flex items-center gap-1 w-fit border border-amber-200">
                  <AlertTriangle className="w-3 h-3" />
                  Run Optimizer first
                </div>
              )}
            </div>
            <div>
              <button disabled className="w-full py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded cursor-not-allowed border border-slate-200">
                Detailed PDF generation unavailable
              </button>
            </div>
          </div>

          {/* Scenario Report */}
          <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-[#0F3F2E]" />
                <h3 className="text-lg font-semibold text-slate-900">Scenario Report</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">Before/after risk analysis.</p>
              
              <div className="bg-slate-50 text-slate-600 text-xs font-medium px-2 py-1 rounded mb-4 flex items-center gap-1 w-fit border border-slate-200">
                Data unavailable
              </div>
            </div>
            <div>
              <button disabled className="w-full py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded cursor-not-allowed border border-slate-200">
                Run a What-If Scenario to generate this report
              </button>
            </div>
          </div>

          {/* Comprehensive Report */}
          <div className="bg-white p-6 border border-[#0F3F2E]/20 rounded-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-[#0F3F2E]"></div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CheckSquare className="w-5 h-5 text-[#0F3F2E]" />
                <h3 className="text-lg font-semibold text-slate-900">Comprehensive Report</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">Executive Risk, FAIR metrics, Assets, Compliance, Evidence and open findings.</p>
            </div>
            <div>
              <button 
                onClick={() => handleGenerate("FRAMEWORK_EVIDENCE")}
                className="w-full py-2 bg-[#0F3F2E] text-white text-sm font-medium rounded hover:bg-[#0a2e22] transition-colors"
              >
                Generate Report
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Report Preview Section */}
      {preview && (
        <div className="mt-8 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden bg-slate-50 rounded-t-lg">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Report Preview</h2>
              <p className="text-sm text-slate-500">Generated on {new Date(preview.metadata.generated_timestamp as string).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              {isDownloading ? (
                <button disabled className="px-4 py-2 bg-[#0F3F2E]/50 text-white text-sm font-medium rounded flex items-center gap-2 cursor-not-allowed">
                  Generating PDF...
                </button>
              ) : (
                <button 
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#0F3F2E] text-white text-sm font-medium rounded hover:bg-[#0a2e22] flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              )}
              <button 
                onClick={handleDownloadCsv}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded hover:bg-emerald-700 flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" /> Download CSV
              </button>
              <button 
                onClick={handlePrint}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded hover:bg-slate-50 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>
              <button 
                onClick={() => setPreview(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
          
          {/* Print Layout */}
          <div className="p-8 md:p-12 print:p-0">
            <div className="max-w-4xl mx-auto">
              <div className="mb-10 text-center border-b border-slate-200 pb-8">
                <h1 className="text-3xl font-bold text-[#0F3F2E] tracking-tight">CYBERVEST</h1>
                <h2 className="text-xl font-medium text-slate-800 mt-2">{preview.metadata.report_type as string}</h2>
                <div className="text-sm text-slate-500 mt-4 flex justify-center gap-6">
                  <span>Organization ID: <span className="font-mono">{preview.metadata.organization_id as string}</span></span>
                  <span>Date: {new Date(preview.metadata.generated_timestamp as string).toLocaleDateString()}</span>
                </div>
              </div>

              {preview.limitations && (
                <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <h4 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Disclosures & Limitations
                  </h4>
                  <p className="text-xs text-amber-700">{preview.limitations}</p>
                </div>
              )}

              {preview.metadata.report_type === "Comprehensive Cyber Risk & Compliance Report" && (
                <div className="space-y-8">
                  {/* 1. Executive Risk & FAIR */}
                  <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">1. Executive Risk & FAIR Metrics</h3>
                    {!preview.content.fair ? (
                      <p className="text-sm text-slate-500 italic">No FAIR financial risk data available in the current scope.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded bg-white">
                          <div className="text-sm text-slate-500 mb-1">Expected Annual Loss (EAL)</div>
                          <div className="text-xl font-bold text-slate-900">${(preview.content.fair.eal || preview.content.fair.total_loss_mean || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                        <div className="p-4 border border-slate-200 rounded bg-white">
                          <div className="text-sm text-slate-500 mb-1">90th Percentile Exposure</div>
                          <div className="text-xl font-bold text-red-700">${(preview.content.fair.p90 || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* 2. Asset Exposure */}
                  <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">2. Risk Explorer & Asset Telemetry</h3>
                    {!preview.content.assets || preview.content.assets.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No asset telemetry data available.</p>
                    ) : (
                      <div className="overflow-x-auto rounded border border-slate-200 w-full min-w-0">
                        <table className="w-full text-left text-sm text-slate-700 min-w-max">
                          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase">
                            <tr>
                              <th className="px-4 py-3">Asset</th>
                              <th className="px-4 py-3">Criticality</th>
                              <th className="px-4 py-3 text-right">Critical Vulns</th>
                              <th className="px-4 py-3 text-right">Max EPSS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {preview.content.assets.slice(0, 10).map((a: any) => (
                              <tr key={a.id}>
                                <td className="px-4 py-3 font-medium">{a.name}</td>
                                <td className="px-4 py-3 capitalize">{a.criticality || 'Unspecified'}</td>
                                <td className="px-4 py-3 text-right">{a.vuln_critical_count || 0}</td>
                                <td className="px-4 py-3 text-right">{a.epss_max ? (a.epss_max * 100).toFixed(1) + '%' : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {preview.content.assets.length > 10 && (
                          <div className="p-3 text-xs text-center text-slate-500 bg-slate-50 border-t border-slate-200">
                            Showing top 10 of {preview.content.assets.length} assets
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* 3. Investment Optimization */}
                  <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">3. Investment & Optimization Strategy</h3>
                    {!preview.content.optimization ? (
                      <p className="text-sm text-slate-500 italic">No investment optimization scenarios have been generated.</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 border border-slate-200 rounded bg-emerald-50">
                            <div className="text-sm text-emerald-700 mb-1">Optimized Risk Reduction</div>
                            <div className="text-xl font-bold text-emerald-800">${(preview.content.optimization.absolute_risk_reduction || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          </div>
                          <div className="p-4 border border-slate-200 rounded bg-blue-50">
                            <div className="text-sm text-blue-700 mb-1">Total Investment Cost</div>
                            <div className="text-xl font-bold text-blue-800">${(preview.content.optimization.total_investment || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600">
                          <strong>Selected Controls: </strong>
                          {(preview.content.optimization.selected_mitigations || []).length} controls recommended to maximize Return on Security Investment (ROSI).
                        </p>
                      </div>
                    )}
                  </section>

                  {/* 4. Compliance */}
                  <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">4. Compliance Overview</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      This section outlines the current status of organizational controls mapped to target frameworks. 
                    </p>
                    
                    <div className="overflow-x-auto rounded border border-slate-200 w-full min-w-0">
                      <table className="w-full text-left text-sm text-slate-700 min-w-max">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase">
                          <tr>
                            <th className="px-4 py-3">Framework</th>
                            <th className="px-4 py-3">Control Code</th>
                            <th className="px-4 py-3">Title</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {(preview.content.controls || []).map((c) => {
                            const frameworkControls = c.framework_controls;
                            const frameworks = frameworkControls?.frameworks;
                            return (
                            <tr key={c.id}>
                              <td className="px-4 py-3 font-medium">{frameworks?.short_name || 'N/A'}</td>
                              <td className="px-4 py-3">{frameworkControls?.control_code || 'N/A'}</td>
                              <td className="px-4 py-3">{frameworkControls?.title || 'N/A'}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                  c.status === 'IMPLEMENTED' ? 'bg-green-100 text-green-800' :
                                  c.status === 'GAP' || c.status === 'NOT_IMPLEMENTED' ? 'bg-red-100 text-red-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">5. Identified Findings</h3>
                    {(preview.content.findings || []).length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No open findings reported in the current scope.</p>
                    ) : (
                      <div className="grid gap-4">
                        {(preview.content.findings || []).map((f: any) => (
                          <div key={f.id} className="p-4 border border-slate-200 rounded bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-slate-900 text-sm">{f.title}</h4>
                              <span className={`text-xs font-medium px-2 py-1 rounded ${
                                f.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                f.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>{f.severity}</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{f.description}</p>
                            <div className="text-xs text-slate-500">Status: <span className="font-medium text-slate-700">{f.status}</span></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">6. Evidence Log</h3>
                    {!preview.content.evidence || preview.content.evidence.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No evidence records uploaded.</p>
                    ) : (
                      <div className="overflow-x-auto rounded border border-slate-200 w-full min-w-0">
                        <table className="w-full text-left text-sm text-slate-700 min-w-max">
                          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase">
                            <tr>
                              <th className="px-4 py-3">Title</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3">Source</th>
                              <th className="px-4 py-3">Uploaded</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {preview.content.evidence.map((ev: any) => (
                              <tr key={ev.id}>
                                <td className="px-4 py-3 font-medium">{ev.title}</td>
                                <td className="px-4 py-3 capitalize">{(ev.evidence_type || 'FILE').split('/')[1] || ev.evidence_type || 'File'}</td>
                                <td className="px-4 py-3 capitalize">{ev.source || 'Manual'}</td>
                                <td className="px-4 py-3">{new Date(ev.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
