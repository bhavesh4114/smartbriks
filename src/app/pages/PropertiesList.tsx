import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { SiteHeader } from "../components/layout/SiteHeader";
import { SiteFooter } from "../components/layout/SiteFooter";
import { MapPin, ChevronRight } from "lucide-react";
import { formatINRNumber } from "../utils/currency";

type PropertyItem = {
  id: number;
  name: string;
  location: string;
  type: string;
  minInvestment: number;
  targetReturn: number;
  image: string;
};

const INVESTMENT_RANGES = [
  { label: "All", min: 0, max: Infinity },
  { label: "Up to ₹1,000", min: 0, max: 1000 },
  { label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { label: "₹2,500 – ₹5,000", min: 2500, max: 5000 },
  { label: "₹5,000+", min: 5000, max: Infinity },
];
const RETURN_RANGES = [
  { label: "Any", min: 0, max: Infinity },
  { label: "9%+", min: 9, max: Infinity },
  { label: "11%+", min: 11, max: Infinity },
  { label: "13%+", min: 13, max: Infinity },
];

// --------------------------------------------
// Hero (match Home page)
// --------------------------------------------
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&h=1080&fit=crop";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = (delay = 0.05) => ({
  visible: {
    transition: { staggerChildren: delay, delayChildren: 0.1 },
  },
});

// --------------------------------------------
// Animation
// --------------------------------------------
const viewport = { once: true, margin: "-40px" };

// --------------------------------------------
// Properties List Page
// --------------------------------------------
export default function PropertiesList() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion ?? false;

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState("All");
  const [propertyType, setPropertyType] = useState("All");
  const [investmentRange, setInvestmentRange] = useState(0);
  const [returnRange, setReturnRange] = useState(0);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/projects?status=APPROVED");
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setError(data?.message || "Failed to load properties.");
          setProperties([]);
          return;
        }
        const rows = Array.isArray(data?.data) ? data.data : [];
        const mapped = rows.map((p: any) => {
          const title = String(p.title ?? "Untitled Project");
          const inferredType =
            /commercial|plaza|tower|park|business/i.test(title) ? "Commercial" : "Residential";
          return {
            id: Number(p.id),
            name: title,
            location: p.location || "TBD",
            type: p.projectType || inferredType,
            minInvestment: Number(p.minInvestment ?? 0),
            targetReturn: Number(p.expectedROI ?? 0),
            image: p.images?.[0] ? `/api/uploads/${p.images[0]}` : HERO_IMAGE,
          };
        });
        setProperties(mapped);
      } catch {
        setError("Network error while loading properties.");
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const locations = useMemo(() => {
    const values = new Set(properties.map((p) => p.location).filter(Boolean));
    return ["All", ...Array.from(values)];
  }, [properties]);

  const propertyTypes = useMemo(() => {
    const values = new Set(properties.map((p) => p.type).filter(Boolean));
    return ["All", ...Array.from(values)];
  }, [properties]);

  const filtered = useMemo(() => {
    const inv = INVESTMENT_RANGES[investmentRange];
    const ret = RETURN_RANGES[returnRange];
    return properties.filter((p) => {
      if (location !== "All" && p.location !== location) return false;
      if (propertyType !== "All" && p.type !== propertyType) return false;
      if (p.minInvestment < inv.min || (inv.max !== Infinity && p.minInvestment > inv.max)) return false;
      if (p.targetReturn < ret.min) return false;
      return true;
    });
  }, [location, propertyType, investmentRange, returnRange, properties]);

  const cardHover = noMotion ? {} : { y: -4 };

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-white font-sans antialiased">
      <SiteHeader />

      <main>
        {/* Hero – same structure as Home page */}
        <section className="relative flex min-h-[70dvh] items-center overflow-hidden py-12 sm:min-h-[85dvh] sm:py-16 md:min-h-[100dvh] lg:py-24">
          {/* Background image + overlay (same as Home) */}
          <div className="absolute inset-0">
            <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover object-center" />
            <div
              className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-transparent"
              aria-hidden
            />
          </div>

          <div className="relative z-10 mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-center gap-8 px-4 pt-20 pb-8 sm:gap-10 sm:px-6 sm:pt-24 md:pb-0 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-0">
            {/* Left: copy + CTAs (same layout as Home) */}
            <div className="min-w-0 w-full">
              <motion.div
                variants={noMotion ? { hidden: {}, visible: { transition: { staggerChildren: 0, delayChildren: 0 } } } : stagger(0.08)}
                initial="hidden"
                animate="visible"
                className="flex w-full flex-col"
              >
                <motion.h1
                  variants={noMotion ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } } : fadeUp}
                  className="w-full break-words text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
                >
                  Discover High-Growth Investment Opportunities
                </motion.h1>

                <motion.p
                  variants={noMotion ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } } : fadeUp}
                  className="mt-4 w-full max-w-xl text-base text-slate-300 sm:mt-6 sm:text-lg md:text-xl"
                >
                  Explore carefully curated commercial and residential assets designed for steady rental income and long-term appreciation.
                </motion.p>
              </motion.div>
            </div>

            {/* Right: featured property card (same as Home) */}
            <div className="w-full min-w-0 max-w-full lg:max-w-none">
              <div className="mx-auto w-full max-w-full lg:mx-0 lg:max-w-sm">
                <PropertiesHeroCard />
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b border-[#E5E7EB] bg-[#F8FAFC] px-4 py-6 md:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
              <div className="min-w-0 flex-1 sm:max-w-[180px]">
                <label className="mb-1 block text-sm font-medium text-[#6B7280]">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1 sm:max-w-[160px]">
                <label className="mb-1 block text-sm font-medium text-[#6B7280]">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                >
                  {propertyTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1 sm:max-w-[200px]">
                <label className="mb-1 block text-sm font-medium text-[#6B7280]">Investment Range</label>
                <select
                  value={investmentRange}
                  onChange={(e) => setInvestmentRange(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                >
                  {INVESTMENT_RANGES.map((r, i) => (
                    <option key={r.label} value={i}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1 sm:max-w-[140px]">
                <label className="mb-1 block text-sm font-medium text-[#6B7280]">Expected Returns</label>
                <select
                  value={returnRange}
                  onChange={(e) => setReturnRange(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                >
                  {RETURN_RANGES.map((r, i) => (
                    <option key={r.label} value={i}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section id="properties-grid" className="px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#FCA5A5] bg-red-50 px-6 py-16 text-center text-red-700"
              >
                {error}
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-6 py-16 text-center"
              >
                <p className="text-lg font-medium text-[#111827]">No properties match your filters.</p>
                <p className="mt-2 text-[#6B7280]">Try adjusting the filters above.</p>
              </motion.div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((property, i) => (
                  <motion.article
                    key={property.id}
                    initial={noMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewport}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
                    whileHover={cardHover}
                    className="group min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition-shadow hover:shadow-xl"
                  >
                    <Link to={`/investor/projects/${property.id}`} className="block">
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <img
                          src={property.image}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute right-2 top-2 rounded-lg bg-[#2563EB] px-2 py-1 text-xs font-semibold text-white">
                          {property.targetReturn}% target
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-[#111827]">{property.name}</h3>
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-[#6B7280]">
                          <MapPin className="h-4 w-4 shrink-0" />
                          {property.location}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm">
                          <span className="text-[#6B7280]">
                            Min. <span className="font-semibold text-[#111827]">₹{formatINRNumber(property.minInvestment)}</span>
                          </span>
                          <span className="text-[#6B7280]">
                            <span className="font-semibold text-[#111827]">{property.targetReturn}%</span> target return
                          </span>
                        </div>
                        <span className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]">
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

// --------------------------------------------
// Hero featured card (same as Home page FloatingPropertyCard)
// --------------------------------------------
function PropertiesHeroCard() {
  return (
    <motion.div
      className="relative w-full max-w-full min-w-0 md:max-w-sm"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <motion.div
        className="min-w-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-[1px] shadow-2xl backdrop-blur-xl"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.03, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)" }}
      >
        <div className="rounded-2xl bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-700">
            <img
              src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=450&fit=crop"
              alt="Featured property"
              className="h-full w-full object-cover"
            />
            <div className="absolute left-2 top-2 rounded-lg bg-[#2563eb] px-2 py-1 text-xs font-semibold text-white">
              FEATURED
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-bold text-white">Skyline Business Tower</h3>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Commercial • Dubai, UAE
            </p>
            <ul className="flex flex-wrap gap-3 text-sm text-slate-300">
              <li><span className="text-slate-500">Occupancy</span> 94%</li>
              <li><span className="text-slate-500">Target return</span> 11.8%</li>
              <li><span className="text-slate-500">Min.</span> ₹1,000</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --------------------------------------------
// Loading skeleton
// --------------------------------------------
function LoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white"
        >
          <div className="aspect-[4/3] animate-pulse bg-slate-200" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="flex gap-3">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
