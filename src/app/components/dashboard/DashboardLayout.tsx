import { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "investor" | "builder" | "admin";
  menuItems: {
    label: string;
    path: string;
    icon: ReactNode;
  }[];
}

export default function DashboardLayout({
  children,
  role,
  menuItems,
}: DashboardLayoutProps) {
  const location = useLocation();

  const isBuilderLight = role === "builder";
  const roleColors = {
    investor: "bg-blue-900",
    builder: isBuilderLight ? "bg-[#F1F5F9]" : "bg-slate-800",
    admin: "bg-indigo-900",
  };

  const roleNames = {
    investor: "Investor Portal",
    builder: "Builder Portal",
    admin: "Admin Portal",
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`w-64 flex flex-col border-r ${
          isBuilderLight
            ? "bg-[#F1F5F9] border-[#E5E7EB] text-[#374151]"
            : `${roleColors[role]} text-white shadow-lg border-transparent`
        }`}
      >
        {/* Logo */}
        <div
          className={`p-6 border-b ${
            isBuilderLight ? "bg-white border-[#E5E7EB]" : "border-white/10"
          }`}
        >
          <h1
            className={`text-xl font-bold ${isBuilderLight ? "text-[#111827]" : ""}`}
          >
            SmartBrick
          </h1>
          <p
            className={`text-sm mt-1 ${
              isBuilderLight ? "text-[#6B7280]" : "text-white/70"
            }`}
          >
            {roleNames[role]}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isBuilderLight
                    ? isActive
                      ? "bg-blue-100 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-slate-200/80 [&_svg]:text-gray-500"
                    : isActive
                      ? "bg-white/20 font-medium"
                      : "hover:bg-white/10 text-white/80 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className={`p-4 border-t ${
            isBuilderLight ? "border-[#E5E7EB]" : "border-white/10"
          }`}
        >
          <Link
            to={`/${role}/logout`}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isBuilderLight
                ? "text-gray-700 hover:bg-slate-200/80 [&_svg]:text-gray-500"
                : "hover:bg-white/10 text-white/80 hover:text-white"
            }`}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className={`bg-white border-b px-8 py-4 flex items-center justify-between ${
            isBuilderLight ? "border-[#E5E7EB] shadow-none" : "border-gray-200 shadow-sm"
          }`}
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {menuItems.find((item) => item.path === location.pathname)
                ?.label || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to={`/${role}/notifications`}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell size={20} className="text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Link>
            <Link
              to={`/${role}/profile`}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                  isBuilderLight ? "border-[#E5E7EB] bg-[#2563EB]" : "bg-gray-300 border-transparent"
                }`}
              >
                <User size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </Link>
          </div>
        </header>

        <main
          className={`flex-1 overflow-y-auto p-8 ${
            isBuilderLight ? "bg-[#F8FAFC]" : "bg-gray-50"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
