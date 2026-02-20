import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { Sidebar, SidebarItem } from "./Sidebar";
import { Navbar } from "./Navbar";

const MOBILE_BREAKPOINT = 1024;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = () => setIsMobile(m.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarItems: SidebarItem[];
  userName?: string;
  userRole?: string;
  logoText?: string;
  onLogout?: () => void;
}

export function DashboardLayout({
  children,
  sidebarItems,
  userName,
  userRole,
  logoText,
  onLogout,
}: DashboardLayoutProps) {
  const { pathname } = useLocation();
  const isLightTheme =
    pathname.startsWith("/investor") || pathname.startsWith("/builder");
  const isInvestor = pathname.startsWith("/investor");
  const isBuilder = pathname.startsWith("/builder");
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const useMobileSidebar = isInvestor || isBuilder;
    if (!useMobileSidebar || !isMobile) return;
    if (sidebarOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen, isInvestor, isBuilder, isMobile]);

  const theme = isLightTheme ? "investor" : "default";
  const showMobileSidebar = (isInvestor || isBuilder) && isMobile;

  return (
    <div className="flex h-screen min-w-0 overflow-hidden bg-background">
      {/* Sidebar: hidden on mobile for investor & builder (lg:flex); overlay used on mobile instead */}
      <Sidebar
        items={sidebarItems}
        logoText={logoText}
        theme={theme}
        className={isInvestor || isBuilder ? "hidden lg:flex" : ""}
      />
      {/* Mobile overlay sidebar (investor & builder) */}
      {showMobileSidebar && (
        <Sidebar
          items={sidebarItems}
          logoText={logoText}
          theme={theme}
          isOverlay
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          userName={userName}
          userRole={userRole}
          onLogout={onLogout}
          theme={theme}
          showMenuButton={showMobileSidebar}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page Content */}
        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 ${isLightTheme ? "bg-[#F8FAFC]" : ""}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
