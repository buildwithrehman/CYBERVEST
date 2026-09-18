import { MobileNavigation } from "./MobileNavigation";
import { Breadcrumbs } from "./Breadcrumbs";
import { Search, Bell } from "lucide-react";
import { UserMenu } from "./UserMenu";

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
        <button disabled title="Notifications are currently unavailable" className="p-2 text-slate-300 cursor-not-allowed opacity-50 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        
        <UserMenu />
      </div>
    </header>
  );
}
