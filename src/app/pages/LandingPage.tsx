import { Link } from "react-router";
import { Building2, UserCircle, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white">
      {/* Header */}
      <header className="container mx-auto w-full min-w-0 px-4 py-6 sm:px-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="break-words text-xl font-bold sm:text-2xl">RealEstate Pro</h1>
          <nav className="flex flex-wrap gap-3 sm:space-x-6">
            <a href="#about" className="text-white/80 hover:text-white">
              About
            </a>
            <a href="#features" className="text-white/80 hover:text-white">
              Features
            </a>
            <a href="#contact" className="text-white/80 hover:text-white">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto w-full min-w-0 px-4 py-12 text-center sm:px-6 sm:py-20">
        <h2 className="break-words text-3xl font-bold mb-6 sm:text-4xl md:text-5xl">
          Professional Real Estate Investment Platform
        </h2>
        <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto sm:text-xl">
          Connect investors with builders. Manage projects, track returns, and
          grow your real estate portfolio with confidence.
        </p>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 min-w-0 gap-6 max-w-5xl mx-auto mt-12 sm:gap-8 sm:mt-16 md:grid-cols-3">
          {/* Investor */}
          <Link
            to="/investor/login"
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all hover:scale-105 border border-white/20"
          >
            <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircle size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Investor</h3>
            <p className="text-white/70 mb-6">
              Browse projects, invest in properties, and track your returns
            </p>
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors w-full">
              Investor Login
            </button>
          </Link>

          {/* Builder */}
          <Link
            to="/builder/login"
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all hover:scale-105 border border-white/20"
          >
            <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Builder</h3>
            <p className="text-white/70 mb-6">
              List your projects, raise funds, and manage investor relations
            </p>
            <button className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors w-full">
              Builder Login
            </button>
          </Link>

          {/* Admin */}
          <Link
            to="/admin/login"
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all hover:scale-105 border border-white/20"
          >
            <div className="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Admin</h3>
            <p className="text-white/70 mb-6">
              Manage platform, verify users, and oversee all operations
            </p>
            <button className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors w-full">
              Admin Login
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-20 border-t border-white/20">
        <p className="text-center text-white/60">
          © 2026 RealEstate Pro. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
