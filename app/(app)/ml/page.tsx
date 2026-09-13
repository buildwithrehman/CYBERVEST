"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { MLPredictRequest, MLPredictResponse, Asset } from "@/lib/types/api";
import { BrainCircuit, Server, Activity, ArrowRight, Play, AlertTriangle, ShieldCheck } from "lucide-react";
import { LoadingState, ErrorState } from "@/components/ui/States";

export default function MLPage() {
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");

  const { data: assets, isLoading: assetsLoading, error: assetsError } = useQuery({
    queryKey: ["ml_assets"],
    queryFn: () => fetchApi<Asset[]>("/api/assets/"),
  });

  const mutation = useMutation<MLPredictResponse, Error, MLPredictRequest>({
    mutationFn: (req) =>
      fetchApi("/api/ml/predict", {
        method: "POST",
        body: JSON.stringify(req),
      }),
  });

  const handlePredict = () => {
    if (!selectedAssetId) return;
    mutation.mutate({ asset_id: selectedAssetId });
  };

  const isElevated = mutation.data?.prediction.label?.toLowerCase().includes("elevated");

  if (assetsLoading) return <LoadingState message="Loading assets for ML engine..." />;
  if (assetsError) return <ErrorState error={assetsError instanceof Error ? assetsError : new Error("Failed to load assets")} />;

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">ML Risk Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">
            Certified point-in-time machine learning inference for operational telemetry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: ASSET SELECTION & FEATURES */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Target Asset Selection</h2>
            
            <div className="flex-1 space-y-5">
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-2">Select Organization Asset</label>
                <select 
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F3F2E] focus:outline-none"
                  value={selectedAssetId}
                  onChange={(e) => {
                    setSelectedAssetId(e.target.value);
                    mutation.reset();
                  }}
                >
                  <option value="" disabled>-- Select an asset --</option>
                  {assets?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.asset_type || "Unknown"})</option>
                  ))}
                </select>
              </div>

              {mutation.data && mutation.data.features && (
                <div>
                  <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-2">Backend Extracted Features</label>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 font-mono space-y-1">
                    <div>Asset Type: {String(mutation.data.features.asset_type)}</div>
                    <div>Criticality: {String(mutation.data.features.criticality)}</div>
                    <div>Internet Exposed: {String(mutation.data.features.internet_exposed)}</div>
                    <div>Vuln Count: {String(mutation.data.features.vuln_count)}</div>
                    <div>CVSS Max: {String(mutation.data.features.cvss_max)}</div>
                    <div>Known Exploited: {String(mutation.data.features.known_exploited_count)}</div>
                    <div>Recent Events (30d): {String(mutation.data.features.recent_event_count_30d)}</div>
                    <div>Prior Incidents: {String(mutation.data.features.prior_incident_count)}</div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Prediction Window</label>
                <div className="mt-1 text-sm text-slate-900 font-medium">Next 15 Days (Rolling)</div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <button 
                onClick={handlePredict}
                disabled={mutation.isPending || !selectedAssetId}
                className="w-full h-10 rounded-lg bg-[#0F3F2E] text-white hover:bg-[#14533D] text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {mutation.isPending ? "Running Inference..." : "Run Server Inference"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE: INCIDENT LIKELIHOOD RESULT */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Model Result</h2>
            
            {mutation.isPending ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3F2E] mb-4"></div>
                <span className="text-sm">Calculating point-in-time likelihood...</span>
              </div>
            ) : mutation.error ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-red-500">
                <AlertTriangle className="w-8 h-8 mb-3 opacity-80" />
                <span className="text-sm font-medium">Inference Failed</span>
                <span className="text-xs text-slate-500 mt-2">{mutation.error.message}</span>
              </div>
            ) : mutation.data ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                <BrainCircuit className="w-12 h-12 text-[#0F3F2E] mb-4 opacity-80" />
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Modeled Incident Likelihood (15d)</div>
                <div className="text-6xl font-bold tracking-tight text-[#0F3F2E]">
                  {(mutation.data.prediction.probability * 100).toFixed(2)}%
                </div>
                {mutation.data.model?.version && (
                  <div className="mt-4 text-xs text-slate-400">
                    Model Version: {mutation.data.model.version}
                  </div>
                )}
                {mutation.data.prediction_timestamp && (
                  <div className="mt-1 text-xs text-slate-400">
                    Time: {new Date(mutation.data.prediction_timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-slate-400">
                <Play className="w-8 h-8 mb-3 opacity-50" />
                <span className="text-sm font-medium">Run prediction to view result</span>
                <span className="text-xs text-slate-400 mt-2">Invokes actual server-side inference on asset telemetry</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: RISK SIGNAL / EVIDENCE */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Risk Signal & Evidence</h2>
            
            {mutation.data ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex gap-3 ${isElevated ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                  {isElevated ? (
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 flex-shrink-0 text-green-500" />
                  )}
                  <div>
                    <div className={`text-sm font-bold ${isElevated ? 'text-amber-900' : 'text-green-900'}`}>
                      {mutation.data.prediction.label || "Intelligence Signal"}
                    </div>
                    <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Classification threshold is determined by certified backend metadata.
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Model Evidence</div>
                  <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded p-3">
                    <p className="mb-2"><strong>ML to FAIR Boundary:</strong></p>
                    <p className="mb-2">The calculated probability (p15) is an intermediate intelligence signal. It does not natively represent total financial exposure without translating to a FAIR Loss Event Frequency (LEF) distribution.</p>
                    <p className="italic text-xs">Direct model feature coefficient explanations are disabled to prevent spurious causal interpretations of correlations.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-slate-400 h-full mt-10">
                <span className="text-sm">Awaiting prediction...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LOWER: MODEL VALIDATION / METHODOLOGY */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Model Evaluation — Offline Test Set</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Certified Artifact: incident_likelihood_v1
          </span>
        </div>
        
        <p className="text-sm text-slate-600 mb-6">
          <strong>Disclosure:</strong> Metrics shown below are from the certified synthetic offline evaluation on the test set. They serve as a baseline model-quality reference, not real-time production performance.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Architecture</div>
            <div className="text-sm font-bold text-slate-900">Logistic Reg</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Val ROC-AUC</div>
            <div className="text-sm font-bold text-slate-900">0.718</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Test ROC-AUC</div>
            <div className="text-sm font-bold text-slate-900">0.734</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Test PR-AUC</div>
            <div className="text-sm font-bold text-slate-900">0.573</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Test Recall</div>
            <div className="text-sm font-bold text-slate-900">0.747</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Test Brier Score</div>
            <div className="text-sm font-bold text-slate-900">0.186</div>
          </div>
        </div>
      </section>

    </div>
  );
}
