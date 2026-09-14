"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { AIQuery, AIResponse } from "@/lib/types/api";
import { ErrorState, EmptyState } from "@/components/ui/States";
import { 
  Bot, 
  Send, 
  ShieldCheck, 
  Database,
  ArrowRight,
  RefreshCw,
  Info,
  AlertTriangle
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: string;
  data?: Record<string, unknown>;
};

const SUGGESTIONS = [
  "What is our highest financial cyber risk?",
  "Explain our EAL",
  "What happens if MFA is deployed?",
  "Optimize a ₹1 crore budget",
  "Summarize our compliance gaps"
];

export default function AIRiskAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: (req: AIQuery) =>
      fetchApi<AIResponse>("/api/ai/ask", {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        text: data.llm_explanation,
        source: data.verified_data_source,
        data: data.verified_data
      }]);
    }
  });

  const handleSend = (text: string) => {
    if (!text.trim() || mutation.isPending) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      text: text
    }]);
    setInput("");
    mutation.mutate({ query: text });
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mutation.isPending]);

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto h-[calc(100vh-8rem)]">
      
      {/* HEADER ZONE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Risk Assistant</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Bot className="w-3.5 h-3.5" />
              <span>BETA / Decision Support</span>
            </span>
          </div>
          <p className="text-sm text-slate-500">Ask questions about verified cyber risk, financial exposure, and investment decisions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setMessages([]); mutation.reset(); }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Session</span>
          </button>
        </div>
      </div>

      {/* TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        
        {/* LEFT COLUMN: CONVERSATION (8 cols) */}
        <div className="xl:col-span-8 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full">
          
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EAF5EE] text-[#0F3F2E] flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-900 font-semibold">CYBERVEST AI</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Connected to verified risk data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">Suggested:</span>
            {SUGGESTIONS.map(s => (
              <button 
                key={s}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-6 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                <ShieldCheck className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">How can I help you assess risk today?</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">I can explain modeled EAL, analyze mitigation impacts, and summarize compliance postures using strictly verified backend telemetry.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-1`}>
                    <div className={`px-4 py-3 rounded-2xl ${m.role === 'user' ? 'bg-[#0F3F2E] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm shadow-sm'}`}>
                      {m.role === 'assistant' && (
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                          <Bot className="w-4 h-4 text-[#0F3F2E]" />
                          <span className="text-xs font-bold text-[#0F3F2E]">Verified Response</span>
                        </div>
                      )}
                      
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
                      
                      {m.role === 'assistant' && m.source && m.source !== 'None' && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Source:</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                            <Database className="w-3 h-3" />
                            {m.source}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            
            {mutation.isError && (
              <div className="flex justify-start">
                <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-2xl rounded-bl-sm text-red-800 text-sm flex items-start gap-2 max-w-[85%]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Failed to process request. Ensure backend services and authentication are running correctly.</span>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-4 border-t border-slate-200 bg-white shrink-0">
            <div className="flex flex-col gap-2">
              <div className="relative flex items-center border border-slate-300 rounded-xl bg-white shadow-sm focus-within:border-[#0F3F2E] focus-within:ring-1 focus-within:ring-[#0F3F2E] overflow-hidden p-1">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                  className="w-full bg-transparent border-0 resize-none px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none" 
                  placeholder="Ask a question about your cyber risk..." 
                  rows={2}
                />
                <button 
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || mutation.isPending}
                  className="w-10 h-10 mr-1 shrink-0 flex items-center justify-center rounded-lg bg-[#0F3F2E] text-white hover:bg-[#14533D] disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-500 font-medium">
                Responses are deterministically grounded in verified CYBERVEST backend telemetry. The LLM does not perform risk calculations.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: VERIFIED CONTEXT (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6 h-full overflow-y-auto">
          
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0F3F2E]" />
              Verified Engine Provenance
            </h2>
            
            {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].data ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-[300px] overflow-y-auto font-mono whitespace-pre-wrap">
                  {JSON.stringify(messages[messages.length - 1].data, null, 2)}
                </div>
                <div className="flex items-start gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-blue-800 text-xs">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>The structured data above was exclusively generated by the certified <strong>{messages[messages.length - 1].source}</strong> and provided to the LLM to generate the conversational response.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Database className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-medium text-center px-4">Raw backend engine data will appear here when a query is executed.</span>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
