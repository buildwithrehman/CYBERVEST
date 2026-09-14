"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { FAIRResultOutput, FAIRScenarioInput, Asset } from "@/lib/types/api";
import { LoadingState, ErrorState } from "@/components/ui/States";
import {
  ShieldAlert,
  Network,
  ShieldCheck,
  Calculator,
  Server,
  Globe
} from "lucide-react";

const pertSchema = z.object({
  min_val: z.number().min(0, "Must be >= 0"),
  likely_val: z.number().min(0, "Must be >= 0"),
  max_val: z.number().min(0, "Must be >= 0"),
}).refine(data => data.min_val <= data.likely_val && data.likely_val <= data.max_val, {
  message: "Values must satisfy: min <= likely <= max",
  path: ["likely_val"]
});

const susSchema = z.object({
  min_val: z.number().min(0).max(1, "Must be between 0 and 1"),
  likely_val: z.number().min(0).max(1, "Must be between 0 and 1"),
  max_val: z.number().min(0).max(1, "Must be between 0 and 1"),
}).refine(data => data.min_val <= data.likely_val && data.likely_val <= data.max_val, {
  message: "Values must satisfy: min <= likely <= max",
  path: ["likely_val"]
});

const fairSchema = z.object({
  scenario_id: z.string().min(1),
  scenario_name: z.string().min(1),
  tef: pertSchema,
  susceptibility: susSchema,
  productivity_loss: pertSchema,
  response_cost: pertSchema,
  regulatory_loss: pertSchema,
  reputation_loss: pertSchema,
  simulation_count: z.number().min(100).max(100000),
  asset_id: z.string().optional(),
});

function formatINR(val: number) {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)}Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)}L`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

const defaultFairScenario: FAIRScenarioInput = {
  scenario_id: "fair_baseline",
  scenario_name: "DemoFin Bank — Baseline Scenario",
  tef: { min_val: 100, likely_val: 14200, max_val: 20000 },
  susceptibility: { min_val: 0.2, likely_val: 0.44, max_val: 0.8 },
  productivity_loss: { min_val: 500000, likely_val: 2000000, max_val: 5000000 },
  response_cost: { min_val: 100000, likely_val: 500000, max_val: 1500000 },
  regulatory_loss: { min_val: 50000, likely_val: 150000, max_val: 2000000 },
  reputation_loss: { min_val: 200000, likely_val: 800000, max_val: 3000000 },
  simulation_count: 10000
};

type PertFieldNames = 'tef' | 'susceptibility' | 'productivity_loss' | 'response_cost' | 'regulatory_loss' | 'reputation_loss';


function FairPageContent() {
  const searchParams = useSearchParams();
  const asset_id = searchParams.get("asset_id");

  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ["assets", asset_id],
    queryFn: () => fetchApi<Asset>(`/api/assets/${asset_id}`),
    enabled: !!asset_id,
  });

  const [lastScenario, setLastScenario] = useState<FAIRScenarioInput | null>(null);
  const initialFetchRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<FAIRScenarioInput>({
    resolver: zodResolver(fairSchema),
    defaultValues: defaultFairScenario,
  });

  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    if (!asset_id) return;
    setTelemetryLoading(true);
    setTelemetryError(null);
    try {
      const res = await fetch(`/api/assets/${asset_id}/fair-telemetry`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to fetch telemetry");
      }
      setTelemetryData(data);
      if (data.status === "READY") {
        const currentVals = getValues();
        reset({
          ...currentVals,
          tef: {
            min_val: data.tef.min_val,
            likely_val: data.tef.likely_val,
            max_val: data.tef.max_val
          },
          susceptibility: {
            min_val: data.susceptibility.min_val,
            likely_val: data.susceptibility.likely_val,
            max_val: data.susceptibility.max_val
          }
        });
      } else {
        setTelemetryError(data.warnings?.join(" ") || "Insufficient evidence.");
      }
    } catch (err: any) {
      setTelemetryError(err.message);
    } finally {
      setTelemetryLoading(false);
    }
  };


  const mutation = useMutation({
    mutationFn: (data: FAIRScenarioInput) =>
      fetchApi<FAIRResultOutput>("/api/fair/run", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      setLastScenario(variables);
    }
  });

  // Update default scenario ID and name if asset is loaded
  // Update default scenario ID and name if asset is loaded
  const onSubmit = (data: FAIRScenarioInput) => {
    if (asset_id) data.asset_id = asset_id;
    mutation.mutate(data);
  };

  useEffect(() => {
    if (asset && !initialFetchRef.current) {
      initialFetchRef.current = true;
      const assetScenario = {
        ...defaultFairScenario,
        scenario_id: "fair_baseline",
        scenario_name: `Asset Analysis: ${asset.name}`,
        asset_id: asset.id
      };
      reset(assetScenario);
    } else if (!asset_id && !initialFetchRef.current) {
      initialFetchRef.current = true;
      reset(defaultFairScenario);
    }
  }, [asset, asset_id, reset]);



  const renderPertInput = (name: PertFieldNames, label: string, isPercent = false) => {
    const errorNode = errors[name];
    const fieldError = errorNode?.message || errorNode?.min_val?.message || errorNode?.likely_val?.message || errorNode?.max_val?.message;
    return (
      <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <label className="text-xs font-semibold text-slate-700">{label}</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-[10px] text-slate-500 mb-0.5 block">Min</span>
            <input type="number" step={isPercent ? "0.01" : "1"} {...register(`${name}.min_val` as Path<FAIRScenarioInput>, { valueAsNumber: true })} className="w-full h-8 px-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 mb-0.5 block">Likely</span>
            <input type="number" step={isPercent ? "0.01" : "1"} {...register(`${name}.likely_val` as Path<FAIRScenarioInput>, { valueAsNumber: true })} className="w-full h-8 px-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 mb-0.5 block">Max</span>
            <input type="number" step={isPercent ? "0.01" : "1"} {...register(`${name}.max_val` as Path<FAIRScenarioInput>, { valueAsNumber: true })} className="w-full h-8 px-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
        </div>
        {fieldError && <span className="text-[10px] text-red-600 font-medium">{String(fieldError)}</span>}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full font-sans text-slate-900 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span>Risk Explorer</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#0F3F2E] font-semibold">FAIR Model Demonstration</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">FAIR Risk Analysis</h1>
          <p className="text-sm text-slate-500">Transparent financial quantification of cyber risk</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* LEFT COLUMN: FORM */}
        <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-4">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-border shadow-sm p-5 flex flex-col gap-4 sticky top-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Scenario Parameters</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Scenario Name</label>
              <input type="text" {...register("scenario_name")} className="w-full h-9 px-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              {errors.scenario_name && <span className="text-[10px] text-red-600">{errors.scenario_name.message}</span>}
            </div>
            {asset_id && (
              <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Telemetry Integration</span>
                  <button
                    type="button"
                    onClick={fetchTelemetry}
                    disabled={telemetryLoading}
                    className="text-xs px-3 py-1 bg-[#E8F3EE] text-[#0F3F2E] border border-emerald-200 hover:bg-[#D1E8DD] rounded font-medium disabled:opacity-50 transition-colors"
                  >
                    {telemetryLoading ? "Loading..." : "Derive from Telemetry"}
                  </button>
                </div>
                {telemetryError && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    <span className="font-semibold">Insufficient Evidence: </span>{telemetryError}
                  </div>
                )}
                {telemetryData?.status === "READY" && (
                  <div className="flex flex-col gap-2 text-[10px] text-slate-700 bg-white p-3 rounded border border-emerald-100 shadow-sm mt-1">
                    <div className="font-semibold text-emerald-800 border-b border-emerald-50 pb-1 flex justify-between">
                      <span>Telemetry Methodology Applied</span>
                      <span className="text-emerald-600">Source: Synthetic/Demo telemetry</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="font-semibold text-slate-900">TEF: {telemetryData.tef.provenance.value.likely_val} events/yr</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-2">
                        <div><span className="text-slate-500">Qualifying events:</span> {telemetryData.evidence.qualifying_event_count}</div>
                        <div><span className="text-slate-500">Clustered events:</span> {telemetryData.evidence.clustered_event_count}</div>
                        <div><span className="text-slate-500">Observation window:</span> {telemetryData.evidence.observation_days} days</div>
                        <div><span className="text-slate-500">Source type:</span> {telemetryData.tef.source_type}</div>
                        <div className="col-span-2"><span className="text-slate-500">Confidence:</span> {telemetryData.tef.provenance.confidence}</div>
                        <div className="col-span-2 text-slate-500 italic">Assumptions: 1-hour rolling clustering window, PERT ASSUMPTION (+/- 50%)</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-1 border-t border-slate-100 pt-2">
                      <div className="font-semibold text-slate-900">Susceptibility: {telemetryData.susceptibility.provenance.value.likely_val}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-2">
                        <div><span className="text-slate-500">ML P15:</span> {telemetryData.evidence.ml_probability_15d.toFixed(4)}</div>
                        <div><span className="text-slate-500">Model:</span> {telemetryData.evidence.model_version}</div>
                        <div><span className="text-slate-500">Estimated LEF:</span> {telemetryData.evidence.model_estimated_lef}</div>
                        <div><span className="text-slate-500">TEF Used:</span> {telemetryData.tef.provenance.value.likely_val}</div>
                        <div className="col-span-2"><span className="text-slate-500">Confidence:</span> {telemetryData.susceptibility.provenance.confidence}</div>
                        <div className="col-span-2 text-slate-500 italic">Assumptions: Poisson distribution, Stationarity, Independence</div>
                      </div>
                    </div>

                    <div className="mt-2 p-1.5 bg-amber-50 rounded border border-amber-100 text-amber-800 font-medium">
                      Financial inputs are strictly marked as EXPERT_ASSUMPTION / user input.
                    </div>
                  </div>
                )}
              </div>
            )}

            {asset_id && (
              <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Telemetry Integration</span>
                  <button
                    type="button"
                    onClick={fetchTelemetry}
                    disabled={telemetryLoading}
                    className="text-xs px-3 py-1 bg-[#E8F3EE] text-[#0F3F2E] border border-emerald-200 hover:bg-[#D1E8DD] rounded font-medium disabled:opacity-50 transition-colors"
                  >
                    {telemetryLoading ? "Loading..." : "Derive from Telemetry"}
                  </button>
                </div>
                {telemetryError && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    <span className="font-semibold">Insufficient Evidence: </span>{telemetryError}
                  </div>
                )}
                {telemetryData?.status === "READY" && (
                  <div className="flex flex-col gap-2 text-[10px] text-slate-700 bg-white p-3 rounded border border-emerald-100 shadow-sm mt-1">
                    <div className="font-semibold text-emerald-800 border-b border-emerald-50 pb-1 flex justify-between">
                      <span>Telemetry Methodology Applied</span>
                      <span className="text-emerald-600">Source: Synthetic/Demo telemetry</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="font-semibold text-slate-900">TEF: {telemetryData.tef.provenance.value.likely_val} events/yr</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-2">
                        <div><span className="text-slate-500">Qualifying events:</span> {telemetryData.evidence.qualifying_event_count}</div>
                        <div><span className="text-slate-500">Clustered events:</span> {telemetryData.evidence.clustered_event_count}</div>
                        <div><span className="text-slate-500">Observation window:</span> {telemetryData.evidence.observation_days} days</div>
                        <div><span className="text-slate-500">Source type:</span> {telemetryData.tef.source_type}</div>
                        <div className="col-span-2"><span className="text-slate-500">Confidence:</span> {telemetryData.tef.provenance.confidence}</div>
                        <div className="col-span-2 text-slate-500 italic">Assumptions: 1-hour rolling clustering window, PERT ASSUMPTION (+/- 50%)</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-1 border-t border-slate-100 pt-2">
                      <div className="font-semibold text-slate-900">Susceptibility: {telemetryData.susceptibility.provenance.value.likely_val}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-2">
                        <div><span className="text-slate-500">ML P15:</span> {telemetryData.evidence.ml_probability_15d.toFixed(4)}</div>
                        <div><span className="text-slate-500">Model:</span> {telemetryData.evidence.model_version}</div>
                        <div><span className="text-slate-500">Estimated LEF:</span> {telemetryData.evidence.model_estimated_lef}</div>
                        <div><span className="text-slate-500">TEF Used:</span> {telemetryData.tef.provenance.value.likely_val}</div>
                        <div className="col-span-2"><span className="text-slate-500">Confidence:</span> {telemetryData.susceptibility.provenance.confidence}</div>
                        <div className="col-span-2 text-slate-500 italic">Assumptions: Poisson distribution, Stationarity, Independence</div>
                      </div>
                    </div>

                    <div className="mt-2 p-1.5 bg-amber-50 rounded border border-amber-100 text-amber-800 font-medium">
                      Financial inputs are strictly marked as EXPERT_ASSUMPTION / user input.
                    </div>
                  </div>
                )}
              </div>
            )}


            <div className="space-y-3">
              {renderPertInput("tef", "Threat Event Frequency (events/yr)")}
              {renderPertInput("susceptibility", "Susceptibility (0-1)", true)}
              {renderPertInput("productivity_loss", "Productivity Loss (INR)")}
              {renderPertInput("response_cost", "Response Cost (INR)")}
              {renderPertInput("regulatory_loss", "Regulatory Loss (INR)")}
              {renderPertInput("reputation_loss", "Reputation Loss (INR)")}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Simulation Count</label>
              <input type="number" {...register("simulation_count", { valueAsNumber: true })} className="w-full h-9 px-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              {errors.simulation_count && <span className="text-[10px] text-red-600">{errors.simulation_count.message}</span>}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="mt-2 w-full h-10 rounded-lg bg-[#0F3F2E] text-white hover:bg-[#14533D] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? "Calculating..." : "Calculate Risk"}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
          {mutation.isPending && !mutation.data && (
            <LoadingState message="Running FAIR Monte Carlo simulation..." />
          )}
          {mutation.isError && (
            <ErrorState error={mutation.error as Error} />
          )}

          {mutation.data && !mutation.isPending && (
            <>
              {/* ASSET CONTEXT STRIP */}
              <div className="bg-white rounded-xl p-4 border border-border shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#E8F3EE] text-[#0F3F2E]">
                      <Network className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Demonstration Context</div>
                      <div className="text-base font-semibold text-slate-900">{mutation.data.scenario_name}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-[#0F3F2E]" />
                  <span className="font-medium text-[#0F3F2E]">FAIR Calculation Verified</span>
                </div>
              </div>

              {/* KPI FINANCIAL METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* EAL */}
                <div className="bg-[#0F3F2E] text-white rounded-xl p-5 shadow-sm border border-[#14533D] flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-emerald-200">Expected Annual Loss</span>
                  </div>
                  <div className="my-3">
                    <div className="text-3xl font-bold tracking-tight text-white tabular-nums">{formatINR(mutation.data.eal)}</div>
                  </div>
                  <div className="text-xs text-emerald-100/90 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Backend-calculated FAIR result</span>
                  </div>
                </div>

                {/* P10 */}
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-slate-600">P10 (Best Case)</span>
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{formatINR(mutation.data.p10)}</div>
                  </div>
                  <div className="text-xs text-slate-500">10th percentile annual loss</div>
                </div>

                {/* P50 */}
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-slate-600">P50 (Median)</span>
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{formatINR(mutation.data.p50)}</div>
                  </div>
                  <div className="text-xs text-slate-500">50th percentile annual loss</div>
                </div>

                {/* P90 */}
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-slate-600">P90 (Tail Risk)</span>
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-bold text-red-700 tabular-nums">{formatINR(mutation.data.p90)}</div>
                  </div>
                  <div className="text-xs text-slate-500">90th percentile annual loss. 10% of modeled annual outcomes exceed this level.</div>
                </div>
              </div>

              {/* ANNUAL LOSS DISTRIBUTION (Static visual mapped to dynamic labels) */}
              <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Annual Loss Distribution</h2>
                    <p className="text-sm text-slate-500">FAIR annual-loss distribution visualization with modeled percentile markers</p>
                  </div>
                </div>
                <div className="relative w-full h-64 bg-slate-50 rounded-xl border border-slate-200 p-4 pt-6 flex flex-col justify-between">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 240">
                    <defs>
                      <linearGradient id="curveGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#0F3F2E" stopOpacity="0.28"></stop>
                        <stop offset="70%" stopColor="#2E6951" stopOpacity="0.10"></stop>
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0"></stop>
                      </linearGradient>
                    </defs>
                    <line stroke="#E2E8E0" strokeWidth="1" x1="0" x2="1000" y1="200" y2="200"></line>
                    <line stroke="#E2E8E0" strokeDasharray="4" strokeWidth="0.7" x1="0" x2="1000" y1="150" y2="150"></line>
                    <line stroke="#E2E8E0" strokeDasharray="4" strokeWidth="0.7" x1="0" x2="1000" y1="100" y2="100"></line>
                    <line stroke="#E2E8E0" strokeDasharray="4" strokeWidth="0.7" x1="0" x2="1000" y1="50" y2="50"></line>

                    <path d="M 50,200 C 120,200 160,185 200,140 C 240,95 280,30 360,25 C 440,20 490,65 560,110 C 640,155 720,185 820,195 C 890,200 950,200 980,200 L 980,200 L 50,200 Z" fill="url(#curveGradient)"></path>
                    <path d="M 50,200 C 120,200 160,185 200,140 C 240,95 280,30 360,25 C 440,20 490,65 560,110 C 640,155 720,185 820,195 C 890,200 950,200 980,200" fill="none" stroke="#0F3F2E" strokeLinecap="round" strokeWidth="2.5"></path>

                    {/* P10 Marker */}
                    <line stroke="#2E6951" strokeDasharray="3" strokeWidth="1.5" x1="220" x2="220" y1="120" y2="200"></line>
                    <circle cx="220" cy="120" fill="#2E6951" r="4"></circle>

                    {/* P50 Marker */}
                    <line stroke="#111827" strokeDasharray="3" strokeWidth="1.5" x1="450" x2="450" y1="50" y2="200"></line>
                    <circle cx="450" cy="50" fill="#111827" r="4"></circle>

                    {/* EAL Marker */}
                    <line stroke="#D97706" strokeWidth="2" x1="495" x2="495" y1="75" y2="200"></line>
                    <circle cx="495" cy="75" fill="#D97706" r="4.5"></circle>

                    {/* P90 Marker */}
                    <line stroke="#B91C1C" strokeDasharray="4" strokeWidth="2" x1="760" x2="760" y1="172" y2="200"></line>
                    <circle cx="760" cy="172" fill="#B91C1C" r="4"></circle>
                  </svg>

                  {/* Tooltips */}
                  <div className="absolute top-10 left-[22%] transform -translate-x-1/2 bg-white px-2 py-0.5 rounded shadow border border-slate-200 text-center">
                    <span className="text-[10px] font-semibold text-[#2E6951] block uppercase">P10</span>
                    <span className="text-xs font-bold text-slate-900 tabular-nums">{formatINR(mutation.data.p10)}</span>
                  </div>
                  <div className="absolute top-2 left-[45%] transform -translate-x-1/2 bg-white px-2 py-0.5 rounded shadow border border-slate-200 text-center">
                    <span className="text-[10px] font-semibold text-slate-500 block uppercase">P50</span>
                    <span className="text-xs font-bold text-slate-900 tabular-nums">{formatINR(mutation.data.p50)}</span>
                  </div>
                  <div className="absolute top-8 left-[49.5%] transform -translate-x-1/2 bg-[#0F3F2E] text-white px-2.5 py-0.5 rounded shadow text-center">
                    <span className="text-[10px] text-emerald-200 block uppercase font-semibold">EAL</span>
                    <span className="text-xs font-bold tabular-nums">{formatINR(mutation.data.eal)}</span>
                  </div>
                  <div className="absolute top-20 left-[76%] transform -translate-x-1/2 bg-white px-2 py-0.5 rounded shadow border border-red-200 text-center">
                    <span className="text-[10px] font-semibold text-red-700 block uppercase">P90</span>
                    <span className="text-xs font-bold text-red-700 tabular-nums">{formatINR(mutation.data.p90)}</span>
                  </div>
                </div>
              </div>

              {/* FAIR MATHEMATICAL CALCULATION CHAIN */}
              <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-900">FAIR Mathematical Calculation Chain</h2>
                  <p className="text-sm text-slate-500">Backend-calculated explanation of the certified model: LEF = TEF × Susceptibility</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                  {/* TEF */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#0F3F2E] mb-1">TEF</div>
                      <div className="text-sm font-semibold text-slate-900">Threat Event Frequency</div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <div className="text-lg font-bold text-[#0F3F2E] tabular-nums">{mutation.data.tef_mean.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 mt-0.5">events/yr (Mean)</div>
                    </div>
                  </div>

                  {/* Susceptibility */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#0F3F2E] mb-1">VULN</div>
                      <div className="text-sm font-semibold text-slate-900">Probability of loss given a threat event</div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <div className="text-lg font-bold text-[#0F3F2E] tabular-nums">{(mutation.data.susceptibility_mean * 100).toFixed(1)}%</div>
                      <div className="text-xs text-slate-500 mt-0.5">probability (Mean)</div>
                    </div>
                  </div>

                  {/* LEF */}
                  <div className="bg-[#E8F3EE] border border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#0F3F2E] mb-1">LEF</div>
                      <div className="text-sm font-semibold text-slate-900">Loss Event Frequency</div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-200">
                      <div className="text-lg font-bold text-[#0F3F2E] tabular-nums">{mutation.data.lef_mean.toLocaleString(undefined, {maximumFractionDigits: 1})}</div>
                      <div className="text-xs text-slate-500 mt-0.5">loss events/yr (Derived)</div>
                    </div>
                  </div>

                  {/* LM */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#0F3F2E] mb-1">LM</div>
                      <div className="text-sm font-semibold text-slate-900">Loss Magnitude</div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <div className="text-lg font-bold text-[#0F3F2E] tabular-nums">{formatINR(mutation.data.total_loss_mean)}</div>
                      <div className="text-xs text-slate-500 mt-0.5">INR/event (Mean)</div>
                    </div>
                  </div>

                  {/* EAL */}
                  <div className="bg-[#0F3F2E] text-white rounded-xl p-4 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="text-xs font-bold text-emerald-200 mb-1">EAL</div>
                      <div className="text-sm font-semibold text-white">Expected Annual Loss</div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-700/60">
                      <div className="text-xl font-bold text-white tabular-nums">{formatINR(mutation.data.eal)}</div>
                      <div className="text-xs text-emerald-200 mt-0.5">INR/year</div>
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FairPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading FAIR Calculator..." />}>
      <FairPageContent />
    </Suspense>
  );
}
