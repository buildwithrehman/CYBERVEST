"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { MLPredictRequest, MLPredictResponse, MLFeaturePayload } from "@/lib/types/api";
import { ErrorState } from "@/components/ui/States";
import { 
  Play, 
  BrainCircuit, 
  AlertTriangle,
  Info,
  CheckCircle2,
  Server,
  Database,
  Monitor
} from "lucide-react";

const DEMO_PROFILES: Record<string, MLFeaturePayload> = {
  "profile-1": {
    asset_type: "Workstation",
    criticality: "Low",
    internet_exposed: false,
    vuln_count: 0,
    cvss_max: 0.0,
    known_exploited_count: 0,
    recent_event_count_30d: 0,
    prior_incident_count: 0
  },
  "profile-2": {
    asset_type: "Server",
    criticality: "Medium",
    internet_exposed: true,
    vuln_count: 5,
    cvss_max: 7.5,
    known_exploited_count: 0,
    recent_event_count_30d: 50,
    prior_incident_count: 0
  },
  "profile-3": {
    asset_type: "Database",
    criticality: "Critical",
    internet_exposed: true,
    vuln_count: 25,
    cvss_max: 9.8,
    known_exploited_count: 3,
    recent_event_count_30d: 500,
    prior_incident_count: 2
  }
};

export default function MLRiskIntelligencePage() {
  const [selectedProfile, setSelectedProfile] = useState<string>("profile-1");

  const mutation = useMutation({
    mutationFn: (req: MLPredictRequest) =>
      fetchApi<MLPredictResponse>("/api/ml/predict", {
        method: "POST",
        body: JSON.stringify(req),
      })
  });

  const handlePredict = () => {
    mutation.mutate({
      organization_id: "00000000-0000-0000-0000-000000000000",
      features: DEMO_PROFILES[selectedProfile]
    });
  };

  const isElevated = mutation.data?.classification === "Elevated Signal";

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      
      {/* HEADER SECTION */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">ML Risk Intelligence</h1>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 border border-slate-200">
              {mutation.data?.model_name || "incident_likelihood_v1"}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Predictive intelligence estimating 15-day forward incident likelihood based on asset evidence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePredict}
            disabled={mutation.isPending}
            className="px-5 py-2.5 bg-[#0F3F2E] hover:bg-[#14533D] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{mutation.isPending ? "Running Model..." : "Run Prediction"}</span>
          </button>
        </div>
      </section>

      {mutation.isError && (
        <ErrorState error={mutation.error as Error} />
      )}

      {/* FAIR BOUNDARY NOTICE */}
      <section className="bg-[#EAF5EE] border border-[#0F3F2E]/20 text-[#0F3F2E] rounded-lg p-4 flex items-start gap-3 shadow-sm">
        <Info className="w-5 h-5 text-[#0F3F2E] mt-0.5 flex-shrink-0" />
        <div className="text-sm leading-relaxed">
          <strong>Methodology Boundary:</strong> ML output is an intelligence signal predicting the probability of at least one incident within the next 15 days. Analysts can use it as evidence when defining FAIR assumptions; however, FAIR financial exposure (EAL, LEF, TEF) is calculated separately by the certified FAIR engine.
        </div>
      </section>

      {/* MAIN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT / TOP: PREDICTION INPUT / CONTEXT */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Prediction Context</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Asset Evidence Input</label>
                <select 
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="mt-2 w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="profile-1">A. Lower-Risk Context (Workstation)</option>
                  <option value="profile-2">B. Medium-Risk Context (Server)</option>
                  <option value="profile-3">C. Higher-Risk Context (Database)</option>
                </select>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 font-mono space-y-1">
                <div>Asset Type: {DEMO_PROFILES[selectedProfile].asset_type}</div>
                <div>Criticality: {DEMO_PROFILES[selectedProfile].criticality}</div>
                <div>Internet Exposed: {DEMO_PROFILES[selectedProfile].internet_exposed ? "Yes" : "No"}</div>
                <div>Vuln Count: {DEMO_PROFILES[selectedProfile].vuln_count}</div>
                <div>CVSS Max: {DEMO_PROFILES[selectedProfile].cvss_max}</div>
                <div>Exploits: {DEMO_PROFILES[selectedProfile].known_exploited_count}</div>
              </div>
              
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Prediction Window</label>
                <div className="mt-1 text-sm text-slate-900 font-medium">Next 15 Days (Rolling)</div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Evaluation Context</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    Demonstration Prediction
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Assessing synthetic temporal data context defined by the API contract.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE: INCIDENT LIKELIHOOD RESULT */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Model Result</h2>
            
            {mutation.data ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                <BrainCircuit className="w-12 h-12 text-[#0F3F2E] mb-4 opacity-80" />
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Modeled Incident Likelihood</div>
                <div className="text-6xl font-bold tracking-tight text-[#0F3F2E]">
                  {(mutation.data.prediction * 100).toFixed(2)}%
                </div>
                {mutation.data.model_version && (
                  <div className="mt-4 text-xs text-slate-400">
                    Model Version: {mutation.data.model_version}
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
                <span className="text-xs text-slate-400 mt-2">Invokes actual server-side inference</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: RISK SIGNAL / EVIDENCE */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Risk Signal</h2>
            
            {mutation.data ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${isElevated ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {mutation.data.classification || "Intelligence Signal"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Classification threshold is determined by certified backend metadata.
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Model Context</div>
                  <div className="text-sm text-slate-600 italic">
                    Feature contributions and individual explanations are not exposed by the current API contract. Signal is derived strictly from the certified organizational baseline telemetry.
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
          <h2 className="text-lg font-semibold text-slate-900">Model Validation — Synthetic Dataset</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Certified Artifact: incident_likelihood_v1
          </span>
        </div>
        
        <p className="text-sm text-slate-600 mb-6">
          <strong>Disclosure:</strong> Metrics shown below are from the certified synthetic temporal evaluation (11,064 snapshots, chronological split). They should <em>not</em> be interpreted as production, real-world, or enterprise predictive accuracy.
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
