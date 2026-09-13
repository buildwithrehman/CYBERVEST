"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { User, LogOut, Settings } from "lucide-react";
import { supabase } from "@/lib/auth/supabase";
import Link from "next/link";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [initials, setInitials] = useState("JD"); // Default to JD if none
  const [email, setEmail] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Fetch user details for initials
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        // If user has a name in metadata, use it, else use email
        const name = user.user_metadata?.full_name;
        if (name) {
          const parts = name.split(" ");
          if (parts.length >= 2) {
            setInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
          } else {
            setInitials(parts[0].substring(0, 2).toUpperCase());
          }
        } else if (user.email) {
          setInitials(user.email.substring(0, 2).toUpperCase());
        }
      }
    };
    getUser();
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      queryClient.clear();
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="relative ml-2" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
        className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-800 focus:ring-offset-2 transition-all cursor-pointer"
      >
        {initials}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border py-1 z-50 transform origin-top-right transition-all"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          {email && (
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-slate-900 truncate">Account</p>
              <p className="text-xs text-slate-500 truncate" title={email}>{email}</p>
            </div>
          )}
          
          <div className="py-1">
            <Link 
              href="/profile" 
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors w-full text-left"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Profile & Settings
            </Link>
          </div>
          
          <div className="py-1 border-t border-border">
            <button
              onClick={() => {
                setIsOpen(false);
                handleSignOut();
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-semantic-threat-text hover:bg-semantic-threat-bg hover:text-semantic-threat-text transition-colors w-full text-left"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
