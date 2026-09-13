"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { Asset } from "@/lib/types/api";
import { ArrowLeft, Server, Shield, Globe, HardDrive, Calendar, User, MapPin } from "lucide-react";

export default function AssetDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: asset, isLoading, error } = useQuery({
    queryKey: ["assets", id],
    queryFn: () => fetchApi<Asset>(`/api/assets/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3F2E] mb-4"></div>
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-red-500 bg-red-50 h-[80vh] m-6 rounded-xl border border-red-100">
        <Shield className="w-12 h-12 mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Asset Not Found</h3>
        <p className="text-sm max-w-md text-center text-slate-600 mb-6">
          {error instanceof Error ? error.message : "The requested asset does not exist or you do not have permission to view it."}
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
        <Link href="/assets" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Assets
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
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
            <User className="w-5 h-5 text-slate-400" /> Organizational Context
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
              <span className="col-span-2 text-sm text-slate-900">
                {asset.business_service_id ? (
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded">{asset.business_service_id}</span>
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

      </div>

      {/* RISK TELEMETRY (EMPTY STATE) */}
      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center mt-4">
        <Shield className="w-10 h-10 text-slate-300 mb-3" />
        <h3 className="text-lg font-medium text-slate-700">Vulnerability & Event Telemetry Unavailable</h3>
        <p className="text-sm text-slate-500 max-w-lg mt-2">
          Detailed risk telemetry (CVEs, security events, and historical incidents) is currently not exposed via standalone endpoints in this environment.
        </p>
      </div>

    </div>
  );
}
