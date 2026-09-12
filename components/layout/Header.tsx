import { MobileNavigation } from "./MobileNavigation";
import { Breadcrumbs } from "./Breadcrumbs";
import { Search, Bell } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
      <div className="flex items-center gap-4 flex-1">
        <MobileNavigation />
        <div className="hidden md:flex">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button disabled title="Global Search is currently unavailable" className="p-2 text-slate-300 cursor-not-allowed opacity-50 transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-semantic-threat-text rounded-full border border-white" />
        </button>
        
        <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-sm font-semibold ml-2">
          JD
        </div>
      </div>
    </header>
  );
}
