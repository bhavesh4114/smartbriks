import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, User, Menu, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useLocation, useNavigate } from "react-router";
import { cn } from "../ui/utils";

interface NavbarProps {
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  theme?: "default" | "investor";
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

const USER_ROLE_KEY = "userRole";
const USER_KEY = "user";

function getDashboardTitle(): string {
  try {
    const role = typeof window !== "undefined" ? localStorage.getItem(USER_ROLE_KEY) : null;
    if (role === "ADMIN") return "Admin Dashboard";
    if (role === "BUILDER") return "Builder Dashboard";
    if (role === "INVESTOR") return "Investor Dashboard";
  } catch (_) {}
  return "Dashboard";
}

function getStoredUser(): { fullName?: string; companyName?: string; role?: string } | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) {
    return null;
  }
}

function getHeaderName(user: ReturnType<typeof getStoredUser>, fallback: string): string {
  if (!user?.role) return fallback;
  if (user.role === "ADMIN") return "Admin";
  if (user.role === "INVESTOR") return user.fullName ?? fallback;
  if (user.role === "BUILDER") return user.companyName ?? fallback;
  return fallback;
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
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const profileRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isInvestorTheme = theme === "investor";
  const isBuilder = pathname.startsWith("/builder");
  const isInvestor = pathname.startsWith("/investor");
  const isAdmin = pathname.startsWith("/admin");
  const dashboardTitle = getDashboardTitle();
  const storedUser = getStoredUser();
  const headerName = getHeaderName(storedUser, userName);

  const handleLogout = () => {
    setIsMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else if (isBuilder) {
      navigate("/builder/logout");
    } else if (isInvestor) {
      navigate("/investor/logout");
    } else if (isAdmin) {
      navigate("/admin/logout");
    } else {
      navigate("/login", { replace: true });
    }
  };

  const handleProfileClick = () => {
    if (!isMenuOpen && profileRef.current) {
      const rect = profileRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        profileRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) return;
      setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const profilePath = isBuilder ? "/builder/profile" : isInvestor ? "/investor/profile" : "#";
  const kycPath = isBuilder ? "/builder/kyc" : isInvestor ? "/investor/kyc" : null;

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
        <h1 className="truncate text-lg font-semibold text-[#111827] sm:text-xl">{dashboardTitle}</h1>
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

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={handleProfileClick}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100",
              isMenuOpen && "bg-gray-100"
            )}
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
                isInvestorTheme
                  ? "border border-gray-200 bg-blue-600"
                  : "bg-[#0f3460]"
              )}
            >
              <User className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-[#111827]">{headerName}</div>
            </div>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0", isInvestorTheme && "text-[#6B7280]")}
            />
          </button>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="fixed z-[50] min-w-[12rem] rounded-md border border-[#E5E7EB] bg-white py-1 shadow-lg"
              style={{ top: menuPosition.top, right: menuPosition.right }}
            >
              <div className="px-3 py-2 text-xs font-medium text-[#6B7280]">
                My Account
              </div>
              <div className="h-px bg-[#E5E7EB]" />
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#111827] hover:bg-gray-100"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate(profilePath);
                }}
              >
                <User className="h-4 w-4 text-[#6B7280]" />
                Profile
              </button>
              {kycPath && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#111827] hover:bg-gray-100"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(kycPath);
                  }}
                >
                  KYC
                </button>
              )}
              <div className="h-px bg-[#E5E7EB]" />
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
