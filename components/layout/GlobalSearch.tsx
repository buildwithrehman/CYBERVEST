"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, HardDrive, Briefcase, FileText, LayoutDashboard, Target, ShieldAlert, X } from "lucide-react";
import { supabase } from "@/lib/auth/supabase";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "asset" | "service" | "scenario" | "page";
  title: string;
  subtitle: string;
  url: string;
  icon: any;
}

const STATIC_PAGES = [
  { id: "p1", title: "Dashboard", subtitle: "Overview and summary", url: "/dashboard", icon: LayoutDashboard },
  { id: "p2", title: "Risk Explorer", subtitle: "Analyze cyber risks", url: "/risk-explorer", icon: ShieldAlert },
  { id: "p3", title: "Reports", subtitle: "View generated reports", url: "/reports", icon: FileText },
  { id: "p4", title: "FAIR Scenarios", subtitle: "Manage risk scenarios", url: "/scenarios", icon: Target },
  { id: "p5", title: "Assets", subtitle: "Manage IT assets", url: "/assets", icon: HardDrive },
];

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search logic
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(query.trim().length > 0);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setIsOpen(true);
      
      try {
        const q = `%${query}%`;
        
        // 1. Static Pages
        const pageResults: SearchResult[] = STATIC_PAGES
          .filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.subtitle.toLowerCase().includes(query.toLowerCase()))
          .map(p => ({ ...p, type: "page" }));

        // 2. Assets
        const { data: assets } = await supabase
          .from("assets")
          .select("id, name, asset_type, criticality")
          .ilike("name", q)
          .limit(3);

        const assetResults: SearchResult[] = (assets || []).map(a => ({
          id: a.id,
          type: "asset",
          title: a.name,
          subtitle: `${a.asset_type || "Asset"} • ${a.criticality || "Unknown"} criticality`,
          url: `/assets/${a.id}`,
          icon: HardDrive
        }));

        // 3. Business Services
        const { data: services } = await supabase
          .from("business_services")
          .select("id, name, criticality")
          .ilike("name", q)
          .limit(3);

        const serviceResults: SearchResult[] = (services || []).map(s => ({
          id: s.id,
          type: "service",
          title: s.name,
          subtitle: `Business Service • ${s.criticality || "Unknown"} criticality`,
          url: `/risk-explorer`, // Linking to risk explorer as generic destination
          icon: Briefcase
        }));

        // 4. FAIR Scenarios
        const { data: scenarios } = await supabase
          .from("fair_scenarios")
          .select("id, name, description")
          .ilike("name", q)
          .limit(3);

        const scenarioResults: SearchResult[] = (scenarios || []).map(s => ({
          id: s.id,
          type: "scenario",
          title: s.name,
          subtitle: s.description || "FAIR Scenario",
          url: `/scenarios`, 
          icon: Target
        }));

        const combined = [...pageResults, ...assetResults, ...serviceResults, ...scenarioResults];
        setResults(combined);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        navigate(results[selectedIndex].url);
      } else if (results.length > 0) {
        navigate(results[0].url);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const navigate = (url: string) => {
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(url);
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative flex items-center w-full group">
        <Search className={`absolute left-3 w-4 h-4 transition-colors ${isOpen || query ? 'text-forest' : 'text-slate-400 group-focus-within:text-forest'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.trim().length > 0) setIsOpen(true); }}
          placeholder="Search assets, services, reports..."
          className="w-full h-10 pl-9 pr-10 bg-slate-100 hover:bg-slate-200/80 focus:bg-white border border-transparent focus:border-forest/30 focus:ring-2 focus:ring-forest/20 rounded-md text-sm transition-all outline-none text-slate-900 placeholder-slate-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-border overflow-hidden z-50">
          {loading ? (
            <div className="p-6 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-forest" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.map((res, idx) => {
                const Icon = res.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={res.id}
                    onClick={() => navigate(res.url)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-md ${isSelected ? 'bg-white shadow-sm border border-border' : 'bg-slate-100'}`}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-forest' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{res.title}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{res.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-900 font-medium">No results found</p>
              <p className="text-xs text-slate-500 mt-1">We couldn&apos;t find anything matching &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-500">Type at least 2 characters to search.</p>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="border-t border-border bg-slate-50 p-2 text-xs text-slate-500 text-center font-medium flex items-center justify-center gap-1">
              Press <span className="px-1.5 py-0.5 bg-white border border-border rounded text-[10px] uppercase shadow-sm">Enter</span> to navigate
            </div>
          )}
        </div>
      )}
    </div>
  );
}
