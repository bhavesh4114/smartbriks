import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, Menu, User, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "About Us", href: "/about" },
  { label: "Resources", href: "/resources" },
];

interface SiteHeaderProps {
  /** When true, show user menu / logout instead of Login | Sign Up */
  authenticated?: boolean;
}

export function SiteHeader({ authenticated = false }: SiteHeaderProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("investor_kyc_completed");
    navigate("/investor/login");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className="sticky top-0 z-50 min-h-14 border-b bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div className="container mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-4 overflow-x-hidden px-4 py-3 md:px-6 lg:flex-nowrap lg:gap-8 lg:py-0">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          onClick={closeMenu}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: "#2563EB" }}
          >
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold" style={{ color: "#111827" }}>
            SmartBrick
          </span>
        </Link>

        {/* Desktop: inline nav + auth (≥1024px) */}
        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "#6B7280" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          {authenticated ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
                style={{ borderColor: "#E5E7EB", color: "#111827" }}
              >
                <User className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/investor/login">
                <span
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: "#6B7280" }}
                >
                  Login
                </span>
              </Link>
              <Link
                to="/investor/signup"
                className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-medium text-white transition-opacity hover:opacity-95"
                style={{
                  backgroundColor: "#2563EB",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile/Tablet: hamburger (below 1024px) */}
        <button
          type="button"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg transition-colors hover:opacity-80 lg:hidden"
          style={{ color: "#111827" }}
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="site-header-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile/Tablet: slide panel */}
      <div
        id="site-header-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
        aria-hidden={!menuOpen}
        className="fixed inset-0 z-40 lg:hidden"
        style={{ pointerEvents: menuOpen ? "auto" : "none" }}
      >
        <div
          className="absolute inset-0 bg-black/40 transition-opacity duration-200"
          aria-hidden
          onClick={closeMenu}
          style={{ opacity: menuOpen ? 1 : 0 }}
        />
        <div
          className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l bg-white shadow-xl transition-transform duration-200 ease-out"
          aria-hidden={!menuOpen}
          style={{
            borderColor: "#E5E7EB",
            transform: menuOpen ? "translateX(0)" : "translateX(100%)",
          }}
        >
          <div className="flex min-h-14 shrink-0 items-center justify-end border-b px-4"
            style={{ borderColor: "#E5E7EB" }}
          >
            <button
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors hover:opacity-80"
              style={{ color: "#111827" }}
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav
            className="flex flex-1 flex-col gap-1 overflow-y-auto p-4"
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={closeMenu}
                className="flex min-h-[48px] items-center rounded-lg px-4 text-base font-medium transition-colors hover:opacity-80"
                style={{ color: "#6B7280" }}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t pt-4" style={{ borderColor: "#E5E7EB" }}>
              {authenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-[48px] items-center gap-2 rounded-xl border px-4 text-left text-sm font-medium transition-colors hover:opacity-90"
                  style={{ borderColor: "#E5E7EB", color: "#111827" }}
                >
                  <User className="h-4 w-4 shrink-0" />
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/investor/login"
                    onClick={closeMenu}
                    className="flex min-h-[48px] items-center justify-center rounded-xl border px-4 text-base font-medium transition-colors hover:opacity-80"
                    style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/investor/signup"
                    onClick={closeMenu}
                    className="flex min-h-[48px] items-center justify-center rounded-xl px-4 text-base font-medium text-white transition-opacity hover:opacity-95"
                    style={{
                      backgroundColor: "#2563EB",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                    }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
