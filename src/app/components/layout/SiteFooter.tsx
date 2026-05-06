import { Link } from "react-router";
import { Building2, Share2, Globe, Mail } from "lucide-react";

const FOOTER_PLATFORM = ["How it Works", "Investments", "Return Tracker", "Pricing"];
const FOOTER_COMPANY = ["About Us", "Careers", "Partners", "Contact"];
const FOOTER_LEGAL = ["Privacy Policy", "Terms of Service", "Risk Disclosure", "Cookie Policy"];

export function SiteFooter() {
  return (
    <footer
      className="py-16"
      style={{ backgroundColor: "#F9FAFB", borderTop: "1px solid #E5E7EB" }}
    >
      <div className="container mx-auto w-full max-w-6xl min-w-0 px-4 md:px-6">
        <div className="grid gap-8 sm:gap-12 md:grid-cols-4">
          <div className="min-w-0 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: "#2563EB" }}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold" style={{ color: "#111827" }}>
                SmartBrick
              </span>
            </Link>
            <p className="mt-4 text-sm" style={{ color: "#6B7280" }}>
              SmartBrick is a real estate trading platform enabling fractional
              ownership and transparent investing.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="transition-opacity hover:opacity-80" style={{ color: "#6B7280" }} aria-label="Share">
                <Share2 className="h-5 w-5" />
              </a>
              <a href="#" className="transition-opacity hover:opacity-80" style={{ color: "#6B7280" }} aria-label="Globe">
                <Globe className="h-5 w-5" />
              </a>
              <a href="#" className="transition-opacity hover:opacity-80" style={{ color: "#6B7280" }} aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold" style={{ color: "#111827" }}>Platform</h4>
            <ul className="mt-4 space-y-3">
              {FOOTER_PLATFORM.map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm transition-colors hover:opacity-80" style={{ color: "#6B7280" }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold" style={{ color: "#111827" }}>Company</h4>
            <ul className="mt-4 space-y-3">
              {FOOTER_COMPANY.map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm transition-colors hover:opacity-80" style={{ color: "#6B7280" }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold" style={{ color: "#111827" }}>Legal</h4>
            <ul className="mt-4 space-y-3">
              {FOOTER_LEGAL.map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm transition-colors hover:opacity-80" style={{ color: "#6B7280" }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row"
          style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
        >
          <p className="text-sm">© 2024 SmartBrick Technologies Private Limited. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <Link to="#" className="hover:underline" style={{ color: "#6B7280" }}>Privacy Policy</Link>
            <span aria-hidden>|</span>
            <Link to="#" className="hover:underline" style={{ color: "#6B7280" }}>Terms of Service</Link>
            <span aria-hidden>|</span>
            <Link to="#" className="hover:underline" style={{ color: "#6B7280" }}>Help Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
