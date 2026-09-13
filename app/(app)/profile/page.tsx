"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/auth/supabase";
import { User } from "@supabase/supabase-js";
import { AlertCircle, User as UserIcon, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    });
  }, []);

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
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <div className="text-sm font-medium text-slate-900">{user.email || "Unknown"}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">User ID</label>
              <div className="text-sm text-slate-600 font-mono">{user.id}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Last Sign In</label>
              <div className="text-sm text-slate-600">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Unknown"}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-200 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-medium">Profile editing is currently unavailable in this demonstration environment.</p>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
