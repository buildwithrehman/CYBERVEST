"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/auth/supabase";
import { getOrganizationMembers, assignRole } from "@/lib/api/admin";
import { OrganizationMember } from "@/lib/types/api";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { UserPlus, ShieldAlert, MoreVertical } from "lucide-react";

export default function RolesAccessPage() {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (mounted) setError("Your session has expired. Please sign in again.");
          return;
        }
        
        if (mounted) {
          setCurrentUserId(session.user.id);
          setSessionToken(session.access_token);
        }

        const data = await getOrganizationMembers(session.access_token);
        if (mounted) {
          setMembers(data.members);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setLoading(false);
          if (err.message === "UNAUTHORIZED") {
            setError("Your session has expired. Please sign in again.");
          } else if (err.message === "FORBIDDEN") {
            setError("You don't have permission to manage roles.");
          } else {
            setError("Unable to load organization access data.");
          }
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const currentUser = members.find(m => m.user_id === currentUserId);
  const isAdmin = currentUser?.role === "ADMIN";

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    if (!sessionToken) return;
    setUpdatingId(targetUserId);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      await assignRole(sessionToken, { target_user_id: targetUserId, role: newRole });
      
      // Refresh
      const data = await getOrganizationMembers(sessionToken);
      setMembers(data.members);
      setUpdateSuccess("Role updated successfully.");
      
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update role");
      setTimeout(() => setUpdateError(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <LoadingState message="Loading organization members..." />;
  }

  if (error) {
    return <ErrorState error={new Error(error)} />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Roles & Access</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage organization members and their permission levels.
          </p>
        </div>
        <button 
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0F3F2E] text-white text-sm font-medium rounded opacity-50 cursor-not-allowed"
          title="Invitations are currently disabled in this environment"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      
      {/* Role Definitions */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm w-full mb-8">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900">Role Definitions</h2>
          <p className="text-sm text-slate-500">System roles and their permitted access scopes.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {[
            { id: "ADMIN", name: "Admin", desc: "Full administrative access to all system settings, users, and data.", scope: "Read/Write All, User Management", active: true },
            { id: "CISO", name: "CISO", desc: "Executive oversight of security posture, risks, and investments.", scope: "Read/Write Cyber & Risk Data", active: true },
            { id: "SECURITY_ANALYST", name: "Security Analyst", desc: "Manages operational security, vulnerabilities, and telemetry.", scope: "Read/Write Assets & Security", active: true },
            { id: "RISK_MANAGER", name: "Risk Manager", desc: "Conducts FAIR assessments and models financial risk scenarios.", scope: "Read/Write Risk & FAIR Data", active: true },
            { id: "EXECUTIVE", name: "Executive", desc: "Views high-level executive dashboards and ROSI metrics.", scope: "Read Only (Dashboards, Risk)", active: true },
            { id: "AUDITOR", name: "Auditor", desc: "Reviews compliance frameworks, evidence, and audit logs.", scope: "Read Only (Compliance, Audit)", active: true },
            { id: "COMPLIANCE_OFFICER", name: "Compliance Officer", desc: "Manages compliance frameworks and uploads evidence.", scope: "Read/Write Compliance", active: false },
            { id: "VIEWER", name: "Viewer", desc: "Basic read-only access to non-sensitive dashboards.", scope: "Read Only (Basic)", active: false }
          ].map(r => (
            <div key={r.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900">{r.name}</h3>
                  {!r.active && <span className="text-[10px] uppercase tracking-wider font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Coming Soon</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1">{r.desc}</p>
              </div>
              <div className="sm:text-right">
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                  {r.scope}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(updateError || updateSuccess) && (
        <div className={`p-4 rounded text-sm flex items-start gap-3 \${updateError ? 'bg-red-50 text-red-800' : 'bg-green-50 text-[#0F3F2E]'}`}>
          {updateError && <ShieldAlert className="w-5 h-5 shrink-0" />}
          <div>{updateError || updateSuccess}</div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="p-12 text-center border border-slate-200 rounded-lg bg-white">
          <p className="text-slate-500">No members found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm w-full min-w-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">User</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap">Joined</th>
                  <th className="px-6 py-4 whitespace-nowrap">Role</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {members.map((member) => (
                  <tr key={member.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {member.full_name || "Unknown User"}
                          {member.user_id === currentUserId && <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">You</span>}
                        </span>
                        <span className="text-slate-500 text-xs">{member.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isAdmin ? (
                        <select 
                          className="text-sm border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F3F2E]/20 focus:border-[#0F3F2E] disabled:opacity-50"
                          value={member.role}
                          disabled={updatingId === member.user_id}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="CISO">CISO</option>
                          <option value="SECURITY_ANALYST">Security Analyst</option>
                          <option value="RISK_MANAGER">Risk Manager</option>
                          <option value="EXECUTIVE">Executive</option>
                          <option value="AUDITOR">Auditor</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {member.role.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-400">
                      <button 
                        disabled={!isAdmin || member.user_id === currentUserId}
                        className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                        title={isAdmin ? "Remove user (Coming soon)" : "No permission"}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
