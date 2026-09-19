"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, ShieldAlert, CheckCircle, Info, Activity, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/auth/supabase";
import Link from "next/link";

interface SecurityEvent {
  id: string;
  asset_id: string;
  event_type: string;
  severity: string;
  timestamp: string;
  assets?: { name: string };
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data } = await supabase
          .from("security_events")
          .select("id, asset_id, event_type, severity, timestamp, assets(name)")
          .order("timestamp", { ascending: false })
          .limit(5);
        
        if (data) {
          setEvents(data as any);
          
          // Load read state from localStorage
          const readIds = new Set<string>(JSON.parse(localStorage.getItem("cybervest_read_notifications") || "[]"));
          const unread = new Set<string>();
          data.forEach(ev => {
            if (!readIds.has(ev.id)) unread.add(ev.id);
          });
          setUnreadIds(unread);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const markAllAsRead = () => {
    const allIds = events.map(e => e.id);
    const existing = new Set<string>(JSON.parse(localStorage.getItem("cybervest_read_notifications") || "[]"));
    allIds.forEach(id => existing.add(id));
    localStorage.setItem("cybervest_read_notifications", JSON.stringify(Array.from(existing)));
    setUnreadIds(new Set());
  };

  const getIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
      case "high": return <ShieldAlert className="w-4 h-4 text-semantic-threat-text" />;
      case "medium": return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTitle = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-900 focus:outline-none transition-colors rounded-full hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadIds.size > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-border z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadIds.size > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-forest hover:text-forest-800 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <CheckCircle className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {events.map((event) => {
                  const isUnread = unreadIds.has(event.id);
                  const assetName = event.assets?.name || "Unknown Asset";
                  const destinationUrl = event.asset_id ? `/assets/${event.asset_id}` : '/dashboard';
                  return (
                    <Link 
                      href={destinationUrl}
                      key={event.id}
                      onClick={() => setIsOpen(false)}
                      className={`block focus:outline-none focus:bg-slate-50 p-4 hover:bg-slate-50 transition-colors ${isUnread ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(event.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium text-slate-900 truncate ${isUnread ? 'font-semibold' : ''}`}>
                            {formatTitle(event.event_type)}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            Detected on <span className="font-medium text-slate-700">{assetName}</span>.
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {formatTimeAgo(event.timestamp)}
                          </p>
                        </div>
                        {isUnread && (
                          <div className="flex-shrink-0 flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-border bg-slate-50 text-center">
            <Link 
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
