"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/auth/supabase";
import { getAuditActivity, AuditFilters } from "@/lib/api/audit";
import { AuditRecord, PaginationMeta } from "@/lib/types/api";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { Filter, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

export default function AuditPage() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: 25, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [actionFilter, setActionFilter] = useState<string>("");
  const [resourceFilter, setResourceFilter] = useState<string>("");
  
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const fetchAudit = async (page: number, action: string, resource: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Your session has expired. Please sign in again.");
        return;
      }
      
      const filters: AuditFilters = { page, pageSize: 25 };
      if (action) filters.action = action;
      if (resource) filters.resourceType = resource;

      const data = await getAuditActivity(session.access_token, filters);
      setRecords(data.data);
      setPagination(data.pagination);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (errorMessage === "UNAUTHORIZED") {
        setError("Your session has expired. Please sign in again.");
      } else if (errorMessage === "FORBIDDEN") {
        setError("You don't have permission to view audit activity.");
      } else {
        setError("Unable to load audit activity.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit(1, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    fetchAudit(1, actionFilter, resourceFilter);
  };

  const handleClearFilters = () => {
    setActionFilter("");
    setResourceFilter("");
    fetchAudit(1, "", "");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(pagination.total / pagination.page_size)) return;
    fetchAudit(newPage, actionFilter, resourceFilter);
  };

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
         <ErrorState error={new Error(error)} retry={() => fetchAudit(1, actionFilter, resourceFilter)} />
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.page_size) || 1;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audit Activity</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review organization-scoped security, risk, compliance and administrative activity.
        </p>
      </div>

      <div className="bg-white p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-medium text-slate-700 mb-1">Action</label>
          <select 
            className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:border-[#0F3F2E]"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="ROLE_UPDATED">ROLE_UPDATED</option>
            <option value="AI_QUERY">AI_QUERY</option>
            <option value="RUN_FAIR_SCENARIO">RUN_FAIR_SCENARIO</option>
            <option value="RUN_OPTIMIZATION">RUN_OPTIMIZATION</option>
            <option value="RUN_ML_PREDICTION">RUN_ML_PREDICTION</option>
            <option value="UPDATE_CONTROL_STATUS">UPDATE_CONTROL_STATUS</option>
          </select>
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-medium text-slate-700 mb-1">Resource Type</label>
          <select 
            className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:border-[#0F3F2E]"
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
          >
            <option value="">All Resources</option>
            <option value="USER_ROLE">User Role</option>
            <option value="AI_ENGINE">AI Engine</option>
            <option value="FAIR_CALCULATION">FAIR Calculation</option>
            <option value="OPTIMIZATION_ENGINE">Optimization Engine</option>
            <option value="ML_ENGINE">ML Engine</option>
            <option value="COMPLIANCE_CONTROL">Compliance Control</option>
          </select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-[#0F3F2E] text-white text-sm font-medium rounded hover:bg-[#0a2e22] transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button 
            onClick={handleClearFilters}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded hover:bg-slate-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading audit activity..." />
      ) : records.length === 0 ? (
        <EmptyState 
          title="No audit activity yet" 
          description="Activity will appear here as security, risk, compliance and administrative actions are recorded." 
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col w-full min-w-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Timestamp</th>
                  <th className="px-6 py-4 whitespace-nowrap">Actor</th>
                  <th className="px-6 py-4 whitespace-nowrap">Action</th>
                  <th className="px-6 py-4 whitespace-nowrap">Resource</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {new Date(record.timestamp).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{record.actor_name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{record.actor_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {record.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {record.resource_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => setSelectedRecord(record)}
                        className="text-[#0F3F2E] hover:underline text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-lg">
            <span className="text-sm text-slate-500">
              Showing {(pagination.page - 1) * pagination.page_size + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total} records
            </span>
            <div className="flex gap-2">
              <button 
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={pagination.page >= totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Detail Drawer Overlay */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white shadow-xl w-full max-w-md h-full flex flex-col animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Audit Record Details</h3>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">Timestamp</label>
                <div className="mt-1 text-sm text-slate-900">{new Date(selectedRecord.timestamp).toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Actor</label>
                  <div className="mt-1 text-sm text-slate-900">{selectedRecord.actor_name || selectedRecord.actor_email}</div>
                  <div className="text-xs text-slate-500">{selectedRecord.actor_id}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Action</label>
                  <div className="mt-1 text-sm font-medium text-slate-900">{selectedRecord.action}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Resource Type</label>
                  <div className="mt-1 text-sm text-slate-900">{selectedRecord.resource_type}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Resource ID</label>
                  <div className="mt-1 text-sm text-slate-900 font-mono break-all">{selectedRecord.resource_id}</div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">Status</label>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedRecord.status}
                  </span>
                </div>
              </div>
              {selectedRecord.details && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Details</label>
                  <div className="mt-1 text-sm text-slate-900 bg-slate-50 p-3 rounded border border-slate-200">
                    {selectedRecord.details}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
