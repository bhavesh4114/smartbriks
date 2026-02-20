import { Bell, ChevronDown, User, Menu } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useNavigate } from "react-router";
import { cn } from "../ui/utils";

interface NavbarProps {
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  theme?: "default" | "investor";
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export function Navbar({
  userName = "User",
  userRole = "Role",
  onLogout,
  theme = "default",
  showMenuButton,
  onMenuClick,
}: NavbarProps) {
  const navigate = useNavigate();
  const isInvestorTheme = theme === "investor";

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate("/");
    }
  };

  return (
    <header
      className={cn(
        "flex h-16 min-w-0 shrink-0 items-center justify-between gap-2 border-b bg-[#FFFFFF] px-4 sm:px-6",
        isInvestorTheme ? "border-[#E5E7EB] shadow-none" : "shadow-sm"
      )}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        {showMenuButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0", isInvestorTheme && "text-[#6B7280] hover:text-[#111827]")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMenuClick?.();
            }}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}
        <h1 className="truncate text-lg font-semibold text-[#111827] sm:text-xl">Dashboard</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", isInvestorTheme && "text-[#6B7280] hover:text-[#111827]")}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-white",
                  isInvestorTheme
                    ? "border border-gray-200 bg-blue-600"
                    : "bg-[#0f3460]"
                )}
              >
                <User className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-[#111827]">{userName}</div>
                <div className="text-xs text-[#6B7280]">{userRole}</div>
              </div>
              <ChevronDown
                className={cn("h-4 w-4", isInvestorTheme && "text-[#6B7280]")}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
