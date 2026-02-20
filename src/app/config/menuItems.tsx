import {
  LayoutDashboard,
  FolderKanban,
  Wallet,
  TrendingUp,
  FileText,
  Bell,
  User,
  LogOut,
  Users,
  Building2,
  PlusCircle,
  Upload,
  Settings,
  BarChart3,
  Shield,
  FileClock,
  DollarSign,
} from "lucide-react";
import { SidebarItem } from "../components/layout/Sidebar";

export const investorMenuItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/investor/dashboard",
  },
  {
    title: "Projects",
    icon: FolderKanban,
    href: "/investor/projects",
  },
  {
    title: "My Investments",
    icon: Wallet,
    href: "/investor/investments",
  },
  {
    title: "Returns & Payouts",
    icon: TrendingUp,
    href: "/investor/returns",
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/investor/documents",
  },
  {
    title: "Notifications",
    icon: Bell,
    href: "/investor/notifications",
  },
  {
    title: "Profile",
    icon: User,
    href: "/investor/profile",
  },
  {
    title: "Logout",
    icon: LogOut,
    href: "/investor/logout",
  },
];

export const builderMenuItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/builder/dashboard",
  },
  {
    title: "Add New Project",
    icon: PlusCircle,
    href: "/builder/add-project",
  },
  {
    title: "Project List",
    icon: FolderKanban,
    href: "/builder/projects",
  },
  {
    title: "Investor Management",
    icon: Users,
    href: "/builder/investors",
  },
  {
    title: "Payout Management",
    icon: DollarSign,
    href: "/builder/payouts",
  },
  {
    title: "Upload Documents",
    icon: Upload,
    href: "/builder/documents",
  },
  {
    title: "Notifications",
    icon: Bell,
    href: "/builder/notifications",
  },
  {
    title: "Profile",
    icon: User,
    href: "/builder/profile",
  },
  {
    title: "Logout",
    icon: LogOut,
    href: "/builder/logout",
  },
];

export const adminMenuItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    title: "Investor Management",
    icon: Users,
    href: "/admin/investors",
  },
  {
    title: "Builder Management",
    icon: Building2,
    href: "/admin/builders",
  },
  {
    title: "Project Management",
    icon: FolderKanban,
    href: "/admin/projects",
  },
  {
    title: "Investment Records",
    icon: Wallet,
    href: "/admin/investments",
  },
  {
    title: "Payout Records",
    icon: DollarSign,
    href: "/admin/payouts",
  },
  {
    title: "Document Verification",
    icon: FileClock,
    href: "/admin/documents",
  },
  {
    title: "Reports",
    icon: BarChart3,
    href: "/admin/reports",
  },
  {
    title: "CMS Pages",
    icon: FileText,
    href: "/admin/cms",
  },
  {
    title: "Notifications",
    icon: Bell,
    href: "/admin/notifications",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
  {
    title: "Logout",
    icon: LogOut,
    href: "/admin/logout",
  },
];
