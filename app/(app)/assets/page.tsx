"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { Asset } from "@/lib/types/api";
import { Search, Server, Shield, Globe, HardDrive } from "lucide-react";

export default function AssetsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ["assets"],
    queryFn: () => fetchApi<Asset[]>("/api/assets/"),
  });

  const filteredAssets = assets?.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Asset Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track your organization\organization&apos;sapos;s digital assets and their risk exposure.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search assets by name..."
              className="pl-10 pr-4 py-2 w-full text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3F2E] focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3F2E] mb-4"></div>
            <p>Loading asset inventory...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-red-500 bg-red-50">
            <Shield className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Assets</h3>
            <p className="text-sm max-w-md text-center">{error instanceof Error ? error.message : "An unknown error occurred"}</p>
          </div>
        ) : !assets || assets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-50">
            <HardDrive className="w-12 h-12 mb-4 opacity-30" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Assets Found</h3>
            <p className="text-sm max-w-md text-center">Your organization does not have any assets registered in the database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Asset Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Environment</th>
                  <th className="px-6 py-4">Criticality</th>
                  <th className="px-6 py-4">Internet Exposed</th>
                  <th className="px-6 py-4">Business Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets?.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                        <Server className="w-4 h-4" />
                      </div>
                      <Link href={`/assets/${asset.id}`} className="hover:text-[#0F3F2E] hover:underline">
                        {asset.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{asset.asset_type || <span className="text-slate-400 italic">Unspecified</span>}</td>
                    <td className="px-6 py-4">{asset.environment || <span className="text-slate-400 italic">Unspecified</span>}</td>
                    <td className="px-6 py-4">
                      {asset.criticality ? (
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium capitalize ${
                          asset.criticality === 'critical' ? 'bg-red-100 text-red-800' :
                          asset.criticality === 'high' ? 'bg-orange-100 text-orange-800' :
                          asset.criticality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {asset.criticality}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {asset.internet_exposed ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                          <Globe className="w-3 h-3" /> Exposed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Shield className="w-3 h-3" /> Internal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {asset.business_service_id ? (
                        <span className="font-mono text-xs">{asset.business_service_id.split('-')[0]}...</span>
                      ) : (
                        <span className="italic">Unmapped</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredAssets?.length === 0 && (
              <div className="p-8 text-center text-slate-500 border-t border-slate-100">
                No assets match your search term.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
