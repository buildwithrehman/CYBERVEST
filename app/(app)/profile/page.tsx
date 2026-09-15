"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/auth/supabase";
import { User } from "@supabase/supabase-js";
import { AlertCircle, User as UserIcon, LogOut, CheckCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Fetch profile
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", session.user.id)
            .single();
            
          if (data && data.full_name) {
            setFullName(data.full_name);
          }
        } catch (err) {
          console.error("Failed to load profile", err);
        }
      }
      setLoading(false);
    };
    
    fetchUserAndProfile();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    const trimmedName = fullName.trim();
    if (trimmedName.length > 100) {
      setMessage({ type: 'error', text: 'Full name must be 100 characters or less.' });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: trimmedName, updated_at: new Date().toISOString() })
        .eq("id", user.id);
        
      if (error) throw error;
      
      setFullName(trimmedName); // update with trimmed version
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      console.error("Profile save error:", err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3F2E]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700">Not Authenticated</h2>
        <p className="mt-2 text-sm">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <UserIcon className="w-8 h-8 text-slate-700" />
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h2>
          
          {message && (
            <div className={`flex items-center gap-2 p-3 mb-6 rounded text-sm font-medium border ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full max-w-md px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0F3F2E] focus:border-transparent text-sm text-slate-900"
              />
            </div>
            
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <div className="text-sm font-medium text-slate-900">{user.email || "Unknown"}</div>
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed in this environment.</p>
            </div>
            
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">User ID</label>
              <div className="text-sm text-slate-600 font-mono">{user.id}</div>
            </div>
            
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Last Sign In</label>
              <div className="text-sm text-slate-600">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Unknown"}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 bg-[#0F3F2E] text-white text-sm font-semibold rounded hover:bg-[#0a2e22] transition-colors ${
              saving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
