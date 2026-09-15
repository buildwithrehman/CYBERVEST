"use client";

import React, { useEffect, useState } from "react";
import { HardDrive, AlertTriangle, CloudOff, Upload, FileText, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/auth/supabase";
import { uploadEvidenceAction, getEvidenceDownloadUrlAction } from "./actions";

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('evidence')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setEvidence(data || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load evidence.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setError("File and title are required.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File size must be less than 20MB.");
      return;
    }

    const allowedTypes = [
      'application/pdf', 'text/csv', 'text/plain', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/msword', 'image/jpeg', 'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file type. Allowed: PDF, CSV, TXT, DOCX, JPEG, PNG.");
      return;
    }
    
    setUploading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);

      const res = await uploadEvidenceAction(formData, session.access_token);
      
      if (!res.success) {
        throw new Error(res.error || "Upload failed");
      }

      setFile(null);
      setTitle("");
      setDescription("");
      fetchEvidence();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (path: string, title: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await getEvidenceDownloadUrlAction(path, session.access_token);
      if (!res.success || !res.signedUrl) {
        throw new Error(res.error || "Failed to get download URL");
      }

      window.open(res.signedUrl, '_blank');
    } catch (err: any) {
      console.error("Download failed:", err);
      alert(err.message || "Failed to download file.");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full font-sans text-slate-900 pb-16 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Evidence Vault</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and link cryptographic audit evidence to compliance controls.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#0F3F2E]" />
              Upload Evidence
            </h3>
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0F3F2E]/20"
                  placeholder="e.g. SOC2 Type II Report"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0F3F2E]/20 min-h-[80px]"
                  placeholder="Optional details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File *</label>
                <input 
                  type="file" 
                  required
                  onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0F3F2E]/10 file:text-[#0F3F2E] hover:file:bg-[#0F3F2E]/20 cursor-pointer"
                />
              </div>
              <button 
                type="submit" 
                disabled={uploading || !file || !title}
                className="mt-2 h-10 px-4 rounded-lg bg-[#0F3F2E] text-white font-medium hover:bg-[#0F3F2E]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Upload Artifact"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-slate-500" />
                Artifact Repository
              </h3>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            ) : evidence.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 mb-4" />
                <h4 className="text-slate-900 font-medium mb-1">No evidence found</h4>
                <p className="text-sm text-slate-500 max-w-sm">Upload artifacts to securely store them in the vault.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-y-auto">
                {evidence.map((item) => (
                  <div key={item.id} className="p-4 px-6 hover:bg-slate-50 flex items-start justify-between group transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#0F3F2E]/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <FileText className="w-5 h-5 text-[#0F3F2E]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          <span className="uppercase">{item.evidence_type.split('/')[1] || 'FILE'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadFile(item.storage_path, item.title)}
                      className="p-2 rounded-md text-slate-400 hover:text-[#0F3F2E] hover:bg-[#0F3F2E]/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                      title="Download Artifact"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
