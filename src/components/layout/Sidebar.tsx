import { NavLink } from "react-router";
import { BarChart3, List, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: BarChart3 },
  { to: "/stays", label: "My Stays", icon: List },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function Sidebar() {
  const { signOut } = useAuth();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-sidebar">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold text-sidebar-foreground">90-in-180</h1>
          <p className="text-xs text-muted-foreground">Stay Calculator</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-sidebar md:hidden safe-pb">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-1 min-h-[52px] py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={signOut}
          className="flex flex-1 flex-col items-center justify-center gap-1 min-h-[52px] py-2 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </nav>
    </>
  );
}
