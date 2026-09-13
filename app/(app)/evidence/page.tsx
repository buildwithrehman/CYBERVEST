"use client";

import React from "react";
import { HardDrive, AlertTriangle, CloudOff } from "lucide-react";
import Link from "next/link";

export default function EvidencePage() {
  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Evidence Vault</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and link cryptographic audit evidence to compliance controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/compliance" className="h-10 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
            Back to Compliance
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
        <div className="relative">
          <HardDrive className="w-16 h-16 text-slate-300 mb-6" />
          <CloudOff className="w-8 h-8 text-red-500 absolute -bottom-2 -right-2 bg-white rounded-full p-1" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2">Evidence Upload Unavailable</h3>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          The compliance evidence workflow requires an active object storage provider. Currently, <strong className="text-slate-700">Supabase Storage buckets and policies</strong> have not been configured or migrated in the database schema.
        </p>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-lg text-left flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <strong>Configuration Missing:</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>No `storage.buckets` table or configuration detected in initial migrations.</li>
              <li>Missing `authenticated` RLS policies for secure artifact upload/download.</li>
              <li>Fake uploads are strictly disabled to preserve evidence integrity.</li>
            </ul>
          </div>
        </div>

        <button disabled className="mt-8 h-10 px-6 rounded-lg bg-slate-100 text-slate-400 font-medium cursor-not-allowed border border-slate-200">
          Upload Evidence Artifact
        </button>
      </div>
    </div>
  );
}
