import {
  LayoutDashboard,
  Building2,
  Wallet,
  TrendingUp,
  FileText,
  Bell,
  User,
  PlusCircle,
  Users,
  DollarSign,
  Upload,
  Settings,
  BarChart3,
  FileCheck,
  Shield,
} from "lucide-react";

export const investorMenuItems = [
  {
    label: "Dashboard",
    path: "/investor/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Projects",
    path: "/investor/projects",
    icon: <Building2 size={20} />,
  },
  {
    label: "My Investments",
    path: "/investor/my-investments",
    icon: <Wallet size={20} />,
  },
  {
    label: "Returns / Payouts",
    path: "/investor/returns",
    icon: <TrendingUp size={20} />,
  },
  {
    label: "Documents",
    path: "/investor/documents",
    icon: <FileText size={20} />,
  },
  {
    label: "Notifications",
    path: "/investor/notifications",
    icon: <Bell size={20} />,
  },
  {
    label: "Profile",
    path: "/investor/profile",
    icon: <User size={20} />,
  },
];

export const builderMenuItems = [
  {
    label: "Dashboard",
    path: "/builder/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Add New Project",
    path: "/builder/add-project",
    icon: <PlusCircle size={20} />,
  },
  {
    label: "Project List",
    path: "/builder/projects",
    icon: <Building2 size={20} />,
  },
  {
    label: "Investor Management",
    path: "/builder/investors",
    icon: <Users size={20} />,
  },
  {
    label: "Payout Management",
    path: "/builder/payouts",
    icon: <DollarSign size={20} />,
  },
  {
    label: "Upload Documents",
    path: "/builder/documents",
    icon: <Upload size={20} />,
  },
  {
    label: "Notifications",
    path: "/builder/notifications",
    icon: <Bell size={20} />,
  },
  {
    label: "Profile / Settings",
    path: "/builder/profile",
    icon: <Settings size={20} />,
  },
];

export const adminMenuItems = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Investor Management",
    path: "/admin/investors",
    icon: <Users size={20} />,
  },
  {
    label: "Builder Management",
    path: "/admin/builders",
    icon: <Building2 size={20} />,
  },
  {
    label: "Project Management",
    path: "/admin/projects",
    icon: <Building2 size={20} />,
  },
  {
    label: "Investment Records",
    path: "/admin/investments",
    icon: <Wallet size={20} />,
  },
  {
    label: "Payout Records",
    path: "/admin/payouts",
    icon: <DollarSign size={20} />,
  },
  {
    label: "Document Verification",
    path: "/admin/documents",
    icon: <FileCheck size={20} />,
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: <BarChart3 size={20} />,
  },
  {
    label: "CMS Pages",
    path: "/admin/cms",
    icon: <FileText size={20} />,
  },
  {
    label: "Notifications",
    path: "/admin/notifications",
    icon: <Bell size={20} />,
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: <Settings size={20} />,
  },
];
