import { MobileNavigation } from "./MobileNavigation";
import { Breadcrumbs } from "./Breadcrumbs";
import { UserMenu } from "./UserMenu";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationsMenu } from "./NotificationsMenu";

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
      <div className="flex items-center gap-4 flex-1 md:flex-none">
        <MobileNavigation />
        <div className="hidden md:flex">
          <Breadcrumbs />
        </div>
      </div>

      <div className="hidden md:flex flex-1 max-w-xl mx-4">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-1 md:flex-none justify-end">
        <div className="md:hidden flex-1 max-w-[160px] sm:max-w-[240px]">
          <GlobalSearch />
        </div>
        
        <NotificationsMenu />
        
        <div className="hidden sm:block h-6 w-px bg-border mx-1"></div>
        
        <UserMenu />
      </div>
    </header>
  );
}
