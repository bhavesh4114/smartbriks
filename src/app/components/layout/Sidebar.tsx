import { Link, useLocation } from "react-router";
import { LucideIcon, LayoutGrid, X } from "lucide-react";
import { cn } from "../ui/utils";

export interface SidebarItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

interface SidebarProps {
  items: SidebarItem[];
  logo?: string;
  logoText?: string;
  theme?: "default" | "investor";
  className?: string;
  isOverlay?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

function SidebarPanel({
  items,
  logo,
  logoText,
  theme,
  onClose,
  isOverlay,
}: SidebarProps & { isOverlay?: boolean }) {
  const location = useLocation();
  const isInvestorTheme = theme === "investor";

  const panel = (
    <div
      className={cn(
        "flex h-full w-64 shrink-0 flex-col",
        isInvestorTheme
          ? "bg-[#F1F5F9] border-r border-[#E5E7EB] text-[#374151]"
          : "bg-[#0f3460] text-white"
      )}
    >
      {/* Logo / Brand + close button on overlay */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-6",
          isInvestorTheme
            ? "bg-white border-[#E5E7EB]"
            : "border-[#1e5a8e]"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {isInvestorTheme ? (
            <>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white"
                aria-hidden
              >
                <LayoutGrid className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-base font-semibold leading-tight text-[#111827]">
                  SmartBrick
                </span>
                <span className="truncate text-[10px] font-medium uppercase tracking-widest text-[#6B7280] leading-tight">
                  FRACTIONAL REAL ESTATE
                </span>
              </div>
            </>
          ) : (
            <>
              {logo && <img src={logo} alt="Logo" className="h-8 w-8" />}
              <span className="text-xl font-semibold">{logoText}</span>
            </>
          )}
        </div>
        {isOverlay && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-slate-200 hover:text-[#111827]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={isOverlay ? onClose : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors",
                isInvestorTheme
                  ? isActive
                    ? "bg-blue-100 text-blue-600 font-medium [&_svg]:text-blue-600"
                    : "text-gray-700 hover:bg-slate-200/60 [&_svg]:text-gray-500"
                  : isActive
                    ? "bg-[#1e5a8e] text-white"
                    : "text-gray-300 hover:bg-[#16426b] hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return panel;
}

export function Sidebar({
  items,
  logo,
  logoText = "RealEstate",
  theme = "default",
  className,
  isOverlay,
  isOpen,
  onClose,
}: SidebarProps) {
  if (isOverlay) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden"
          style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose?.()}
          role="button"
          tabIndex={-1}
          aria-label="Close menu"
        />
        <div
          className="fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 ease-out lg:hidden"
          style={{ transform: isOpen ? "translateX(0)" : "translateX(-100%)" }}
        >
          <SidebarPanel
            items={items}
            logo={logo}
            logoText={logoText}
            theme={theme}
            onClose={onClose}
            isOverlay
          />
        </div>
      </>
    );
  }

  const isInvestorTheme = theme === "investor";
  return (
    <div
      className={cn(
        "flex h-screen w-64 shrink-0 flex-col",
        isInvestorTheme
          ? "bg-[#F1F5F9] border-r border-[#E5E7EB] text-[#374151]"
          : "bg-[#0f3460] text-white",
        className
      )}
    >
      <SidebarPanel items={items} logo={logo} logoText={logoText} theme={theme} />
    </div>
  );
}
