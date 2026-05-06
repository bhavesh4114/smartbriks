import { ReactNode } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { builderMenuItems } from "../../config/menuItems";

interface BuilderLayoutProps {
  children: ReactNode;
  userName?: string;
  userRole?: string;
  logoText?: string;
}

/**
 * Single shared layout for ALL Builder portal pages.
 * Uses the same Sidebar (from DashboardLayout) and design spec everywhere.
 */
export function BuilderLayout({
  children,
  userName = "Elite Constructions",
  userRole = "Builder",
  logoText = "RealEstate",
}: BuilderLayoutProps) {
  return (
    <DashboardLayout
      sidebarItems={builderMenuItems}
      userName={userName}
      userRole={userRole}
      logoText={logoText}
    >
      {children}
    </DashboardLayout>
  );
}
