import React from "react";
import { createBrowserRouter, Navigate } from "react-router";

// Home
import Home from "./pages/Home";
import About from "./pages/About";
import PropertiesList from "./pages/PropertiesList";
import Resources from "./pages/Resources";

// Investor Pages
import Login from "./pages/Login";
import InvestorSignUp from "./pages/investor/InvestorSignUp";
import InvestorKyc from "./pages/investor/InvestorKyc";
import InvestorKycStatus from "./pages/investor/InvestorKycStatus";
import InvestorDashboard from "./pages/investor/InvestorDashboard";
import { InvestorKycGuard } from "./components/auth/InvestorKycGuard";
import ProjectsList from "./pages/investor/ProjectsList";
import ProjectDetails from "./pages/investor/ProjectDetails";
import MyInvestments from "./pages/investor/MyInvestments";
import ReturnsPayouts from "./pages/investor/ReturnsPayouts";
import Documents from "./pages/investor/Documents";
import InvestorNotifications from "./pages/investor/InvestorNotifications";
import InvestorProfile from "./pages/investor/InvestorProfile";
import InvestorLogout from "./pages/investor/InvestorLogout";

// Builder Pages
import BuilderLogin from "./pages/builder/BuilderLogin";
import BuilderKyc from "./pages/builder/BuilderKyc";
import BuilderKycStatus from "./pages/builder/BuilderKycStatus";
import BuilderDashboard from "./pages/builder/BuilderDashboard";
import AddNewProject from "./pages/builder/AddNewProject";
import BuilderProjectList from "./pages/builder/BuilderProjectList";
import BuilderProjectDetails from "./pages/builder/BuilderProjectDetails";
import BuilderInvestors from "./pages/builder/BuilderInvestors";
import BuilderPayouts from "./pages/builder/BuilderPayouts";
import BuilderDocuments from "./pages/builder/BuilderDocuments";
import BuilderNotifications from "./pages/builder/BuilderNotifications";
import BuilderProfile from "./pages/builder/BuilderProfile";
import BuilderLogout from "./pages/builder/BuilderLogout";
import { BuilderKycGuard } from "./components/auth/BuilderKycGuard";
import { AdminGuard } from "./components/auth/AdminGuard";

// Admin Pages (no separate admin login – use /login)
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminKyc from "./pages/admin/AdminKyc";
import AdminInvestors from "./pages/admin/AdminInvestors";
import AdminBuilders from "./pages/admin/AdminBuilders";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminInvestments from "./pages/admin/AdminInvestments";
import AdminPayouts from "./pages/admin/AdminPayouts";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminReports from "./pages/admin/AdminReports";
import AdminCMS from "./pages/admin/AdminCMS";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLogout from "./pages/admin/AdminLogout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/about",
    Component: About,
  },
  {
    path: "/properties",
    Component: PropertiesList,
  },
  {
    path: "/resources",
    Component: Resources,
  },
  // Unified login (Investor, Builder, Admin)
  {
    path: "/login",
    Component: Login,
  },
  // Investor Routes
  {
    path: "/investor/login",
    Component: Login,
  },
  {
    path: "/investor/signup",
    Component: InvestorSignUp,
  },
  {
    path: "/investor/kyc",
    Component: InvestorKyc,
  },
  {
    path: "/investor/kyc/status",
    Component: InvestorKycStatus,
  },
  {
    path: "/investor/dashboard",
    Component: () => React.createElement(InvestorKycGuard, { Component: InvestorDashboard }),
  },
  {
    path: "/investor/projects",
    Component: () => React.createElement(InvestorKycGuard, { Component: ProjectsList }),
  },
  {
    path: "/investor/project/:id",
    Component: () => React.createElement(InvestorKycGuard, { Component: ProjectDetails }),
  },
  {
    path: "/investor/investments",
    Component: () => React.createElement(InvestorKycGuard, { Component: MyInvestments }),
  },
  {
    path: "/investor/returns",
    Component: () => React.createElement(InvestorKycGuard, { Component: ReturnsPayouts }),
  },
  {
    path: "/investor/documents",
    Component: () => React.createElement(InvestorKycGuard, { Component: Documents }),
  },
  {
    path: "/investor/notifications",
    Component: () => React.createElement(InvestorKycGuard, { Component: InvestorNotifications }),
  },
  {
    path: "/investor/profile",
    Component: () => React.createElement(InvestorKycGuard, { Component: InvestorProfile }),
  },
  {
    path: "/investor/logout",
    Component: () => React.createElement(InvestorKycGuard, { Component: InvestorLogout }),
  },
  // Builder Routes
  {
    path: "/builder/login",
    Component: BuilderLogin,
  },
  {
    path: "/builder/kyc",
    Component: BuilderKyc,
  },
  {
    path: "/builder/kyc/status",
    Component: BuilderKycStatus,
  },
  {
    path: "/builder/dashboard",
    Component: () => React.createElement(BuilderKycGuard, { Component: BuilderDashboard }),
  },
  {
    path: "/builder/add-project",
    Component: () => React.createElement(BuilderKycGuard, { Component: AddNewProject }),
  },
  {
    path: "/builder/projects",
    Component: () => React.createElement(BuilderKycGuard, { Component: BuilderProjectList }),
  },
  {
    path: "/builder/project/:id",
    Component: () => React.createElement(BuilderKycGuard, { Component: BuilderProjectDetails }),
  },
  {
    path: "/builder/investors",
    Component: () => React.createElement(BuilderKycGuard, { Component: BuilderInvestors }),
  },
  {
    path: "/builder/payouts",
    Component: () => React.createElement(BuilderKycGuard, { Component: BuilderPayouts }),
  },
  {
    path: "/builder/documents",
    Component: () => React.createElement(BuilderKycGuard, { Component: BuilderDocuments }),
  },
  {
    path: "/builder/notifications",
    Component: () => React.createElement(BuilderKycGuard, { Component: BuilderNotifications }),
  },
  {
    path: "/builder/profile",
    Component: () => React.createElement(BuilderKycGuard, { Component: BuilderProfile }),
  },
  {
    path: "/builder/logout",
    Component: () => React.createElement(BuilderKycGuard, { Component: BuilderLogout }),
  },
  // Admin Routes (no separate /admin/login – use /login; redirect /admin/login → /login)
  {
    path: "/admin/login",
    Component: () => React.createElement(Navigate, { to: "/login", replace: true }),
  },
  {
    path: "/admin/dashboard",
    Component: () => React.createElement(AdminGuard, { Component: AdminDashboard }),
  },
  {
    path: "/admin/kyc",
    Component: () => React.createElement(AdminGuard, { Component: AdminKyc }),
  },
  {
    path: "/admin/investors",
    Component: () => React.createElement(AdminGuard, { Component: AdminInvestors }),
  },
  {
    path: "/admin/builders",
    Component: () => React.createElement(AdminGuard, { Component: AdminBuilders }),
  },
  {
    path: "/admin/projects",
    Component: () => React.createElement(AdminGuard, { Component: AdminProjects }),
  },
  {
    path: "/admin/investments",
    Component: () => React.createElement(AdminGuard, { Component: AdminInvestments }),
  },
  {
    path: "/admin/payouts",
    Component: () => React.createElement(AdminGuard, { Component: AdminPayouts }),
  },
  {
    path: "/admin/documents",
    Component: () => React.createElement(AdminGuard, { Component: AdminDocuments }),
  },
  {
    path: "/admin/reports",
    Component: () => React.createElement(AdminGuard, { Component: AdminReports }),
  },
  {
    path: "/admin/cms",
    Component: () => React.createElement(AdminGuard, { Component: AdminCMS }),
  },
  {
    path: "/admin/notifications",
    Component: () => React.createElement(AdminGuard, { Component: AdminNotifications }),
  },
  {
    path: "/admin/settings",
    Component: () => React.createElement(AdminGuard, { Component: AdminSettings }),
  },
  {
    path: "/admin/logout",
    Component: () => React.createElement(AdminGuard, { Component: AdminLogout }),
  },
]);
