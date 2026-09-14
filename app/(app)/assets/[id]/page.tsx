
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { Asset, AssetTelemetryResponse, MLPredictResponse } from "@/lib/types/api";
import { ArrowLeft, Server, Shield, Globe, HardDrive, Calendar, User, MapPin, AlertTriangle, Activity, Database } from "lucide-react";

export default function AssetDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: asset, isLoading: assetLoading, error: assetError } = useQuery({
    queryKey: ["assets", id],
    queryFn: () => fetchApi<Asset>(`/api/assets/${id}`),
    enabled: !!id,
  });

  const { data: telemetry, isLoading: telemetryLoading, error: telemetryError } = useQuery({
    queryKey: ["assets", id, "telemetry"],
    queryFn: () => fetchApi<AssetTelemetryResponse>(`/api/assets/${id}/telemetry`),
    enabled: !!id,
  });

  const { data: mlData, isLoading: mlLoading, error: mlError } = useQuery({
    queryKey: ["ml_predict", id],
    queryFn: () => fetchApi<MLPredictResponse>(`/api/ml/predict`, {
      method: "POST",
      body: JSON.stringify({ asset_id: id })
    }),
    enabled: !!id,
  });

  if (assetLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3F2E] mb-4"></div>
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (assetError || !asset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-red-500 bg-red-50 h-[80vh] m-6 rounded-xl border border-red-100">
        <Shield className="w-12 h-12 mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Asset Not Found</h3>
        <p className="text-sm max-w-md text-center text-slate-600 mb-6">
          {assetError instanceof Error ? assetError.message : "The requested asset does not exist or you do not have permission to view it."}
        </p>
        <Link href="/assets" className="px-4 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors">
          Return to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6">
        <Link href="/risk-explorer" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Risk Explorer
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mt-2">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0F3F2E] shrink-0 mt-1">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{asset.name}</h1>
              <p className="text-sm text-slate-500 font-mono mt-1">ID: {asset.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {asset.criticality && (
              <span className={`inline-flex px-3 py-1.5 rounded-md text-sm font-semibold capitalize border ${
                asset.criticality === 'critical' ? 'bg-red-50 text-red-700 border-red-100' :
                asset.criticality === 'high' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                asset.criticality === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                'bg-green-50 text-green-700 border-green-100'
              }`}>
                {asset.criticality} Risk
              </span>
            )}
            {asset.internet_exposed && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-red-50 text-red-700 border border-red-100">
                <Globe className="w-4 h-4" /> Internet Exposed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* METADATA CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-slate-400" /> System Details
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-500 font-medium">Type</span>
              <span className="col-span-2 text-sm text-slate-900">{asset.asset_type || <span className="italic text-slate-400">Unspecified</span>}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-500 font-medium">Environment</span>
              <span className="col-span-2 text-sm text-slate-900 capitalize">{asset.environment || <span className="italic text-slate-400">Unspecified</span>}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-500 font-medium">Data Sensitivity</span>
              <span className="col-span-2 text-sm text-slate-900">{asset.data_sensitivity || <span className="italic text-slate-400">Unspecified</span>}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <span className="text-sm text-slate-500 font-medium">Description</span>
              <span className="col-span-2 text-sm text-slate-900">{asset.description || <span className="italic text-slate-400">No description provided</span>}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-400" /> Context
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-500 font-medium">Owner</span>
              <span className="col-span-2 text-sm text-slate-900">{asset.owner || <span className="italic text-slate-400">Unassigned</span>}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-500 font-medium flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Location</span>
              <span className="col-span-2 text-sm text-slate-900">{asset.location || <span className="italic text-slate-400">Unknown</span>}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-500 font-medium">Business Service</span>
              <span className="col-span-2 text-sm text-slate-900 flex-wrap">
                {asset.business_service_id ? (
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded break-all">{asset.business_service_id}</span>
                ) : (
                  <span className="italic text-slate-400">Unmapped</span>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <span className="text-sm text-slate-500 font-medium flex items-center gap-1.5"><Calendar className="w-3 h-3"/> Created</span>
              <span className="col-span-2 text-sm text-slate-900">{new Date(asset.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* ML PREDICTION PANEL */}
        <div className="bg-[#0F3F2E] border border-[#0F3F2E] rounded-xl p-6 shadow-sm text-white">
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" /> ML Likelihood Signal
          </h3>
          {mlLoading ? (
             <div className="flex flex-col items-center justify-center p-6 text-emerald-400">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400 mb-2"></div>
               <p className="text-xs">Computing prediction...</p>
             </div>
          ) : mlError || !mlData ? (
             <div className="flex flex-col items-center justify-center p-6 text-red-300">
               <Shield className="w-6 h-6 mb-2 opacity-70" />
               <p className="text-xs text-center">Failed to load ML signal.</p>
             </div>
          ) : (
             <div className="space-y-4">
               <div className="flex flex-col gap-1">
                 <span className="text-sm text-emerald-100/70 font-medium uppercase tracking-wider">Incident Probability</span>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{(mlData.prediction.probability * 100).toFixed(1)}%</span>
                 </div>
               </div>
               
               <div className="pt-2 border-t border-white/10">
                 <span className={`inline-flex items-center justify-center w-full px-3 py-2 rounded-md text-sm font-semibold border ${mlData.prediction.label === 'Elevated Signal' ? 'bg-red-500/20 text-red-200 border-red-500/30' : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'}`}>
                    {mlData.prediction.label}
                 </span>
               </div>
               
               <div className="pt-2">
                 <p className="text-xs text-emerald-100/50">Model: {mlData.model.name} v{mlData.model.version}</p>
               </div>
             </div>
          )}
        </div>

      </div>

      {/* TELEMETRY */}
      {telemetryLoading ? (
         <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mb-2"></div>
            <p className="text-sm text-slate-500">Loading risk telemetry...</p>
         </div>
      ) : telemetryError || !telemetry ? (
         <div className="bg-red-50 border border-red-200 rounded-xl p-8 flex flex-col items-center justify-center text-center text-red-600">
            <AlertTriangle className="w-8 h-8 mb-2 opacity-70" />
            <p className="text-sm font-medium">Failed to load telemetry</p>
         </div>
      ) : (
         <div className="flex flex-col gap-6">
           {/* VULNERABILITIES */}
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
               <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-red-500" /> Vulnerabilities ({telemetry.vulnerabilities.length})
               </h3>
             </div>
             {telemetry.vulnerabilities.length === 0 ? (
               <div className="p-8 text-center text-slate-500 text-sm">No vulnerabilities recorded for this asset.</div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
                   <thead className="bg-white border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                     <tr>
                       <th className="px-6 py-4">CVE ID</th>
                       <th className="px-6 py-4">Severity</th>
                       <th className="px-6 py-4">CVSS Score</th>
                       <th className="px-6 py-4">EPSS Score</th>
                       <th className="px-6 py-4">Known Exploited</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {telemetry.vulnerabilities.map(v => (
                       <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 font-mono font-medium text-slate-900">{v.cve_id || "N/A"}</td>
                         <td className="px-6 py-4">
                           <span className={`capitalize font-semibold ${v.severity?.toLowerCase() === 'critical' ? 'text-red-600' : v.severity?.toLowerCase() === 'high' ? 'text-orange-600' : 'text-slate-600'}`}>
                             {v.severity || "Unknown"}
                           </span>
                         </td>
                         <td className="px-6 py-4 font-mono">{v.cvss_score || "-"}</td>
                         <td className="px-6 py-4 font-mono">{v.epss_score ? (v.epss_score * 100).toFixed(1) + "%" : "-"}</td>
                         <td className="px-6 py-4">{v.known_exploited ? <span className="text-red-600 font-bold">YES</span> : "No"}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>

           {/* SECURITY EVENTS */}
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
               <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                 <Activity className="w-5 h-5 text-blue-500" /> Security Events ({telemetry.security_events.length})
               </h3>
             </div>
             {telemetry.security_events.length === 0 ? (
               <div className="p-8 text-center text-slate-500 text-sm">No recent security events recorded.</div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
                   <thead className="bg-white border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                     <tr>
                       <th className="px-6 py-4">Timestamp</th>
                       <th className="px-6 py-4">Event Type</th>
                       <th className="px-6 py-4">Severity</th>
                       <th className="px-6 py-4">Source</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {telemetry.security_events.map(e => (
                       <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 text-slate-500">{new Date(e.timestamp).toLocaleString()}</td>
                         <td className="px-6 py-4 font-medium">{e.event_type}</td>
                         <td className="px-6 py-4 capitalize">{e.severity}</td>
                         <td className="px-6 py-4 text-slate-500">{e.source}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>

           {/* INCIDENTS */}
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
               <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                 <Shield className="w-5 h-5 text-orange-500" /> Historical Incidents ({telemetry.incidents.length})
               </h3>
             </div>
             {telemetry.incidents.length === 0 ? (
               <div className="p-8 text-center text-slate-500 text-sm">No historical incidents recorded.</div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
                   <thead className="bg-white border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                     <tr>
                       <th className="px-6 py-4">Detected</th>
                       <th className="px-6 py-4">Type</th>
                       <th className="px-6 py-4">Severity</th>
                       <th className="px-6 py-4">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {telemetry.incidents.map(i => (
                       <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 text-slate-500">{new Date(i.detected_at).toLocaleDateString()}</td>
                         <td className="px-6 py-4 font-medium">{i.incident_type}</td>
                         <td className="px-6 py-4 capitalize">{i.severity}</td>
                         <td className="px-6 py-4">
                           {i.resolved_at ? (
                             <span className="text-green-600 font-medium">Resolved</span>
                           ) : (
                             <span className="text-red-600 font-bold">Open</span>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>

         </div>
      )}

    </div>
  );
}
